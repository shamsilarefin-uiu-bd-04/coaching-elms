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

function del(path, token) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path,
      method: 'DELETE',
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
  console.log('=== TEST: Strict Teacher Direct Messaging & Course Removal from Group Chat ===\n');

  // Admin login to inspect all teachers
  const adminLogin = await post('/api/auth/login', { email: 'admin@admin.com', password: 'nexus123', role: 'admin' });
  const adminToken = adminLogin.body.token;
  const adminUsersRes = await get('/api/admin/users', adminToken);
  const allTeachers = adminUsersRes.body.filter(u => u.role === 'teacher');
  console.log(`Academy has ${allTeachers.length} total teachers: ${allTeachers.map(t => `${t.name} [${t.id}]`).join(', ')}`);

  // Student login: Madiha
  const studentLogin = await post('/api/auth/login', { email: 'madiha@nexus.com', password: 'nexus123', role: 'student' });
  const studentToken = studentLogin.body.token;
  const studentUser = studentLogin.body.user;
  console.log(`\nLogged in Student: ${studentUser.name} (${studentUser.id})`);

  // 1. Check Student Enrolled Classes & Teachers
  const studentClassesRes = await get('/api/classes', studentToken);
  const studentClasses = studentClassesRes.body;
  const enrolledTeacherIds = new Set(studentClasses.map(c => c.teacherId));
  console.log(`Student enrolled classes count: ${studentClasses.length}`);
  console.log(`Student enrolled teachers: ${[...enrolledTeacherIds].join(', ')}`);

  // 2. Check Student Message Contacts
  const contactsRes = await get('/api/messages-contacts', studentToken);
  const contactTeachers = contactsRes.body.filter(c => c.role === 'teacher');
  console.log(`\nContacts returned for student: ${contactTeachers.length} teacher(s):`);
  contactTeachers.forEach(t => console.log(`  - ${t.name} (${t.id})`));

  // Verify that EVERY teacher in contacts is strictly an enrolled teacher
  for (const t of contactTeachers) {
    if (!enrolledTeacherIds.has(t.id)) {
      console.error(`FAILURE: Non-enrolled teacher ${t.name} (${t.id}) was found in student contacts!`);
      process.exit(1);
    }
  }
  console.log('✅ PASS: Only teachers of enrolled courses appear in student contacts.');

  // Find a teacher the student is NOT enrolled with
  const nonEnrolledTeacher = allTeachers.find(t => !enrolledTeacherIds.has(t.id));
  if (!nonEnrolledTeacher) {
    console.warn('Note: Student is currently enrolled with all teachers. Finding an un-enrolled pair...');
  } else {
    console.log(`\nTesting student direct messaging non-enrolled teacher: ${nonEnrolledTeacher.name} (${nonEnrolledTeacher.id})...`);
    const unauthorizedDirectMsg = await post('/api/messages', {
      receiverId: nonEnrolledTeacher.id,
      content: 'Hello Sir, can I ask a question?'
    }, studentToken);

    console.log(`Response status: ${unauthorizedDirectMsg.status}, error:`, unauthorizedDirectMsg.body.error);
    if (unauthorizedDirectMsg.status === 403) {
      console.log('✅ PASS: Direct message to non-enrolled teacher blocked with 403 Forbidden!');
    } else {
      console.error('FAILURE: Student was able to message a non-enrolled teacher!', unauthorizedDirectMsg);
      process.exit(1);
    }
  }

  // 3. Test Student direct messaging an enrolled teacher
  const enrolledTeacherId = [...enrolledTeacherIds][0];
  const enrolledTeacherObj = allTeachers.find(t => t.id === enrolledTeacherId);
  console.log(`\nTesting student direct messaging enrolled teacher: ${enrolledTeacherObj ? enrolledTeacherObj.name : enrolledTeacherId}...`);
  const authorizedDirectMsg = await post('/api/messages', {
    receiverId: enrolledTeacherId,
    content: 'Hello Sir, question regarding our lecture.'
  }, studentToken);

  if (authorizedDirectMsg.status === 201) {
    console.log('✅ PASS: Student can message enrolled teacher (Status: 201 Created).');
  } else {
    console.error('FAILURE: Could not message enrolled teacher:', authorizedDirectMsg);
    process.exit(1);
  }

  // 4. Test Course Removal -> Removed from Group Chat & Access Revoked
  console.log('\n--- Testing Course Removal -> Group Chat Ejection ---');
  // Pick a class where Madiha is enrolled that is taught by Shamsil Arefin (TCH-0260)
  const classToTest = studentClasses.find(c => c.teacherId === 'TCH-0260') || studentClasses[0];
  const assignedTeacherId = classToTest.teacherId;
  const assignedTeacherObj = allTeachers.find(t => t.id === assignedTeacherId);

  const teacherLogin = await post('/api/auth/login', {
    email: assignedTeacherObj.email,
    password: 'nexus123',
    role: 'teacher'
  });
  const teacherToken = teacherLogin.body.token;
  console.log(`Logged in as assigned teacher: ${assignedTeacherObj.name} (${assignedTeacherObj.id}) for class: ${classToTest.code} (${classToTest.section}) [${classToTest.id}]`);

  // Verify student is currently in section group
  const groupBefore = await get(`/api/messages/groups/${classToTest.id}`, studentToken);
  if (groupBefore.status !== 200) {
    console.error('FAILURE: Student cannot read initial group messages before removal');
    process.exit(1);
  }
  const initialMembersCount = groupBefore.body.group.memberCount;
  console.log(`Before removal: Group ${classToTest.code} (${classToTest.section}) has ${initialMembersCount} members.`);
  const isMemberBefore = groupBefore.body.group.members.some(m => m.id === studentUser.id);
  console.log(`Student in members list: ${isMemberBefore}`);

  // Now, Teacher removes student from this class
  console.log(`Teacher removing student ${studentUser.name} from class ${classToTest.id}...`);
  const removeRes = await del(`/api/classes/${classToTest.id}/enroll/${studentUser.id}`, teacherToken);
  if (removeRes.status !== 200) {
    console.error('FAILURE: Teacher failed to unenroll student:', removeRes);
    process.exit(1);
  }
  console.log(`Removal result:`, removeRes.body.message);

  // 5. Verify Student is now BLOCKED from group chat (GET 403 and POST 403)
  console.log('\nVerifying student access to group chat after removal:');
  const groupAfterGet = await get(`/api/messages/groups/${classToTest.id}`, studentToken);
  console.log(`Student GET group messages status: ${groupAfterGet.status} (${groupAfterGet.body ? groupAfterGet.body.error : ''})`);
  if (groupAfterGet.status === 403) {
    console.log('✅ PASS: Student blocked from viewing group messages after being removed from course.');
  } else {
    console.error('FAILURE: Student still has access to read group messages!', groupAfterGet);
    process.exit(1);
  }

  const groupAfterPost = await post(`/api/messages/groups/${classToTest.id}`, { content: 'Sneak test' }, studentToken);
  console.log(`Student POST group message status: ${groupAfterPost.status} (${groupAfterPost.body ? groupAfterPost.body.error : ''})`);
  if (groupAfterPost.status === 403) {
    console.log('✅ PASS: Student blocked from posting to group chat after being removed from course.');
  } else {
    console.error('FAILURE: Student was still able to post to group chat!', groupAfterPost);
    process.exit(1);
  }

  // 6. Check that the group is NO LONGER in the student's group list
  const studentGroupsAfter = await get('/api/messages/groups', studentToken);
  const stillHasGroup = studentGroupsAfter.body.some(g => g.classId === classToTest.id);
  if (!stillHasGroup) {
    console.log('✅ PASS: Removed class section group is completely gone from student group list.');
  } else {
    console.error('FAILURE: Removed group is still listed in student section groups!');
    process.exit(1);
  }

  // 7. Check Teacher's view of group: Member count decreased and student not in roster
  const teacherGroupAfter = await get(`/api/messages/groups/${classToTest.id}`, teacherToken);
  const isMemberAfter = teacherGroupAfter.body.group.members.some(m => m.id === studentUser.id);
  const newMemberCount = teacherGroupAfter.body.group.memberCount;
  console.log(`Teacher sees updated group members: ${newMemberCount} (decreased by 1)`);
  if (!isMemberAfter && newMemberCount === initialMembersCount - 1) {
    console.log('✅ PASS: Student is completely removed from the group member list.');
  } else {
    console.error('FAILURE: Student still listed in group members according to teacher view!');
    process.exit(1);
  }

  // 8. Re-enroll student back so system demo remains clean
  console.log(`\nRe-enrolling student back into ${classToTest.code} (${classToTest.section})...`);
  const reEnrollRes = await post(`/api/classes/${classToTest.id}/enroll`, { studentId: studentUser.id }, teacherToken);
  if (reEnrollRes.status === 201) {
    console.log('✅ Student successfully re-enrolled back into class.');
  }

  console.log('\n>>> ALL STRICT TEACHER MESSAGING & UNENROLLMENT TESTS PASSED 100%! <<<');
}

run().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
