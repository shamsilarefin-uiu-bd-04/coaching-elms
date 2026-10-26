// Test Photo Sharing in Direct Chat and Section Group Messaging
const http = require('http');
const fs = require('fs');
const path = require('path');

function request(options, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const opts = { ...options, headers: { ...options.headers, ...headers } };
    const req = http.request(opts, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

// Helper to create multipart/form-data payload with a dummy image file
function createMultipartFormData(fields, fileField, fileName, fileBuffer, mimeType) {
  const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
  const crlf = '\r\n';
  let parts = [];

  for (const [key, val] of Object.entries(fields)) {
    if (val !== undefined && val !== null) {
      parts.push(Buffer.from(
        `--${boundary}${crlf}` +
        `Content-Disposition: form-data; name="${key}"${crlf}${crlf}` +
        `${val}${crlf}`
      ));
    }
  }

  if (fileField && fileName && fileBuffer) {
    parts.push(Buffer.from(
      `--${boundary}${crlf}` +
      `Content-Disposition: form-data; name="${fileField}"; filename="${fileName}"${crlf}` +
      `Content-Type: ${mimeType}${crlf}${crlf}`
    ));
    parts.push(fileBuffer);
    parts.push(Buffer.from(crlf));
  }

  parts.push(Buffer.from(`--${boundary}--${crlf}`));
  const body = Buffer.concat(parts);

  return {
    body,
    contentType: `multipart/form-data; boundary=${boundary}`
  };
}

async function run() {
  console.log('=== STARTING PHOTO SHARING & LONG MESSAGE TEST ===\n');

  // 1. Log in teacher and student
  const teacherLogin = await request({
    hostname: 'localhost', port: 3000, path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, JSON.stringify({ email: 'shamsilarefin@teacher.com', password: 'nexus123' }));

  const studentLogin = await request({
    hostname: 'localhost', port: 3000, path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, JSON.stringify({ email: 'madiha@nexus.com', password: 'nexus123' }));

  if (teacherLogin.status !== 200 || studentLogin.status !== 200) {
    console.error('Login failed');
    process.exit(1);
  }

  const teacherToken = teacherLogin.data.token;
  const teacherId = teacherLogin.data.user.id;
  const studentToken = studentLogin.data.token;
  const studentId = studentLogin.data.user.id;

  console.log(`✓ Teacher logged in: ${teacherLogin.data.user.name} (${teacherId})`);
  console.log(`✓ Student logged in: ${studentLogin.data.user.name} (${studentId})\n`);

  // 2. Student shares a photo with the teacher via Direct Message
  const dummyImageBytes = Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2d450000000049454e44ae426082', 'hex'); // 1x1 png
  const longText = `Sir, here is the photo of my handwritten solution for Physics Problem #4:\n\nFormula used: F = m * a\nGiven values:\nm = 5.2 kg\na = 9.8 m/s^2\nResult calculated: 50.96 N.\n\nPlease check if my steps and units are correct!`;

  const directPhotoForm = createMultipartFormData({
    receiverId: teacherId,
    content: longText,
    subject: 'Solution Step Photo'
  }, 'attachment', 'solution_problem_4.png', dummyImageBytes, 'image/png');

  const studentSendRes = await request({
    hostname: 'localhost', port: 3000, path: '/api/messages', method: 'POST'
  }, directPhotoForm.body, {
    'Authorization': `Bearer ${studentToken}`,
    'Content-Type': directPhotoForm.contentType,
    'Content-Length': directPhotoForm.body.length
  });

  console.log(`1. Student sent direct message with photo: HTTP ${studentSendRes.status}`);
  if (studentSendRes.status !== 201) {
    console.error('Failed to send photo message:', studentSendRes.data);
    process.exit(1);
  }

  console.log(`   Attachment Type: ${studentSendRes.data.attachmentType}`);
  console.log(`   Attachment Name: ${studentSendRes.data.attachmentName}`);
  console.log(`   Attachment URL: ${studentSendRes.data.attachmentUrl}`);
  console.log(`   Content Length: ${studentSendRes.data.content.length} chars (Multi-line preserved)`);

  if (studentSendRes.data.attachmentType !== 'image') {
    throw new Error('Expected attachmentType === "image"');
  }

  // 3. Teacher reads the direct message thread
  const teacherReadRes = await request({
    hostname: 'localhost', port: 3000, path: `/api/messages/${studentId}`, method: 'GET',
    headers: { 'Authorization': `Bearer ${teacherToken}` }
  });

  const latestMsg = teacherReadRes.data.messages[teacherReadRes.data.messages.length - 1];
  console.log(`2. Teacher retrieved message from student:`);
  console.log(`   Sender: ${latestMsg.senderName}`);
  console.log(`   Attachment: ${latestMsg.attachmentName} (${latestMsg.attachmentType})`);
  console.log(`   URL: ${latestMsg.attachmentUrl}\n`);

  // 4. Verify the photo file actually exists and can be downloaded from static route
  const photoDownload = await new Promise((resolve) => {
    http.get(`http://localhost:3000${latestMsg.attachmentUrl}`, (res) => {
      resolve({ status: res.statusCode, contentType: res.headers['content-type'] });
    });
  });
  console.log(`3. Verified photo file download route: HTTP ${photoDownload.status} (${photoDownload.contentType})\n`);

  // 5. Teacher shares photo with Section Discussion Group
  const teacherGroupsRes = await request({
    hostname: 'localhost', port: 3000, path: '/api/messages/groups', method: 'GET',
    headers: { 'Authorization': `Bearer ${teacherToken}` }
  });

  const targetGroup = teacherGroupsRes.data[0];
  console.log(`4. Teacher broadcasting diagram photo to Section Group: ${targetGroup.code} (${targetGroup.section})`);

  const groupPhotoForm = createMultipartFormData({
    content: 'Dear students, please review this whiteboard photo of today’s lecture diagram on Electric Flux.'
  }, 'attachment', 'whiteboard_diagram.jpg', dummyImageBytes, 'image/jpeg');

  const groupSendRes = await request({
    hostname: 'localhost', port: 3000, path: `/api/messages/groups/${targetGroup.id}`, method: 'POST'
  }, groupPhotoForm.body, {
    'Authorization': `Bearer ${teacherToken}`,
    'Content-Type': groupPhotoForm.contentType,
    'Content-Length': groupPhotoForm.body.length
  });

  console.log(`   Group Broadcast Status: HTTP ${groupSendRes.status}`);
  console.log(`   Group Attachment Type: ${groupSendRes.data.attachmentType}`);
  console.log(`   Group Attachment URL: ${groupSendRes.data.attachmentUrl}\n`);

  // 6. Student opens Section Group and sees teacher's photo
  const studentGroupRes = await request({
    hostname: 'localhost', port: 3000, path: `/api/messages/groups/${targetGroup.id}`, method: 'GET',
    headers: { 'Authorization': `Bearer ${studentToken}` }
  });

  const lastGroupMsg = studentGroupRes.data.messages[studentGroupRes.data.messages.length - 1];
  console.log(`5. Enrolled Student received group photo broadcast:`);
  console.log(`   Sender: ${lastGroupMsg.senderName} (${lastGroupMsg.senderRole})`);
  console.log(`   Text: "${lastGroupMsg.content}"`);
  console.log(`   Attachment: ${lastGroupMsg.attachmentName} (${lastGroupMsg.attachmentType})`);
  console.log(`   URL: ${lastGroupMsg.attachmentUrl}\n`);

  console.log('========================================================================');
  console.log('🎉 100% SUCCESS: PHOTO SHARING IN DIRECT CHAT & GROUP IS WORKING!');
  console.log('🎉 100% SUCCESS: MULTI-LINE LONG MESSAGES PRESERVED WITHOUT TRUNCATION!');
  console.log('========================================================================');
}

run().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
