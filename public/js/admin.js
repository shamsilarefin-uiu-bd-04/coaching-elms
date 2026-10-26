// NexusAcademyLS - Administrator Control Console
const Admin = {
  currentSubTab: 'overview', // 'overview' | 'users' | 'classes'
  users: [],
  classes: [],
  teachers: [],
  stats: null,

  async init(subTab = 'overview') {
    this.currentSubTab = subTab;
    try {
      await this.refreshData();
      this.render();
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  async refreshData() {
    const [stats, users, classes] = await Promise.all([
      API.getAdminStats(),
      API.getAdminUsers(),
      API.getClasses()
    ]);
    this.stats = stats;
    this.users = users;
    this.classes = classes;
    this.teachers = users.filter(u => u.role === 'teacher' && u.status === 'active');
  },

  setSubTab(tab) {
    this.currentSubTab = tab;
    this.render();
  },

  render() {
    const container = document.getElementById('admin-content-area');
    if (!container) return;

    container.innerHTML = `
      <!-- Admin Header Banner -->
      <div class="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 mb-8 shadow-xl">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold uppercase tracking-wider mb-2">
              <span class="w-2 h-2 rounded-full bg-rose-400"></span>
              Administrative Control Center
            </div>
            <h2 class="text-2xl sm:text-3xl font-extrabold text-white">System Governance & Academy Master Controls</h2>
            <p class="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl">
              Full administrative authority over accounts, faculty assignments, course curriculum, and system configuration.
            </p>
          </div>

          <div class="flex items-center gap-2">
            <button onclick="Admin.openAddUserModal()" class="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md">
              <i data-lucide="user-plus" class="w-4 h-4"></i>
              Add User
            </button>
            <button onclick="Admin.openAddClassModal()" class="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md">
              <i data-lucide="folder-plus" class="w-4 h-4"></i>
              Create Class
            </button>
          </div>
        </div>

        <!-- Sub Tabs -->
        <div class="flex items-center gap-2 mt-6 pt-5 border-t border-white/10 text-xs sm:text-sm">
          <button onclick="Admin.setSubTab('overview')" class="px-4 py-2 rounded-xl font-bold transition flex items-center gap-2 ${this.currentSubTab === 'overview' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-300 hover:bg-white/10'}">
            <i data-lucide="activity" class="w-4 h-4"></i>
            Academy Overview
          </button>
          <button onclick="Admin.setSubTab('users')" class="px-4 py-2 rounded-xl font-bold transition flex items-center gap-2 ${this.currentSubTab === 'users' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-300 hover:bg-white/10'}">
            <i data-lucide="users" class="w-4 h-4"></i>
            User Accounts (${this.users.length})
          </button>
          <button onclick="Admin.setSubTab('classes')" class="px-4 py-2 rounded-xl font-bold transition flex items-center gap-2 ${this.currentSubTab === 'classes' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-300 hover:bg-white/10'}">
            <i data-lucide="book-open" class="w-4 h-4"></i>
            Classes & Batches (${this.classes.length})
          </button>
        </div>
      </div>

      <!-- Dynamic Tab Content -->
      <div id="admin-sub-content">
        <!-- Rendered based on currentSubTab -->
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    if (this.currentSubTab === 'overview') this.renderOverview();
    else if (this.currentSubTab === 'users') this.renderUsers();
    else if (this.currentSubTab === 'classes') this.renderClasses();
  },

  // 1. ACADEMY OVERVIEW (KPI CARDS)
  renderOverview() {
    const sub = document.getElementById('admin-sub-content');
    if (!sub || !this.stats) return;

    sub.innerHTML = `
      <!-- KPI Stats Grid -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div class="nexus-card p-5 border-t-4 border-t-indigo-600">
          <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Total Students</span>
          <div class="text-3xl font-extrabold text-slate-800 mt-2">${this.stats.studentsCount}</div>
          <span class="text-xs text-indigo-700 font-semibold mt-1 block">Active coaching enrollments</span>
        </div>

        <div class="nexus-card p-5 border-t-4 border-t-emerald-600">
          <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Faculty Members</span>
          <div class="text-3xl font-extrabold text-slate-800 mt-2">${this.stats.teachersCount}</div>
          <span class="text-xs text-emerald-700 font-semibold mt-1 block">Subject specialists</span>
        </div>

        <div class="nexus-card p-5 border-t-4 border-t-amber-600">
          <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Classes & Batches</span>
          <div class="text-3xl font-extrabold text-slate-800 mt-2">${this.stats.classesCount}</div>
          <span class="text-xs text-amber-700 font-semibold mt-1 block">${this.stats.activeEnrollments} active course enrollments</span>
        </div>

        <div class="nexus-card p-5 border-t-4 border-t-sky-600">
          <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Study Materials</span>
          <div class="text-3xl font-extrabold text-slate-800 mt-2">${this.stats.materialsCount}</div>
          <span class="text-xs text-sky-700 font-semibold mt-1 block">${this.stats.linksCount} external resource links</span>
        </div>
      </div>

      <!-- Quick Actions and System Status -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 nexus-card p-6">
          <div class="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <h3 class="text-base font-bold text-slate-800">Recent Class Allocations</h3>
            <button onclick="Admin.setSubTab('classes')" class="text-xs font-bold text-indigo-900 hover:underline">View All Classes &rarr;</button>
          </div>

          <div class="space-y-3">
            ${this.classes.slice(0, 4).map(c => `
              <div class="p-3.5 rounded-xl border border-slate-200 flex items-center justify-between bg-slate-50/50">
                <div>
                  <div class="flex items-center gap-2">
                    <span class="px-2 py-0.5 rounded bg-indigo-900 text-white text-[10px] font-bold">${c.code}</span>
                    <h5 class="text-xs font-bold text-slate-800">${c.title}</h5>
                  </div>
                  <p class="text-[11px] text-slate-500 mt-0.5">Faculty: <strong>${c.teacherName}</strong> • ${c.schedule}</p>
                </div>
                <span class="text-xs font-bold px-2.5 py-1 bg-white rounded-lg border border-slate-200 text-slate-700">
                  ${c.enrolledCount} Enrolled
                </span>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="nexus-card p-6">
          <h3 class="text-base font-bold text-slate-800 mb-4">Campus & Server Status</h3>
          <div class="space-y-3 text-xs text-slate-600">
            <div class="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span class="font-semibold text-slate-700">Server Health</span>
              <span class="inline-flex items-center gap-1.5 text-emerald-600 font-bold">
                <span class="w-2 h-2 rounded-full bg-emerald-500"></span> Online (Port 3000)
              </span>
            </div>
            <div class="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span class="font-semibold text-slate-700">Database Engine</span>
              <span class="text-slate-800 font-bold">ACID JSON Store</span>
            </div>
            <div class="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span class="font-semibold text-slate-700">Academic System</span>
              <span class="text-slate-800 font-bold">Nexus ELMS</span>
            </div>
            <div class="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span class="font-semibold text-slate-700">Campus Location</span>
              <span class="text-slate-800 font-bold">Mirpur-2, Dhaka</span>
            </div>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  // 2. USERS MANAGEMENT
  renderUsers() {
    const sub = document.getElementById('admin-sub-content');
    if (!sub) return;

    sub.innerHTML = `
      <div class="nexus-card p-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <h3 class="text-lg font-bold text-slate-800">User Account Directory</h3>
            <p class="text-xs text-slate-500 mt-0.5">Manage credentials, passwords, and access roles for students, teachers, and admins.</p>
          </div>

          <div class="flex items-center gap-3">
            <input type="text" id="admin-user-search" oninput="Admin.filterUsers(this.value)" placeholder="Search by name, email, ID..."
              class="text-xs px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 w-56">

            <select id="admin-user-role-filter" onchange="Admin.filterUsersByRole(this.value)" class="text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-white">
              <option value="">All Roles</option>
              <option value="student">Students</option>
              <option value="teacher">Teachers</option>
              <option value="admin">Administrators</option>
            </select>

            <button onclick="Admin.openAddUserModal()" class="px-3.5 py-2 bg-indigo-900 hover:bg-indigo-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 flex-shrink-0 shadow-sm">
              <i data-lucide="plus" class="w-3.5 h-3.5"></i>
              Add User
            </button>
          </div>
        </div>

        <div class="overflow-x-auto mt-4">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th class="py-3 px-4">User Details</th>
                <th class="py-3 px-4">Role</th>
                <th class="py-3 px-4">Batch / Designation</th>
                <th class="py-3 px-4">Phone</th>
                <th class="py-3 px-4 text-center">Status</th>
                <th class="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody id="admin-users-table-body" class="divide-y divide-slate-100">
              ${this.renderUserRows(this.users)}
            </tbody>
          </table>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  renderUserRows(usersList) {
    if (usersList.length === 0) {
      return `<tr><td colspan="6" class="text-center py-8 text-slate-400">No users match the criteria.</td></tr>`;
    }

    return usersList.map(u => {
      const roleBadge = u.role === 'teacher' ? 'badge-role-teacher' : u.role === 'student' ? 'badge-role-student' : 'badge-role-admin';
      return `
        <tr class="hover:bg-slate-50/70 transition">
          <td class="py-3.5 px-4">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm flex-shrink-0">
                ${u.avatar || '👤'}
              </div>
              <div>
                <span class="font-bold text-slate-800 block">${u.name}</span>
                <span class="text-[11px] text-slate-400">${u.id} • ${u.email}</span>
              </div>
            </div>
          </td>
          <td class="py-3.5 px-4">
            <span class="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${roleBadge}">
              ${u.role}
            </span>
          </td>
          <td class="py-3.5 px-4 text-slate-600">
            ${u.role === 'teacher' ? `
              <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-900 border border-indigo-200">
                📚 ${u.subject || u.designation || 'General Subject'}
              </span>
            ` : `
              <span>${u.batch || u.department || 'Regular Student'}</span>
            `}
          </td>
          <td class="py-3.5 px-4 text-slate-500">${u.phone || 'N/A'}</td>
          <td class="py-3.5 px-4 text-center">
            <span class="inline-block px-2 py-0.5 rounded text-[10px] font-bold ${u.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}">
              ${u.status}
            </span>
          </td>
          <td class="py-3.5 px-4 text-right space-x-1">
            <button onclick="Admin.openResetPasswordModal('${u.id}', '${u.name}')" title="Reset Password" class="p-1.5 text-slate-500 hover:text-indigo-900 hover:bg-slate-100 rounded-lg transition">
              <i data-lucide="key" class="w-3.5 h-3.5"></i>
            </button>
            <button onclick="Admin.openEditUserModal('${u.id}')" title="Edit User" class="p-1.5 text-slate-500 hover:text-indigo-900 hover:bg-slate-100 rounded-lg transition">
              <i data-lucide="edit-2" class="w-3.5 h-3.5"></i>
            </button>
            <button onclick="Admin.deleteUser('${u.id}', '${u.name}')" title="Delete User" class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
          </td>
        </tr>
      `;
    }).join('');
  },

  filterUsers(query) {
    const q = query.toLowerCase();
    const roleFilter = document.getElementById('admin-user-role-filter').value;
    let filtered = this.users.filter(u =>
      (u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.id.toLowerCase().includes(q))
    );
    if (roleFilter) filtered = filtered.filter(u => u.role === roleFilter);
    const tbody = document.getElementById('admin-users-table-body');
    if (tbody) {
      tbody.innerHTML = this.renderUserRows(filtered);
      if (window.lucide) window.lucide.createIcons();
    }
  },

  filterUsersByRole(role) {
    const searchVal = document.getElementById('admin-user-search').value;
    this.filterUsers(searchVal);
  },

  // 3. CLASSES MANAGEMENT
  renderClasses() {
    const sub = document.getElementById('admin-sub-content');
    if (!sub) return;

    sub.innerHTML = `
      <div class="nexus-card p-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <h3 class="text-lg font-bold text-slate-800">Classes & Coaching Batches</h3>
            <p class="text-xs text-slate-500 mt-0.5">Define coaching batches, curriculum, and assign subject faculty (a teacher can teach multiple classes).</p>
          </div>

          <button onclick="Admin.openAddClassModal()" class="px-3.5 py-2 bg-indigo-900 hover:bg-indigo-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm">
            <i data-lucide="plus" class="w-3.5 h-3.5"></i>
            Create New Class
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          ${this.classes.map(c => `
            <div class="p-5 rounded-2xl border border-slate-200 hover:border-indigo-400 bg-white transition flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between mb-2">
                  <span class="px-2.5 py-1 rounded bg-indigo-900 text-white text-xs font-bold">${c.code}</span>
                  <span class="text-xs font-bold text-slate-500">${c.section}</span>
                </div>
                <h4 class="text-base font-bold text-slate-800">${c.title}</h4>
                <div class="mt-1.5 flex items-center gap-1.5">
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-900 border border-indigo-200">
                    Subject: ${c.subject || c.title}
                  </span>
                </div>
                <p class="text-xs text-slate-500 mt-1 line-clamp-2">${c.description || 'Coaching batch'}</p>

                <div class="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                  <div class="flex items-center gap-2">
                    <i data-lucide="user-check" class="w-4 h-4 text-indigo-700"></i>
                    <span>Faculty: <strong>${c.teacherName}</strong> <span class="text-[11px] text-indigo-800 font-semibold">(${c.teacherSubject || c.subject || 'Faculty'})</span></span>
                  </div>
                  <div class="flex items-center gap-2">
                    <i data-lucide="calendar" class="w-4 h-4 text-slate-400"></i>
                    <span>${c.schedule}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <i data-lucide="map-pin" class="w-4 h-4 text-slate-400"></i>
                    <span>${c.room}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <i data-lucide="users" class="w-4 h-4 text-slate-400"></i>
                    <span><strong>${c.enrolledCount}</strong> Students Enrolled</span>
                  </div>
                </div>
              </div>

              <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <button onclick="UCAM.openEnrollmentModal('${c.id}'); App.switchView('ucam')" class="text-xs font-bold text-indigo-900 hover:underline">
                  Manage Roster &rarr;
                </button>
                <button onclick="Admin.deleteClass('${c.id}', '${c.title}')" class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition">
                  <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  // Modal: Add User
  openAddUserModal() {
    App.showModal(`
      <div class="p-6">
        <div class="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <h3 class="text-lg font-bold text-slate-900">Create New Academy Account</h3>
          <button onclick="App.closeModal()" class="text-slate-400 hover:text-slate-600">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <form onsubmit="Admin.submitCreateUser(event)" class="space-y-4">
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Full Name</label>
            <input type="text" name="name" placeholder="e.g. Mahinul Islam" required
              class="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:outline-none">
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Email Address</label>
              <input type="email" name="email" placeholder="user@nexusacademy.edu.bd" required
                class="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:outline-none">
            </div>
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Phone Number</label>
              <input type="tel" name="phone" placeholder="017xxxxxxxx"
                class="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:outline-none">
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Account Role</label>
              <select name="role" id="new-user-role" onchange="Admin.toggleSubjectField(this.value)" required class="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:outline-none bg-white font-semibold">
                <option value="student" selected>Student</option>
                <option value="teacher">Teacher (Faculty)</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Batch / Department</label>
              <input type="text" name="batch" placeholder="e.g. Class 9, Class 10, HSC 2026"
                class="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:outline-none">
            </div>
          </div>

          <!-- Dedicated Subject selection for Teachers -->
          <div id="teacher-subject-field-add" class="hidden">
            <label class="block text-xs font-bold uppercase tracking-wider text-indigo-900 mb-1.5">Teaching Subject (শিক্ষকের বিষয়)</label>
            <select name="subject" class="w-full text-sm px-3.5 py-2.5 rounded-xl border border-indigo-300 bg-indigo-50/50 focus:ring-2 focus:ring-indigo-600 focus:outline-none font-bold text-slate-800">
              <option value="Physics">🔬 Physics (পদার্থবিজ্ঞান)</option>
              <option value="Chemistry">🧪 Chemistry (রসায়ন)</option>
              <option value="Higher Mathematics">📐 Higher Mathematics (উচ্চতর গণিত)</option>
              <option value="Biology">🧬 Biology (জীববিজ্ঞান)</option>
              <option value="English">📖 English (ইংরেজি)</option>
              <option value="ICT">💻 ICT (তথ্য ও যোগাযোগ প্রযুক্তি)</option>
              <option value="Bangla">📚 Bangla (বাংলা)</option>
              <option value="General Science">⚡ General Science (বিজ্ঞান)</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Initial Password</label>
            <input type="text" name="password" value="nexus123" required
              class="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:outline-none">
            <span class="text-[11px] text-slate-400 mt-1 block">Default: nexus123 (User can change after login)</span>
          </div>

          <div class="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button type="button" onclick="App.closeModal()" class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition">Cancel</button>
            <button type="submit" class="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-900 hover:bg-indigo-800 text-white transition shadow-sm">
              Create Account
            </button>
          </div>
        </form>
      </div>
    `);
    if (window.lucide) window.lucide.createIcons();
  },

  async submitCreateUser(event) {
    event.preventDefault();
    const form = event.target;
    try {
      await API.createAdminUser({
        name: form.name.value,
        email: form.email.value,
        phone: form.phone.value,
        role: form.role.value,
        batch: form.batch.value,
        designation: form.batch.value,
        password: form.password.value
      });
      showToast('User created successfully!', 'success');
      App.closeModal();
      await this.init('users');
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  // Modal: Edit User
  openEditUserModal(userId) {
    const user = this.users.find(u => u.id === userId);
    if (!user) return;

    App.showModal(`
      <div class="p-6">
        <div class="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <h3 class="text-lg font-bold text-slate-900">Edit User Details</h3>
          <button onclick="App.closeModal()" class="text-slate-400 hover:text-slate-600">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <form onsubmit="Admin.submitEditUser(event, '${user.id}')" class="space-y-4">
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Full Name</label>
            <input type="text" name="name" value="${user.name}" required
              class="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:outline-none">
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Email</label>
              <input type="email" name="email" value="${user.email}" required
                class="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:outline-none">
            </div>
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Phone</label>
              <input type="tel" name="phone" value="${user.phone || ''}"
                class="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:outline-none">
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Role</label>
              <select name="role" class="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:outline-none bg-white">
                <option value="student" ${user.role === 'student' ? 'selected' : ''}>Student</option>
                <option value="teacher" ${user.role === 'teacher' ? 'selected' : ''}>Teacher</option>
                <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Administrator</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Batch / Designation</label>
              <input type="text" name="batch" value="${user.batch || user.designation || ''}"
                class="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:outline-none">
            </div>
          </div>

          ${user.role === 'teacher' ? `
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-indigo-900 mb-1.5">Teaching Subject (শিক্ষকের বিষয়)</label>
              <select name="subject" class="w-full text-sm px-3.5 py-2.5 rounded-xl border border-indigo-300 bg-indigo-50/50 focus:ring-2 focus:ring-indigo-600 focus:outline-none font-bold text-slate-800">
                <option value="Physics" ${user.subject === 'Physics' ? 'selected' : ''}>🔬 Physics (পদার্থবিজ্ঞান)</option>
                <option value="Chemistry" ${user.subject === 'Chemistry' ? 'selected' : ''}>🧪 Chemistry (রসায়ন)</option>
                <option value="Higher Mathematics" ${user.subject === 'Higher Mathematics' ? 'selected' : ''}>📐 Higher Mathematics (উচ্চতর গণিত)</option>
                <option value="Biology" ${user.subject === 'Biology' ? 'selected' : ''}>🧬 Biology (জীববিজ্ঞান)</option>
                <option value="English" ${user.subject === 'English' ? 'selected' : ''}>📖 English (ইংরেজি)</option>
                <option value="ICT" ${user.subject === 'ICT' ? 'selected' : ''}>💻 ICT (তথ্য ও যোগাযোগ প্রযুক্তি)</option>
                <option value="Bangla" ${user.subject === 'Bangla' ? 'selected' : ''}>📚 Bangla (বাংলা)</option>
                <option value="General Science" ${user.subject === 'General Science' ? 'selected' : ''}>⚡ General Science (বিজ্ঞান)</option>
              </select>
            </div>
          ` : ''}

          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Account Status</label>
            <select name="status" class="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:outline-none bg-white">
              <option value="active" ${user.status === 'active' ? 'selected' : ''}>Active</option>
              <option value="inactive" ${user.status === 'inactive' ? 'selected' : ''}>Inactive (Deactivated)</option>
            </select>
          </div>

          <div class="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button type="button" onclick="App.closeModal()" class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition">Cancel</button>
            <button type="submit" class="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-900 hover:bg-indigo-800 text-white transition shadow-sm">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    `);
    if (window.lucide) window.lucide.createIcons();
  },

  async submitEditUser(event, userId) {
    event.preventDefault();
    const form = event.target;
    try {
      await API.updateAdminUser(userId, {
        name: form.name.value,
        email: form.email.value,
        phone: form.phone.value,
        role: form.role.value,
        batch: form.batch.value,
        designation: form.batch.value,
        status: form.status.value
      });
      showToast('User updated successfully!', 'success');
      App.closeModal();
      await this.init('users');
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  openResetPasswordModal(userId, userName) {
    App.showModal(`
      <div class="p-6">
        <div class="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <h3 class="text-lg font-bold text-slate-900">Reset Account Password</h3>
          <button onclick="App.closeModal()" class="text-slate-400 hover:text-slate-600">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <p class="text-xs text-slate-600 mb-4">
          Resetting password for <strong>${userName}</strong> (${userId}).
        </p>

        <form onsubmit="Admin.submitResetPassword(event, '${userId}')" class="space-y-4">
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">New Password</label>
            <input type="text" name="newPassword" value="nexus123" required
              class="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:outline-none">
          </div>

          <div class="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button type="button" onclick="App.closeModal()" class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition">Cancel</button>
            <button type="submit" class="px-5 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition shadow-sm">
              Reset Password
            </button>
          </div>
        </form>
      </div>
    `);
    if (window.lucide) window.lucide.createIcons();
  },

  async submitResetPassword(event, userId) {
    event.preventDefault();
    const newPass = event.target.newPassword.value;
    try {
      await API.resetUserPassword(userId, newPass);
      showToast('Password reset successfully!', 'success');
      App.closeModal();
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  async deleteUser(userId, userName) {
    if (!confirm(`Are you sure you want to delete user ${userName} (${userId})? This will also remove all their enrollments.`)) return;
    try {
      await API.deleteAdminUser(userId);
      showToast('User deleted from system', 'success');
      await this.init('users');
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  toggleSubjectField(role) {
    const subjectField = document.getElementById('teacher-subject-field-add');
    if (subjectField) {
      if (role === 'teacher') subjectField.classList.remove('hidden');
      else subjectField.classList.add('hidden');
    }
  },

  handleSubjectChange(subject) {
    const titleInput = document.getElementById('create-class-title');
    if (titleInput && (!titleInput.value || titleInput.value.trim() === '')) {
      titleInput.value = subject;
    }
    const teacherSelect = document.getElementById('create-class-teacher');
    if (!teacherSelect) return;

    const subjectNorm = subject.toLowerCase();
    const matchingTeachers = this.teachers.filter(t => {
      const s = (t.subject || t.designation || '').toLowerCase();
      return s.includes(subjectNorm) || subjectNorm.includes(s) || (subjectNorm.includes('math') && s.includes('math'));
    });

    teacherSelect.innerHTML = `
      <option value="" disabled selected>-- Select ${subject} Teacher --</option>
      ${matchingTeachers.map(t => `
        <option value="${t.id}">${t.name} (${t.subject || t.designation || subject} Teacher)</option>
      `).join('')}
      ${matchingTeachers.length === 0 ? `
        <option value="" disabled>No ${subject} teachers found. Showing all faculty:</option>
        ${this.teachers.map(t => `<option value="${t.id}">${t.name} (${t.subject || t.designation || 'Teacher'})</option>`).join('')}
      ` : ''}
    `;

    if (matchingTeachers.length > 0) {
      teacherSelect.value = matchingTeachers[0].id;
    }
  },

  // Modal: Add Class
  openAddClassModal() {
    App.showModal(`
      <div class="p-6">
        <div class="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div class="flex items-center gap-2">
            <span class="text-xl">🏫</span>
            <h3 class="text-lg font-bold text-slate-900">Create New Class / Coaching Batch</h3>
          </div>
          <button onclick="App.closeModal()" class="text-slate-400 hover:text-slate-600">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <form onsubmit="Admin.submitCreateClass(event)" class="space-y-4">
          <!-- Subject & Teacher Selection (jei subject er teacher oi subject er class nibe) -->
          <div class="grid grid-cols-2 gap-3 p-3.5 bg-indigo-50/60 rounded-2xl border border-indigo-100">
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-indigo-950 mb-1.5">1. Course Subject (বিষয়)</label>
              <select name="subject" id="create-class-subject" onchange="Admin.handleSubjectChange(this.value)" required
                class="w-full text-sm px-3.5 py-2.5 rounded-xl border border-indigo-300 focus:ring-2 focus:ring-indigo-600 focus:outline-none bg-white font-bold text-slate-800">
                <option value="" disabled selected>-- Select Subject --</option>
                <option value="Physics">🔬 Physics (পদার্থবিজ্ঞান)</option>
                <option value="Chemistry">🧪 Chemistry (রসায়ন)</option>
                <option value="Higher Mathematics">📐 Higher Mathematics (উচ্চতর গণিত)</option>
                <option value="Biology">🧬 Biology (জীববিজ্ঞান)</option>
                <option value="English">📖 English (ইংরেজি)</option>
                <option value="ICT">💻 ICT (তথ্য ও যোগাযোগ প্রযুক্তি)</option>
                <option value="Bangla">📚 Bangla (বাংলা)</option>
                <option value="General Science">⚡ General Science (বিজ্ঞান)</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-indigo-950 mb-1.5">2. Assigned Faculty (যে বিষয়ের শিক্ষক)</label>
              <select name="teacherId" id="create-class-teacher" required
                class="w-full text-sm px-3.5 py-2.5 rounded-xl border border-indigo-300 focus:ring-2 focus:ring-indigo-600 focus:outline-none bg-white font-bold text-slate-800">
                <option value="" disabled selected>-- First Pick Subject --</option>
                ${this.teachers.map(t => `
                  <option value="${t.id}">${t.name} (${t.subject || t.designation || 'Teacher'})</option>
                `).join('')}
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Class Code / Standard</label>
              <input type="text" name="code" placeholder="e.g. Class 9, Class 10, HSC-26" required
                class="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:outline-none">
            </div>
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Section Name</label>
              <input type="text" name="section" placeholder="e.g. Male (Days), Female (Morning)" required
                class="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:outline-none">
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Course Title</label>
            <input type="text" name="title" id="create-class-title" placeholder="e.g. Physics or HSC Higher Mathematics" required
              class="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:outline-none font-semibold">
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Schedule</label>
              <input type="text" name="schedule" placeholder="Mon, Wed 05:00 PM - 06:30 PM" required
                class="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:outline-none">
            </div>
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Room Allocation</label>
              <input type="text" name="room" value="Room 101 (Campus)" required
                class="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:outline-none">
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Course Description / Objectives</label>
            <textarea name="description" rows="2" placeholder="Brief coaching syllabus summary..."
              class="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:outline-none"></textarea>
          </div>

          <div class="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button type="button" onclick="App.closeModal()" class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition">Cancel</button>
            <button type="submit" class="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-sm">
              Create Class
            </button>
          </div>
        </form>
      </div>
    `);
    if (window.lucide) window.lucide.createIcons();
  },

  async submitCreateClass(event) {
    event.preventDefault();
    const form = event.target;
    try {
      await API.createClass({
        code: form.code.value,
        title: form.title.value,
        section: form.section.value,
        teacherId: form.teacherId.value,
        schedule: form.schedule.value,
        room: form.room.value,
        description: form.description.value,
        credits: 3.0,
        term: 'Session 2024-2025'
      });
      showToast('Class created successfully!', 'success');
      App.closeModal();
      await this.init('classes');
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  async deleteClass(classId, classTitle) {
    if (!confirm(`Are you sure you want to delete class ${classTitle} (${classId})? All enrollments, materials, and marks for this class will also be removed.`)) return;
    try {
      await API.deleteClass(classId);
      showToast('Class deleted', 'success');
      await this.init('classes');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }
};
