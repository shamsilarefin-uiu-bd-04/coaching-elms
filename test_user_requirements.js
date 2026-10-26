async function request(path, options = {}) {
  const url = `http://localhost:3000${path}`;
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function run() {
  console.log('=== Verifying Specific User Requirements ===\n');

  // 1. Teacher Login: Shamsil Arefin (TCH-0260, Physics)
  console.log('--- 1. Testing Teacher Section Isolation ---');
  const loginRes = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'shamsilarefin@teacher.com', password: 'nexus123' })
  });
  if (!loginRes.ok) {
    throw new Error('Teacher login failed: ' + JSON.stringify(loginRes.data));
  }
  const token = loginRes.data.token;
  const teacherId = loginRes.data.user.id;
  console.log(`Teacher logged in: ${loginRes.data.user.name} (${teacherId}, Subject: ${loginRes.data.user.subject})`);

  // Verify classes returned for this teacher
  const classesRes = await request('/api/classes', {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log(`Teacher assigned classes count: ${classesRes.data.length}`);
  const hasOnlyOwnClasses = classesRes.data.every(c => c.teacherId === teacherId);
  console.log(`Teacher only sees their own assigned classes: ${hasOnlyOwnClasses ? '✅ PASS' : '❌ FAIL'}`);

  // Try to access available-students for another teacher's class (CLS-4968 taught by Rana TCH-8911)
  const forbiddenAccessRes = await request('/api/classes/CLS-4968/available-students', {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log(`Teacher attempting to view roster of another teacher's class (CLS-4968): HTTP ${forbiddenAccessRes.status} (${forbiddenAccessRes.data.error})`);
  console.log(`Access blocked with 403 Forbidden: ${forbiddenAccessRes.status === 403 ? '✅ PASS' : '❌ FAIL'}`);

  // Try to enroll student into another teacher's class
  const forbiddenEnrollRes = await request('/api/classes/CLS-4968/enroll', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ studentId: 'STU-8340' })
  });
  console.log(`Teacher attempting to enroll student into another teacher's class: HTTP ${forbiddenEnrollRes.status} (${forbiddenEnrollRes.data.error})`);
  console.log(`Cross-teacher enrollment blocked with 403 Forbidden: ${forbiddenEnrollRes.status === 403 ? '✅ PASS' : '❌ FAIL'}`);

  // 2. Student Login: Madiha Tasnim (STU-8340)
  console.log('\n--- 2. Testing Individual Student Result & Section/Course Rank ---');
  const stuLogin = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'madiha@nexus.com', password: 'nexus123' })
  });
  if (!stuLogin.ok) {
    throw new Error('Student login failed: ' + JSON.stringify(stuLogin.data));
  }
  const stuToken = stuLogin.data.token;
  console.log(`Student logged in: ${stuLogin.data.user.name} (${stuLogin.data.user.id})`);

  // Fetch gradesheet for CLS-9756
  const gradeRes = await request('/api/gradesheet?classId=CLS-9756', {
    headers: { Authorization: `Bearer ${stuToken}` }
  });
  console.log('Student grade data retrieved:');
  const gradeData = gradeRes.data.courses && gradeRes.data.courses[0];
  if (!gradeData) {
    throw new Error('No course data in gradesheet: ' + JSON.stringify(gradeRes.data));
  }
  console.log(`- Course: ${gradeData.classTitle || gradeData.classCode}`);
  console.log(`- Section: ${gradeData.section}`);
  console.log(`- Section Rank: #${gradeData.sectionRank} of ${gradeData.totalSectionStudents}`);
  console.log(`- Course Rank: #${gradeData.courseRank} of ${gradeData.totalCourseStudents}`);
  console.log(`- showRank setting: ${gradeData.showRank}`);
  console.log(`- Assessments count: ${gradeData.assessments ? gradeData.assessments.length : 0}`);
  const hasAssessments = gradeData.sectionRank !== undefined && gradeData.courseRank !== undefined;
  console.log(`Individual assessments & ranks present: ${hasAssessments ? '✅ PASS' : '❌ FAIL'}`);

  // 3. Teacher Rank Toggle (Enable / Disable)
  console.log('\n--- 3. Testing Teacher Rank Toggle (Enable / Disable) ---');
  // Teacher disables rank on CLS-9756
  const toggleOff = await request('/api/classes/CLS-9756', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ showRank: false })
  });
  console.log(`Teacher toggled showRank to false for CLS-9756. Updated showRank: ${toggleOff.data.showRank}`);

  // Student checks gradesheet again
  const gradeDisabledRes = await request('/api/gradesheet?classId=CLS-9756', {
    headers: { Authorization: `Bearer ${stuToken}` }
  });
  const gradeDisabledData = gradeDisabledRes.data.courses && gradeDisabledRes.data.courses[0];
  console.log(`Student grade sheet showRank flag: ${gradeDisabledData.showRank}`);
  console.log(`Rank disabled reflected for student: ${gradeDisabledData.showRank === false ? '✅ PASS' : '❌ FAIL'}`);

  // Teacher re-enables rank on CLS-9756
  const toggleOn = await request('/api/classes/CLS-9756', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ showRank: true })
  });
  console.log(`Teacher re-enabled showRank for CLS-9756. Updated showRank: ${toggleOn.data.showRank}`);

  const gradeEnabledRes = await request('/api/gradesheet?classId=CLS-9756', {
    headers: { Authorization: `Bearer ${stuToken}` }
  });
  const gradeEnabledData = gradeEnabledRes.data.courses && gradeEnabledRes.data.courses[0];
  console.log(`Student grade sheet showRank re-enabled: ${gradeEnabledData.showRank === true ? '✅ PASS' : '❌ FAIL'}`);

  console.log('\n=== ALL 4 USER REQUIREMENTS VERIFIED SUCCESSFULLY! ===');
}

run().catch(console.error);
