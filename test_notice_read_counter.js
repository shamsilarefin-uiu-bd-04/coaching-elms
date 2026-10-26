// Test Notice Read Tracking & Dynamic Badge Counter
const http = require('http');

function request(options, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const opts = { ...options, headers: { ...options.headers, ...headers } };
    const req = http.request(opts, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, ok: res.statusCode >= 200 && res.statusCode < 300, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, ok: res.statusCode >= 200 && res.statusCode < 300, data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function login(email, password) {
  const res = await request({
    hostname: 'localhost', port: 3000, path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, JSON.stringify({ email, password }));
  if (!res.ok) throw new Error(`Login failed for ${email}`);
  return { token: res.data.token, user: res.data.user };
}

async function run() {
  console.log('=== STARTING NOTICE READ TRACKING & BADGE COUNTER TEST ===\n');

  // 1. Log in student Madiha and teacher Shamsil
  const student = await login('madiha@nexus.com', 'nexus123');
  const teacher = await login('shamsilarefin@teacher.com', 'nexus123');

  console.log(`✓ Student logged in: ${student.user.name} (${student.user.id})`);
  console.log(`✓ Teacher logged in: ${teacher.user.name} (${teacher.user.id})\n`);

  // 2. Check student's current unread count
  const initialUnreadRes = await request({
    hostname: 'localhost', port: 3000, path: '/api/notices/unread-count', method: 'GET',
    headers: { Authorization: `Bearer ${student.token}` }
  });
  console.log(`1. Initial Student Unread Notices Count: ${initialUnreadRes.data.unreadCount}`);

  // 3. Mark all as read to start from clean zero state
  const markAllRes = await request({
    hostname: 'localhost', port: 3000, path: '/api/notices/mark-all-read', method: 'POST',
    headers: { Authorization: `Bearer ${student.token}` }
  });
  console.log(`2. Marked all notices as read for student: status ${markAllRes.status}`);

  // Verify unread count is 0 (Badge should hide: "oikhan a ar show korbe na koyta notice read kora baki")
  const zeroUnreadRes = await request({
    hostname: 'localhost', port: 3000, path: '/api/notices/unread-count', method: 'GET',
    headers: { Authorization: `Bearer ${student.token}` }
  });
  console.log(`3. Clean baseline unread count: ${zeroUnreadRes.data.unreadCount} (Expected: 0)`);
  if (zeroUnreadRes.data.unreadCount !== 0) throw new Error('Expected 0 unread notices after mark-all-read');

  // 4. Teacher posts a NEW notice for enrolled class CLS-9756
  console.log('\n4. Teacher posting a new course notice...');
  const newNoticeRes = await request({
    hostname: 'localhost', port: 3000, path: '/api/notices', method: 'POST',
    headers: {
      Authorization: `Bearer ${teacher.token}`,
      'Content-Type': 'application/json'
    }
  }, JSON.stringify({
    classId: 'CLS-9756',
    title: 'Surprise Physics Class Test on Gravitation',
    content: 'All students must prepare Chapter 6. Exam will be held next Tuesday.',
    priority: 'urgent',
    category: 'exam'
  }));

  console.log(`   Notice created: HTTP ${newNoticeRes.status} (ID: ${newNoticeRes.data.id})`);
  const noticeId = newNoticeRes.data.id;

  // 5. Check student's unread count now -> SHOULD BE 1! ("new notice asle abar count barbe")
  const afterPostUnreadRes = await request({
    hostname: 'localhost', port: 3000, path: '/api/notices/unread-count', method: 'GET',
    headers: { Authorization: `Bearer ${student.token}` }
  });
  console.log(`5. Student unread count after teacher posted new notice: ${afterPostUnreadRes.data.unreadCount} (Expected: 1)`);
  if (afterPostUnreadRes.data.unreadCount !== 1) throw new Error(`Expected 1 unread notice, got ${afterPostUnreadRes.data.unreadCount}`);

  // 6. Student views the Notice Board feed
  const feedRes = await request({
    hostname: 'localhost', port: 3000, path: '/api/notices', method: 'GET',
    headers: { Authorization: `Bearer ${student.token}` }
  });
  const foundNotice = feedRes.data.notices.find(n => n.id === noticeId);
  console.log(`6. Student retrieved notice board feed:`);
  console.log(`   Found Notice: "${foundNotice.title}"`);
  console.log(`   isRead status for student: ${foundNotice.isRead} (Expected: false)`);
  console.log(`   stats.unreadCount in feed payload: ${feedRes.data.stats.unreadCount} (Expected: 1)`);

  if (foundNotice.isRead !== false) throw new Error('New notice should have isRead === false for student');

  // 7. Student clicks on the notice ("notice a click korle oita read hisabe gonno hobe, count kombe")
  console.log('\n7. Student clicks on the notice (calling /api/notices/:id/read)...');
  const readRes = await request({
    hostname: 'localhost', port: 3000, path: `/api/notices/${noticeId}/read`, method: 'POST',
    headers: { Authorization: `Bearer ${student.token}` }
  });

  console.log(`   Read status: HTTP ${readRes.status}`);
  console.log(`   isRead: ${readRes.data.isRead}`);
  console.log(`   Returned unreadCount: ${readRes.data.unreadCount} (Expected: 0)`);

  if (readRes.data.unreadCount !== 0) throw new Error('Expected unreadCount to be 0 after clicking notice');

  // 8. Verify notice feed now marks the notice as read
  const feedAfterRead = await request({
    hostname: 'localhost', port: 3000, path: '/api/notices', method: 'GET',
    headers: { Authorization: `Bearer ${student.token}` }
  });
  const foundAfterRead = feedAfterRead.data.notices.find(n => n.id === noticeId);
  console.log(`8. Feed after reading notice:`);
  console.log(`   isRead status: ${foundAfterRead.isRead} (Expected: true)`);
  console.log(`   stats.unreadCount: ${feedAfterRead.data.stats.unreadCount} (Expected: 0 - Badge disappears)`);

  if (foundAfterRead.isRead !== true) throw new Error('Notice should now be marked as read');
  if (feedAfterRead.data.stats.unreadCount !== 0) throw new Error('stats.unreadCount should be 0');

  // 9. Teacher posts a 2nd notice -> Count increments to 1 again
  console.log('\n9. Teacher posts second notice to verify badge count increases again...');
  const notice2Res = await request({
    hostname: 'localhost', port: 3000, path: '/api/notices', method: 'POST',
    headers: {
      Authorization: `Bearer ${teacher.token}`,
      'Content-Type': 'application/json'
    }
  }, JSON.stringify({
    classId: 'CLS-9756',
    title: 'Lab Report Submission Deadline Extended',
    content: 'You can submit until Friday 5 PM.',
    priority: 'important'
  }));

  const countAfter2nd = await request({
    hostname: 'localhost', port: 3000, path: '/api/notices/unread-count', method: 'GET',
    headers: { Authorization: `Bearer ${student.token}` }
  });
  console.log(`   Unread count after 2nd notice: ${countAfter2nd.data.unreadCount} (Expected: 1)`);
  if (countAfter2nd.data.unreadCount !== 1) throw new Error('Expected unread count to increment to 1');

  console.log('\n========================================================================');
  console.log('🎉 100% SUCCESS: CLICKING A NOTICE MARKS IT AS READ!');
  console.log('🎉 100% SUCCESS: NEW NOTICES DYNAMICALLY INCREMENT UNREAD COUNT!');
  console.log('🎉 100% SUCCESS: READING NOTICES DECREMENTS COUNT & HIDES WHEN 0!');
  console.log('========================================================================');
}

run().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
