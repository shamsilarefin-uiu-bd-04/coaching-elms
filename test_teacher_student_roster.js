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

async function runTests() {
  console.log('=== TEST 1: Teacher login & student list isolation ===');
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
  console.log(`Logged in as Teacher: ${teacherUser.name} (${teacherUser.id})`);

  // Get teacher's classes
  const teacherClassesRes = await get('/api/classes', teacherToken);
  const teacherClasses = teacherClassesRes.body;
  const teacherClassIds = teacherClasses.map(c => c.id);
  console.log(`Teacher's assigned classes: ${teacherClasses.map(c => `${c.code} [${c.id}]`).join(', ')}`);

  // Teacher fetches /api/students
  const teacherStudentsRes = await get('/api/students', teacherToken);
  console.log(`Teacher /api/students status: ${teacherStudentsRes.status}, count: ${teacherStudentsRes.body.length}`);

  // Verify that all returned students are enrolled in at least one of this teacher's classes
  for (const s of teacherStudentsRes.body) {
    const hasMyClass = s.enrolledClasses.some(ec => teacherClassIds.includes(ec.classId));
    if (!hasMyClass) {
      console.error(`FAILURE: Student ${s.name} (${s.id}) is not enrolled in any class taught by this teacher!`);
      process.exit(1);
    }
    // Verify that NO classes belonging to other teachers are in s.enrolledClasses
    const otherClasses = s.enrolledClasses.filter(ec => !teacherClassIds.includes(ec.classId));
    if (otherClasses.length > 0) {
      console.error(`FAILURE: Student ${s.name} has exposed foreign classes:`, otherClasses);
      process.exit(1);
    }
  }
  console.log('SUCCESS: Teacher student list is strictly isolated to their own sections and students!');

  // Test teacher attempting to query an unauthorized classId
  const adminLogin = await post('/api/auth/login', {
    email: 'admin@admin.com',
    password: 'nexus123',
    role: 'admin'
  });
  const adminToken = adminLogin.body.token;
  const allClassesRes = await get('/api/classes', adminToken);
  const foreignClass = allClassesRes.body.find(c => !teacherClassIds.includes(c.id));

  if (foreignClass) {
    console.log(`Testing teacher accessing foreign class: ${foreignClass.code} (${foreignClass.id})...`);
    const foreignStudentQuery = await get(`/api/students?classId=${foreignClass.id}`, teacherToken);
    if (foreignStudentQuery.status !== 403) {
      console.error(`FAILURE: Expected 403 when teacher queries foreign classId, got: ${foreignStudentQuery.status}`);
      process.exit(1);
    }
    console.log(`SUCCESS: Teacher receives 403 Forbidden when querying foreign classId.`);
  }

  console.log('\n=== TEST 2: Student classmate roster view ===');
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
  console.log(`Logged in as Student: ${studentUser.name} (${studentUser.id})`);

  // Student fetches their enrolled classes
  const studentClassesRes = await get('/api/classes', studentToken);
  const studentClasses = studentClassesRes.body;
  console.log(`Student enrolled in: ${studentClasses.map(c => `${c.code} (${c.section}) [${c.id}]`).join(', ')}`);

  if (studentClasses.length === 0) {
    console.error('FAILURE: Student has no enrolled classes to test with');
    process.exit(1);
  }

  const enrolledClassId = studentClasses[0].id;
  const classmatesRes = await get(`/api/classes/${enrolledClassId}/students`, studentToken);
  if (classmatesRes.status !== 200) {
    console.error(`FAILURE: Student could not fetch classmates for enrolled class ${enrolledClassId}:`, classmatesRes);
    process.exit(1);
  }
  console.log(`Classmates in ${studentClasses[0].code} (${studentClasses[0].section}): ${classmatesRes.body.length} students enrolled.`);
  console.log(`Roster sample:`, classmatesRes.body.map(c => `${c.studentName} (${c.studentId})`).join(', '));

  // Verify student cannot view /api/students (global endpoint)
  const studentGlobalStudentsRes = await get('/api/students', studentToken);
  if (studentGlobalStudentsRes.status !== 403) {
    console.error(`FAILURE: Expected 403 for student accessing /api/students, got: ${studentGlobalStudentsRes.status}`);
    process.exit(1);
  }
  console.log('SUCCESS: Student gets 403 Forbidden when trying to access global /api/students.');

  // Verify student cannot view roster of un-enrolled class
  if (foreignClass) {
    const unEnrolledRosterRes = await get(`/api/classes/${foreignClass.id}/students`, studentToken);
    if (unEnrolledRosterRes.status !== 403) {
      console.error(`FAILURE: Expected 403 for student accessing un-enrolled class roster, got: ${unEnrolledRosterRes.status}`);
      process.exit(1);
    }
    console.log(`SUCCESS: Student receives 403 Forbidden when trying to view roster of un-enrolled class ${foreignClass.id}.`);
  }

  console.log('\n=== TEST 3: Contacts isolation in messaging ===');
  const teacherContactsRes = await get('/api/messages-contacts', teacherToken);
  const teacherStudentsInContacts = teacherContactsRes.body.filter(c => c.role === 'student');
  console.log(`Teacher has ${teacherStudentsInContacts.length} student contacts.`);
  for (const s of teacherStudentsInContacts) {
    if (!s.isMyStudent) {
      console.error(`FAILURE: Teacher contacts include non-student: ${s.name} (${s.id})`);
      process.exit(1);
    }
  }
  console.log('SUCCESS: Teacher message contacts only contain students enrolled in their classes.');

  const studentContactsRes = await get('/api/messages-contacts', studentToken);
  const classmatesInContacts = studentContactsRes.body.filter(c => c.isClassmate);
  console.log(`Student has ${classmatesInContacts.length} classmates in message contacts.`);
  console.log('SUCCESS: Student message contacts contain enrolled classmates.');

  console.log('\n>>> ALL ROSTER & ISOLATION TESTS PASSED 100%! <<<');
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
