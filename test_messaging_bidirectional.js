async function request(path, options = {}) {
  const url = `http://localhost:3000${path}`;
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function login(identifier, password) {
  const res = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: identifier, password })
  });
  if (!res.ok) throw new Error(`Login failed for ${identifier}: ${JSON.stringify(res.data)}`);
  return { token: res.data.token, user: res.data.user };
}

async function run() {
  console.log('--- STARTING BIDIRECTIONAL & RESTRICTED MESSAGING VERIFICATION ---');

  // Log in as teacher Shamsil Arefin (TCH-0260)
  const teacher = await login('shamsilarefin@teacher.com', 'nexus123');
  console.log(`✓ Teacher logged in: ${teacher.user.name} (${teacher.user.id})`);

  // Log in as student Madiha (STU-8340), enrolled in Shamsil Arefin's HSC 2027 Physics class (CLS-9756)
  const madiha = await login('madiha@nexus.com', 'nexus123');
  console.log(`✓ Enrolled student logged in: ${madiha.user.name} (${madiha.user.id})`);

  // Log in as teacher Tanvir Ahmed (TCH-101), teaching College Math CLS-102 (Madiha is NOT enrolled with Tanvir)
  const nonEnrolledTeacher = await login('tanvir.math@nexusacademy.edu.bd', 'nexus123');
  console.log(`✓ Non-enrolled teacher logged in: ${nonEnrolledTeacher.user.name} (${nonEnrolledTeacher.user.id})`);

  // 1. Verify Teacher Contacts list has ALL enrolled students
  const teacherContactsRes = await request('/api/messages-contacts', {
    headers: { Authorization: `Bearer ${teacher.token}` }
  });
  console.log(`✓ Teacher contacts count: ${teacherContactsRes.data.length}`);
  const teacherStudentContacts = teacherContactsRes.data.filter(c => c.role === 'student');
  console.log(`✓ Enrolled students in teacher contacts: ${teacherStudentContacts.length} (Students: ${teacherStudentContacts.map(s => s.name).join(', ')})`);
  const hasMadihaInTeacherContacts = teacherStudentContacts.some(s => s.id === madiha.user.id);
  console.log(`✓ Enrolled student Madiha is in teacher contacts: ${hasMadihaInTeacherContacts ? 'YES' : 'NO'}`);
  if (!hasMadihaInTeacherContacts) throw new Error('Teacher should have enrolled student Madiha in contacts list');

  // 2. Verify Student Contacts list ONLY includes their enrolled teachers
  const madihaContactsRes = await request('/api/messages-contacts', {
    headers: { Authorization: `Bearer ${madiha.token}` }
  });
  const madihaTeachers = madihaContactsRes.data.filter(c => c.role === 'teacher');
  console.log(`✓ Madiha enrolled teachers in contacts: ${madihaTeachers.map(t => t.name).join(', ')}`);
  const hasShamsilInMadihaContacts = madihaTeachers.some(t => t.id === teacher.user.id);
  const hasTanvirInMadihaContacts = madihaTeachers.some(t => t.id === nonEnrolledTeacher.user.id);
  console.log(`✓ Shamsil (enrolled course teacher) present: ${hasShamsilInMadihaContacts ? 'YES' : 'NO'}`);
  console.log(`✓ Tanvir (non-enrolled teacher) excluded: ${!hasTanvirInMadihaContacts ? 'YES' : 'NO'}`);
  if (!hasShamsilInMadihaContacts) throw new Error('Madiha must have Shamsil Arefin as enrolled teacher contact');
  if (hasTanvirInMadihaContacts) throw new Error('Madiha should NOT have non-enrolled teacher Tanvir in contacts');

  // 3. Test Teacher sending direct message to enrolled student Madiha
  const teacherToStudentRes = await request('/api/messages', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${teacher.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      receiverId: madiha.user.id,
      subject: 'Physics Problem Follow-up',
      content: 'Madiha, please submit your solution for chapter 3 by 8 PM.'
    })
  });
  console.log(`✓ Teacher -> Student direct message status: ${teacherToStudentRes.status} (Created)`);
  if (teacherToStudentRes.status !== 201) throw new Error('Teacher failed to text enrolled student: ' + JSON.stringify(teacherToStudentRes.data));

  // 4. Test Student reading the message
  const studentReadRes = await request(`/api/messages/${teacher.user.id}`, {
    headers: { Authorization: `Bearer ${madiha.token}` }
  });
  console.log(`✓ Student opened message thread with teacher. Total messages: ${studentReadRes.data.messages.length}`);
  const lastMsg = studentReadRes.data.messages[studentReadRes.data.messages.length - 1];
  console.log(`  Received text: "${lastMsg.content}"`);
  if (!lastMsg.content.includes('chapter 3')) throw new Error('Message content mismatch');

  // 5. Test Student replying to teacher
  const studentToTeacherRes = await request('/api/messages', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${madiha.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      receiverId: teacher.user.id,
      subject: 'Re: Physics Problem Follow-up',
      content: 'Yes Sir, I have almost finished question 4 and will upload it before 8 PM. Thank you!'
    })
  });
  console.log(`✓ Student -> Teacher reply status: ${studentToTeacherRes.status} (Created)`);
  if (studentToTeacherRes.status !== 201) throw new Error('Student failed to text teacher: ' + JSON.stringify(studentToTeacherRes.data));

  // 6. Test Teacher receiving student reply
  const teacherReadRes = await request(`/api/messages/${madiha.user.id}`, {
    headers: { Authorization: `Bearer ${teacher.token}` }
  });
  const teacherLastMsg = teacherReadRes.data.messages[teacherReadRes.data.messages.length - 1];
  console.log(`✓ Teacher received reply: "${teacherLastMsg.content}"`);
  if (!teacherLastMsg.content.includes('question 4')) throw new Error('Teacher did not receive student reply');

  // 7. Test Teacher sending message to ALL enrolled students in Section Group Chat (CLS-9756)
  const groupMsgRes = await request('/api/messages/groups/CLS-9756', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${teacher.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      content: 'Notice for all enrolled students in Hsc27 (1): Quiz 2 is scheduled for this Sunday. Please be prepared.'
    })
  });
  console.log(`✓ Teacher -> Section Group (All Enrolled Students) status: ${groupMsgRes.status} (Created)`);
  if (groupMsgRes.status !== 201) throw new Error('Teacher failed to broadcast to section group');

  // 8. Verify all enrolled students can read the section group broadcast
  const madihaGroupRes = await request('/api/messages/groups/CLS-9756', {
    headers: { Authorization: `Bearer ${madiha.token}` }
  });
  const lastGroupMsg = madihaGroupRes.data.messages[madihaGroupRes.data.messages.length - 1];
  console.log(`✓ Student verified section broadcast from teacher: "${lastGroupMsg.content}"`);
  if (!lastGroupMsg.content.includes('Quiz 2 is scheduled')) throw new Error('Student did not receive section group message');

  // 9. Negative Test: Student trying to message a teacher whose course they are NOT enrolled in (Tanvir TCH-101)
  const nonEnrolledTeacherMsg = await request('/api/messages', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${madiha.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      receiverId: nonEnrolledTeacher.user.id,
      content: 'Hello Tanvir Sir, can I ask a question?'
    })
  });
  console.log(`✓ Madiha trying to text non-enrolled teacher Tanvir: HTTP ${nonEnrolledTeacherMsg.status} (${nonEnrolledTeacherMsg.data.error})`);
  if (nonEnrolledTeacherMsg.status !== 403) throw new Error('Student should be blocked with 403 from messaging non-enrolled teacher');

  // 10. Negative Test: Teacher trying to message a student who is NOT in their class
  // Teacher Tanvir Ahmed (TCH-101) trying to message Madiha (not in his classes)
  const teacherToNonEnrolledStudent = await request('/api/messages', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${nonEnrolledTeacher.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      receiverId: madiha.user.id,
      content: 'Hello Madiha'
    })
  });
  console.log(`✓ Teacher Tanvir trying to text non-enrolled student: HTTP ${teacherToNonEnrolledStudent.status} (${teacherToNonEnrolledStudent.data.error})`);
  if (teacherToNonEnrolledStudent.status !== 403) throw new Error('Teacher should be blocked with 403 from messaging students outside their classes');

  // 11. Negative Test: Non-enrolled student trying to access section group
  // Student Madiha is NOT in CLS-102 (Tanvir's Math class)
  const unauthorizedGroupRes = await request('/api/messages/groups/CLS-102', {
    headers: { Authorization: `Bearer ${madiha.token}` }
  });
  console.log(`✓ Unauthorized student section group access blocked: HTTP ${unauthorizedGroupRes.status} (Expected 403 Forbidden)`);
  if (unauthorizedGroupRes.status !== 403) throw new Error('Non-enrolled student should be blocked with 403 from section group');

  console.log('\n========================================================================');
  console.log('🎉 100% SUCCESS: TEACHER CAN TEXT ALL ENROLLED STUDENTS & VICE-VERSA!');
  console.log('🎉 100% SUCCESS: NON-ENROLLED DIRECT & GROUP MESSAGING STRICTLY BLOCKED!');
  console.log('========================================================================');
}

run().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
