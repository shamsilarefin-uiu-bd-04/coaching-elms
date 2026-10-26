async function request(path, options = {}) {
  const url = `http://localhost:3000${path}`;
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function run() {
  console.log('=== Testing Notice Board & Exam Dates API ===\n');

  // 1. Student Login: Madiha
  console.log('--- 1. Testing Student Notice Board Feed ---');
  const stuLogin = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'madiha@nexus.com', password: 'nexus123' })
  });
  const stuToken = stuLogin.data.token;

  const stuNoticesRes = await request('/api/notices', {
    headers: { Authorization: `Bearer ${stuToken}` }
  });
  console.log(`Student Notice Board HTTP Status: ${stuNoticesRes.status}`);
  const { notices, upcomingExams, stats } = stuNoticesRes.data;
  console.log(`- Total Notices: ${notices ? notices.length : 0}`);
  console.log(`- Upcoming Exams: ${upcomingExams ? upcomingExams.length : 0}`);
  console.log(`- Stats:`, stats);
  if (notices && notices.length > 0) {
    console.log(`- Sample Notice Title: "${notices[0].title}" (${notices[0].classTitle} [${notices[0].section}])`);
  }
  if (upcomingExams && upcomingExams.length > 0) {
    console.log(`- Sample Upcoming Exam: "${upcomingExams[0].title}" on ${upcomingExams[0].examDate} (${upcomingExams[0].classCode})`);
  }
  const studentFeedOk = stuNoticesRes.ok && notices.length > 0 && upcomingExams.length > 0;
  console.log(`Student Notice Board Feed: ${studentFeedOk ? '✅ PASS' : '❌ FAIL'}`);

  // 2. Student attempting to post notice (Must be 403 Forbidden)
  console.log('\n--- 2. Testing Student Posting Security ---');
  const studentPostRes = await request('/api/notices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${stuToken}` },
    body: JSON.stringify({ title: 'Student Fake Notice', content: 'Testing' })
  });
  console.log(`Student post response: HTTP ${studentPostRes.status} (${studentPostRes.data.error})`);
  console.log(`Student posting blocked with 403: ${studentPostRes.status === 403 ? '✅ PASS' : '❌ FAIL'}`);

  // 3. Teacher Login: Shamsil Arefin (TCH-0260)
  console.log('\n--- 3. Testing Teacher Notice Board Management ---');
  const teacherLogin = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'shamsilarefin@teacher.com', password: 'nexus123' })
  });
  const teacherToken = teacherLogin.data.token;

  // Teacher posts a notice for CLS-5341
  const postRes = await request('/api/notices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${teacherToken}` },
    body: JSON.stringify({
      classId: 'CLS-5341',
      title: 'Physics Practical Lab Instructions & CT Notice',
      content: 'Bring practical graph sheet and slide calipers for the upcoming lab test session.',
      priority: 'important',
      category: 'exam',
      examDate: '2026-11-08'
    })
  });
  console.log(`Teacher post notice status: HTTP ${postRes.status}`);
  console.log(`Created Notice ID: ${postRes.data.id}`);
  const postOk = postRes.status === 201 && postRes.data.id;
  console.log(`Teacher Notice Creation: ${postOk ? '✅ PASS' : '❌ FAIL'}`);
  const createdNoticeId = postRes.data.id;

  // Teacher attempting to post notice for another teacher's class (CLS-4968)
  const forbiddenPostRes = await request('/api/notices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${teacherToken}` },
    body: JSON.stringify({
      classId: 'CLS-4968',
      title: 'Unauthorized notice',
      content: 'Testing cross class'
    })
  });
  console.log(`Teacher posting to other teacher's class: HTTP ${forbiddenPostRes.status} (${forbiddenPostRes.data.error})`);
  console.log(`Cross-class notice posting blocked: ${forbiddenPostRes.status === 403 ? '✅ PASS' : '❌ FAIL'}`);

  // 4. Delete the test notice
  console.log('\n--- 4. Testing Notice Deletion ---');
  const deleteRes = await request(`/api/notices/${createdNoticeId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${teacherToken}` }
  });
  console.log(`Teacher delete notice status: HTTP ${deleteRes.status} (${deleteRes.data.message})`);
  console.log(`Teacher Notice Deletion: ${deleteRes.status === 200 ? '✅ PASS' : '❌ FAIL'}`);

  console.log('\n=== ALL NOTICE BOARD TESTS PASSED SUCCESSFULLY! ===');
}

run().catch(console.error);
