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
  console.log('=== TEST: Notice Edit and Delete Authorization ===\n');

  // 1. Logins
  const teacherA = await login('shamsilarefin@teacher.com', 'nexus123'); // Shamsil Arefin (TCH-0260)
  const teacherB = await login('rana@teacher.com', 'nexus123');          // Rana (TCH-8911)
  const admin = await login('admin@admin.com', 'nexus123');             // Admin
  const student = await login('madiha@nexus.com', 'nexus123');          // Student

  console.log(`✓ Teacher A logged in: ${teacherA.user.name} (${teacherA.user.id})`);
  console.log(`✓ Teacher B logged in: ${teacherB.user.name} (${teacherB.user.id})`);
  console.log(`✓ Admin logged in: ${admin.user.name} (${admin.user.id})`);
  console.log(`✓ Student logged in: ${student.user.name} (${student.user.id})\n`);

  // 2. Teacher A posts a notice for their assigned class CLS-9756
  const postRes = await request('/api/notices', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${teacherA.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      classId: 'CLS-9756',
      title: 'Initial Physics Notice',
      content: 'Original notice content for chapter 1.',
      priority: 'normal',
      category: 'general'
    })
  });
  console.log(`1. Teacher A creates notice: HTTP ${postRes.status} (ID: ${postRes.data.id})`);
  if (postRes.status !== 201) throw new Error('Teacher A failed to post notice: ' + JSON.stringify(postRes.data));
  const noticeId = postRes.data.id;

  // 3. Teacher A EDITS their own notice
  const editByAuthorRes = await request(`/api/notices/${noticeId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${teacherA.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title: 'Updated Physics Notice by Author',
      content: 'Updated content with revised homework formulas and test instructions.',
      priority: 'important',
      category: 'general'
    })
  });
  console.log(`2. Teacher A edits own notice: HTTP ${editByAuthorRes.status} - "${editByAuthorRes.data.notice.title}"`);
  if (editByAuthorRes.status !== 200 || editByAuthorRes.data.notice.title !== 'Updated Physics Notice by Author') {
    throw new Error('Teacher A failed to edit own notice');
  }

  // 4. Teacher B attempts to EDIT Teacher A's notice -> Must be BLOCKED with 403
  const editByOtherTeacherRes = await request(`/api/notices/${noticeId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${teacherB.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title: 'Hacked title by Teacher B',
      content: 'Teacher B trying to change Teacher A notice'
    })
  });
  console.log(`3. Teacher B attempting to edit Teacher A notice: HTTP ${editByOtherTeacherRes.status} (${editByOtherTeacherRes.data.error})`);
  if (editByOtherTeacherRes.status !== 403) throw new Error('Expected 403 when Teacher B attempts to edit Teacher A notice');

  // 5. Teacher B attempts to DELETE Teacher A's notice -> Must be BLOCKED with 403
  const deleteByOtherTeacherRes = await request(`/api/notices/${noticeId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${teacherB.token}`
    }
  });
  console.log(`4. Teacher B attempting to delete Teacher A notice: HTTP ${deleteByOtherTeacherRes.status} (${deleteByOtherTeacherRes.data.error})`);
  if (deleteByOtherTeacherRes.status !== 403) throw new Error('Expected 403 when Teacher B attempts to delete Teacher A notice');

  // 6. Student attempts to EDIT Teacher A's notice -> Must be BLOCKED with 403
  const editByStudentRes = await request(`/api/notices/${noticeId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${student.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title: 'Student edit attempt'
    })
  });
  console.log(`5. Student attempting to edit notice: HTTP ${editByStudentRes.status}`);
  if (editByStudentRes.status !== 403) throw new Error('Student should receive 403 Forbidden');

  // 7. Student attempts to DELETE notice -> Must be BLOCKED with 403
  const deleteByStudentRes = await request(`/api/notices/${noticeId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${student.token}`
    }
  });
  console.log(`6. Student attempting to delete notice: HTTP ${deleteByStudentRes.status}`);
  if (deleteByStudentRes.status !== 403) throw new Error('Student should receive 403 Forbidden');

  // 8. Admin EDITS Teacher A's notice
  const editByAdminRes = await request(`/api/notices/${noticeId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${admin.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title: 'Admin Verified Physics Notice',
      priority: 'urgent'
    })
  });
  console.log(`7. Admin edits notice: HTTP ${editByAdminRes.status} - "${editByAdminRes.data.notice.title}"`);
  if (editByAdminRes.status !== 200) throw new Error('Admin should be able to edit notice');

  // 9. Teacher A creates a second notice to test author self-deletion
  const secondPostRes = await request('/api/notices', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${teacherA.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      classId: 'CLS-9756',
      title: 'Notice To Be Self-Deleted By Teacher A',
      content: 'This will be deleted by author.'
    })
  });
  const secondNoticeId = secondPostRes.data.id;
  console.log(`8. Teacher A created second notice (ID: ${secondNoticeId})`);

  // Teacher A deletes their own notice
  const deleteByAuthorRes = await request(`/api/notices/${secondNoticeId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${teacherA.token}`
    }
  });
  console.log(`9. Teacher A deletes own notice: HTTP ${deleteByAuthorRes.status} (${deleteByAuthorRes.data.message})`);
  if (deleteByAuthorRes.status !== 200) throw new Error('Teacher A should be able to delete their own notice');

  // 10. Admin DELETES the first notice
  const deleteByAdminRes = await request(`/api/notices/${noticeId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${admin.token}`
    }
  });
  console.log(`10. Admin deletes notice: HTTP ${deleteByAdminRes.status} (${deleteByAdminRes.data.message})`);
  if (deleteByAdminRes.status !== 200) throw new Error('Admin should be able to delete any notice');

  // 11. Test announcement backward-compatible endpoints (PUT & DELETE /api/announcements/:id)
  const annPostRes = await request('/api/announcements', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${teacherA.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      classId: 'CLS-9756',
      title: 'ELMS Announcement',
      content: 'Testing announcements endpoint'
    })
  });
  const annId = annPostRes.data.id;
  console.log(`11. Created via /api/announcements (ID: ${annId})`);

  const annEditRes = await request(`/api/announcements/${annId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${teacherA.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title: 'ELMS Announcement Updated',
      content: 'Testing announcements update'
    })
  });
  console.log(`12. Edited via /api/announcements/${annId}: HTTP ${annEditRes.status}`);
  if (annEditRes.status !== 200) throw new Error('Failed to update via /api/announcements');

  const annDeleteRes = await request(`/api/announcements/${annId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${admin.token}`
    }
  });
  console.log(`13. Admin deleted via /api/announcements/${annId}: HTTP ${annDeleteRes.status}`);
  if (annDeleteRes.status !== 200) throw new Error('Failed to delete via /api/announcements');

  console.log('\n========================================================================');
  console.log('🎉 100% SUCCESS: AUTHOR TEACHER CAN EDIT & DELETE THEIR OWN NOTICES!');
  console.log('🎉 100% SUCCESS: OTHER TEACHERS CANNOT EDIT OR DELETE FOREIGN NOTICES!');
  console.log('🎉 100% SUCCESS: ADMIN CAN EDIT & DELETE ANY NOTICE ACROSS THE SYSTEM!');
  console.log('========================================================================');
}

run().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
