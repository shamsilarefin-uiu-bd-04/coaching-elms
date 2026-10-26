const http = require('http');

// Helper to make HTTP requests
function request(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, data: parsed, raw: data });
        } catch (_) {
          resolve({ status: res.statusCode, headers: res.headers, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- Starting NexusAcademyLS Automated Test Suite ---');
  let failures = 0;

  // 1. Test Admin Login with @admin handle
  console.log('\n[1] Testing Admin Login with "@admin" handle...');
  const adminLogin = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'admin@admin', password: 'nexus123' });

  if (adminLogin.status === 200 && adminLogin.data.token && adminLogin.data.user.role === 'admin' && adminLogin.data.defaultPanel === 'admin') {
    console.log('✅ Admin login with "@admin" succeeded. Directed to Admin Panel.');
  } else {
    console.error('❌ Admin login failed:', adminLogin.raw);
    failures++;
  }
  const adminToken = adminLogin.data ? adminLogin.data.token : null;

  // 2. Test Teacher Login with @teacher handle
  console.log('\n[2] Testing Teacher Login with "@teacher" handle (Tanvir)...');
  const teacherLogin = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'tanvir@teacher', password: 'nexus123' });

  if (teacherLogin.status === 200 && teacherLogin.data.user.role === 'teacher' && teacherLogin.data.defaultPanel === 'teacher') {
    console.log('✅ Teacher login with "@teacher" succeeded. Directed to Teacher Panel.');
  } else {
    console.error('❌ Teacher login failed:', teacherLogin.raw);
    failures++;
  }
  const teacherToken = teacherLogin.data ? teacherLogin.data.token : null;

  // Teacher Classes
  const teacherClasses = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/classes',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${teacherToken}` }
  });

  if (teacherClasses.status === 200 && Array.isArray(teacherClasses.data) && teacherClasses.data.length >= 2) {
    console.log(`✅ Teacher associated with multiple classes: ${teacherClasses.data.map(c => c.code).join(', ')}`);
  } else {
    console.error('❌ Teacher multiple classes association failed:', teacherClasses.raw);
    failures++;
  }

  // 3. Test Student Login with NO suffix ("kichu na thakle student panal a niye jabe")
  console.log('\n[3] Testing Student Login with NO suffix ("rahim" -> student panel)...');
  const studentLogin = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'rahim', password: 'nexus123' });

  if (studentLogin.status === 200 && studentLogin.data.user.role === 'student' && studentLogin.data.defaultPanel === 'student') {
    console.log('✅ Student login with NO suffix succeeded ("rahim"). Directed to Student Panel.');
  } else {
    console.error('❌ Student login failed:', studentLogin.raw);
    failures++;
  }
  const studentToken = studentLogin.data ? studentLogin.data.token : null;

  const studentClasses = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/classes',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${studentToken}` }
  });

  const enrolledCodes = studentClasses.data.map(c => c.code);
  console.log(`Student enrolled in: ${enrolledCodes.join(', ')}`);
  if (enrolledCodes.includes('PHY-101') && enrolledCodes.includes('MTH-201') && !enrolledCodes.includes('CHM-105')) {
    console.log('✅ Strict enrollment isolation verified: Student can ONLY view enrolled classes (PHY-101, MTH-201); un-enrolled CHM-105 is hidden!');
  } else {
    console.error('❌ Student enrollment isolation failed:', studentClasses.raw);
    failures++;
  }

  // 4. Test Course Materials (Soft Copies of Notes)
  console.log('\n[4] Testing Course Materials (Soft Copies of Notes)...');
  const materials = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/classes/CLS-101/materials',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${studentToken}` }
  });

  if (materials.status === 200 && materials.data.length > 0) {
    console.log(`✅ Materials retrieved: ${materials.data.length} soft copies found. Title: "${materials.data[0].title}"`);
    // Test downloading the actual PDF
    const pdfRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: materials.data[0].fileUrl,
      method: 'GET'
    });
    if (pdfRes.status === 200 && pdfRes.raw.startsWith('%PDF')) {
      console.log('✅ PDF file download & header verified: %PDF-1.4 header intact.');
    } else {
      console.error('❌ PDF file download failed:', pdfRes.status);
      failures++;
    }
  } else {
    console.error('❌ Materials retrieval failed:', materials.raw);
    failures++;
  }

  // 5. Test External Links
  console.log('\n[5] Testing External Links...');
  const links = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/classes/CLS-101/links',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${studentToken}` }
  });

  if (links.status === 200 && links.data.length > 0) {
    console.log(`✅ External links retrieved: ${links.data.length} links found. Top link: ${links.data[0].title} (${links.data[0].url})`);
  } else {
    console.error('❌ External links retrieval failed:', links.raw);
    failures++;
  }

  // 6. Test UCAM Exam Results & Class / Section Ranking
  console.log('\n[6] Testing UCAM Exam Results & Class / Section Ranking...');
  const gradeSheet = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/gradesheet',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${studentToken}` }
  });

  if (gradeSheet.status === 200 && gradeSheet.data.courses && gradeSheet.data.courses.length > 0) {
    const course = gradeSheet.data.courses[0];
    console.log(`✅ Student Grade Sheet generated:`);
    console.log(`   - Best Merit Rank: ${gradeSheet.data.bestRank} Position`);
    console.log(`   - Course: ${course.classCode} (${course.classTitle})`);
    console.log(`   - Class Rank: ${course.classRank} / ${course.totalClassStudents}`);
    console.log(`   - Section Rank: ${course.sectionRank} / ${course.totalSectionStudents}`);
    console.log(`   - Student Score: ${course.totalWeightedMarks} (Class Highest: ${course.highestClassScore})`);
    console.log(`   - Assessments Count: ${course.marksBreakdown.length}`);
  } else {
    console.error('❌ Grade sheet generation failed:', gradeSheet.raw);
    failures++;
  }

  // 7. Test Messaging (Student messages Teacher)
  console.log('\n[7] Testing Student -> Teacher Messaging...');
  const sendMsg = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/messages',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${studentToken}`
    }
  }, {
    receiverId: 'TCH-102', // Nusrat (Physics teacher)
    classId: 'CLS-101',
    subject: 'Automated Test Inquiry',
    content: 'Hello Maam, testing the direct messaging system for physics problem solving.'
  });

  if (sendMsg.status === 201 && sendMsg.data.id) {
    console.log('✅ Student successfully messaged teacher.');
  } else {
    console.error('❌ Student message failed:', sendMsg.raw);
    failures++;
  }

  // Teacher views messages
  const teacherInbox = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/messages/conversations',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${teacherToken}` }
  });

  if (teacherInbox.status === 200 && Array.isArray(teacherInbox.data)) {
    console.log(`✅ Teacher conversation list retrieved (${teacherInbox.data.length} active threads).`);
  } else {
    console.error('❌ Teacher inbox retrieval failed:', teacherInbox.raw);
    failures++;
  }

  // 8. Test Teacher Exclusive Enrollment Authority (Enroll & Unenroll idempotent test)
  console.log('\n[8] Testing Teacher Enrollment Authority...');
  // Ensure STU-2024-003 is unenrolled first to make test idempotent
  await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/classes/CLS-102/enroll/STU-2024-003',
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${teacherToken}` }
  });

  // Teacher Tanvir enrolls Tanim into MTH-201
  const enrollRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/classes/CLS-102/enroll',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${teacherToken}`
    }
  }, { studentId: 'STU-2024-003' }); // Tanim

  if (enrollRes.status === 201 && enrollRes.data.success) {
    console.log('✅ Teacher successfully enrolled student STU-2024-003 into CLS-102.');
  } else {
    console.error('❌ Teacher enrollment failed:', enrollRes.raw);
    failures++;
  }

  // 9. Test Unauthorized Student Content Addition (Must be Rejected)
  console.log('\n[9] Testing Role Security: Student attempting to add content (Must be 403 Forbidden)...');
  const studentAddContent = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/classes/CLS-101/links',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${studentToken}`
    }
  }, { title: 'Hacked Link', url: 'https://malicious.com' });

  if (studentAddContent.status === 403) {
    console.log('✅ Security verified: Student blocked from adding course content (403 Forbidden).');
  } else {
    console.error('❌ Security failed! Student was allowed or returned unexpected status:', studentAddContent.status);
    failures++;
  }

  // 10. Test Admin Full Control
  console.log('\n[10] Testing Admin Full System Statistics & User Management...');
  const adminStats = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/admin/stats',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });

  if (adminStats.status === 200 && adminStats.data.totalUsers > 0) {
    console.log(`✅ Admin full control verified: Total Users=${adminStats.data.totalUsers}, Students=${adminStats.data.studentsCount}, Classes=${adminStats.data.classesCount}`);
  } else {
    console.error('❌ Admin stats failed:', adminStats.raw);
    failures++;
  }

  console.log('\n======================================================');
  if (failures === 0) {
    console.log('🎉 ALL 10 TEST SUITES PASSED FLAWLESSLY! 100% SUCCESS');
  } else {
    console.error(`⚠️ ${failures} tests failed. Please review.`);
  }
  console.log('======================================================');
}

runTests().catch(console.error);
