const http = require('http');

function post(path, body, token = null) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    }, res => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(raw) });
        } catch (e) {
          resolve({ status: res.statusCode, raw });
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function get(path, token) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path,
      method: 'GET',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    }, res => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(raw) });
        } catch (e) {
          resolve({ status: res.statusCode, raw });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function run() {
  console.log('=== TEST: Section Discussion Groups (Teacher + Enrolled Students) ===\n');

  // 1. Student Login
  const studentLogin = await post('/api/auth/login', {
    email: 'madiha@nexus.com',
    password: 'nexus123',
    role: 'student'
  });
  if (studentLogin.status !== 200) {
    console.error('Student login failed:', studentLogin);
    process.exit(1);
  }
  const studentToken = studentLogin.body.token;
  const studentUser = studentLogin.body.user;
  console.log(`1. Logged in Student: ${studentUser.name} (${studentUser.id})`);

  // Student fetches section groups
  const studentGroupsRes = await get('/api/messages/groups', studentToken);
  if (studentGroupsRes.status !== 200) {
    console.error('Failed fetching student groups:', studentGroupsRes);
    process.exit(1);
  }
  const studentGroups = studentGroupsRes.body;
  console.log(`Student has ${studentGroups.length} enrolled section group(s):`);
  studentGroups.forEach(g => {
    console.log(`  - [${g.classId}] ${g.code} (${g.section}) - Teacher: ${g.teacherName} (${g.memberCount} members)`);
  });

  // Pick Shamsil's Physics class (CLS-9756) where both Madiha and Shamsil are members
  const testGroup = studentGroups.find(g => g.teacherName.toLowerCase().includes('shamsil')) || studentGroups[0];
  console.log(`\nTesting with section group: ${testGroup.code} (${testGroup.section}) [${testGroup.classId}] - Teacher: ${testGroup.teacherName}`);

  // Student fetches group details and messages
  const groupDetailsRes = await get(`/api/messages/groups/${testGroup.classId}`, studentToken);
  if (groupDetailsRes.status !== 200) {
    console.error('Failed fetching group details:', groupDetailsRes);
    process.exit(1);
  }
  console.log(`\nGroup fetched: ${groupDetailsRes.body.group.title} [Sec: ${groupDetailsRes.body.group.section}]`);
  console.log(`Current message count in group: ${groupDetailsRes.body.messages.length}`);

  // Student posts a question to the group
  const questionContent = `Assalamu Alaikum Sir, will our upcoming exam cover Chapter 1 vectors? [Timestamp: ${Date.now()}]`;
  const postQuestionRes = await post(`/api/messages/groups/${testGroup.classId}`, { content: questionContent }, studentToken);
  if (postQuestionRes.status !== 201) {
    console.error('Failed posting question to section group:', postQuestionRes);
    process.exit(1);
  }
  console.log(`\n2. Student posted message to group: "${postQuestionRes.body.content}"`);
  console.log(`   Sender: ${postQuestionRes.body.senderName} (${postQuestionRes.body.senderRole})`);

  // 2. Teacher Login
  const teacherLogin = await post('/api/auth/login', {
    email: 'shamsilarefin@teacher.com',
    password: 'nexus123',
    role: 'teacher'
  });
  if (teacherLogin.status !== 200) {
    console.error('Teacher login failed:', teacherLogin);
    process.exit(1);
  }
  const teacherToken = teacherLogin.body.token;
  const teacherUser = teacherLogin.body.user;
  console.log(`\n3. Logged in Teacher: ${teacherUser.name} (${teacherUser.id})`);

  // Teacher fetches group details and checks student's message
  const teacherGroupRes = await get(`/api/messages/groups/${testGroup.classId}`, teacherToken);
  if (teacherGroupRes.status !== 200) {
    console.error('Teacher failed fetching group messages:', teacherGroupRes);
    process.exit(1);
  }
  const teacherMessages = teacherGroupRes.body.messages;
  const foundQuestion = teacherMessages.find(m => m.content === questionContent);
  if (!foundQuestion) {
    console.error('FAILURE: Teacher did not receive student message in group chat!');
    process.exit(1);
  }
  console.log(`Teacher successfully sees student question: "${foundQuestion.content}"`);

  // Teacher replies in the group
  const answerContent = `Yes Madiha, Chapter 1 vector dot and cross products are both included. Best of luck!`;
  const postReplyRes = await post(`/api/messages/groups/${testGroup.classId}`, { content: answerContent }, teacherToken);
  if (postReplyRes.status !== 201) {
    console.error('Teacher failed posting reply to group:', postReplyRes);
    process.exit(1);
  }
  console.log(`\n4. Teacher replied in group: "${postReplyRes.body.content}"`);
  console.log(`   Sender: ${postReplyRes.body.senderName} (${postReplyRes.body.senderRole})`);

  // 3. Security & Isolation checks
  console.log('\n5. Security & Isolation Verification:');

  // Find another class where student is NOT enrolled
  const adminLogin = await post('/api/auth/login', { email: 'admin@admin.com', password: 'nexus123', role: 'admin' });
  const allClassesRes = await get('/api/classes', adminLogin.body.token);
  const studentEnrolledClassIds = studentGroups.map(g => g.classId);
  const unEnrolledClass = allClassesRes.body.find(c => !studentEnrolledClassIds.includes(c.id));

  if (unEnrolledClass) {
    console.log(`Testing student accessing unauthorized group: ${unEnrolledClass.code} (${unEnrolledClass.id})...`);
    const unauthorizedGet = await get(`/api/messages/groups/${unEnrolledClass.id}`, studentToken);
    if (unUnauthorizedStatusCheck(unauthorizedGet.status)) {
      console.log(`  ✅ Student blocked from reading un-enrolled group (Status: ${unauthorizedGet.status})`);
    } else {
      console.error('FAILURE: Student was able to access un-enrolled group!');
      process.exit(1);
    }

    const unauthorizedPost = await post(`/api/messages/groups/${unEnrolledClass.id}`, { content: 'Sneak' }, studentToken);
    if (unUnauthorizedStatusCheck(unauthorizedPost.status)) {
      console.log(`  ✅ Student blocked from posting to un-enrolled group (Status: ${unauthorizedPost.status})`);
    } else {
      console.error('FAILURE: Student was able to post to un-enrolled group!');
      process.exit(1);
    }
  }

  // Teacher isolation check
  const teacherAssignedClassIds = (await get('/api/classes', teacherToken)).body.map(c => c.id);
  const foreignTeacherClass = allClassesRes.body.find(c => !teacherAssignedClassIds.includes(c.id));

  if (foreignTeacherClass) {
    console.log(`Testing teacher accessing foreign group: ${foreignTeacherClass.code} (${foreignTeacherClass.id})...`);
    const foreignTeacherGet = await get(`/api/messages/groups/${foreignTeacherClass.id}`, teacherToken);
    if (unUnauthorizedStatusCheck(foreignTeacherGet.status)) {
      console.log(`  ✅ Teacher blocked from reading foreign group (Status: ${foreignTeacherGet.status})`);
    } else {
      console.error('FAILURE: Teacher was able to access foreign group!');
      process.exit(1);
    }
  }

  console.log('\n>>> ALL SECTION DISCUSSION GROUP TESTS PASSED 100%! <<<');
}

function unUnauthorizedStatusCheck(status) {
  return status === 403 || status === 401;
}

run().catch(err => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
