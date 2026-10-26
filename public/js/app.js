// NexusAcademyLS - Core App Controller & Role-Based Navigation
const App = {
  currentView: 'elms',
  loginRole: 'student', // 'student' | 'teacher' | 'admin'
  isDarkMode: false,

  initDarkMode() {
    try {
      const savedTheme = localStorage.getItem('nexus_theme');
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.isDarkMode = savedTheme === 'dark' || (!savedTheme && prefersDark);
      if (this.isDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (e) {
      this.isDarkMode = false;
    }
  },

  toggleDarkMode() {
    this.isDarkMode = !this.isDarkMode;
    if (this.isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('nexus_theme', 'dark');
      showToast('Dark mode activated 🌙', 'info');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('nexus_theme', 'light');
      showToast('Light mode activated ☀️', 'info');
    }
    this.updateDarkModeButtons();
  },

  updateDarkModeButtons() {
    const btns = document.querySelectorAll('.dark-mode-toggle-icon');
    btns.forEach(btn => {
      btn.setAttribute('data-lucide', this.isDarkMode ? 'sun' : 'moon');
      btn.className = `w-4 h-4 dark-mode-toggle-icon ${this.isDarkMode ? 'text-amber-400' : 'text-slate-600 dark:text-slate-300'}`;
    });
    if (window.lucide) window.lucide.createIcons();
  },

  async init() {
    this.initDarkMode();
    const token = API.getToken();
    const user = API.getCurrentUser();

    if (token && user) {
      try {
        const freshUser = await API.getMe();
        this.renderAuthenticatedLayout(freshUser);
      } catch (err) {
        console.warn('Session invalid, showing login screen:', err);
        this.renderLoginScreen();
      }
    } else {
      this.renderLoginScreen();
    }
  },

  // 1. LOGIN SCREEN WITH DISTINCT ROLE OPTIONS (@admin, @teacher, student)
  renderLoginScreen() {
    const root = document.getElementById('app-root');
    if (!root) return;

    root.innerHTML = `
      <div class="min-h-screen flex flex-col justify-between bg-slate-900 text-white relative overflow-hidden">
        <!-- Background Ambient Glows -->
        <div class="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>

        <!-- Top Header Minimal -->
        <header class="py-6 px-6 sm:px-12 flex items-center justify-between border-b border-white/10 relative z-10">
          <div class="flex items-center gap-3">
            <img src="/assets/logo.png" alt="Nexus Academy Logo" class="w-12 h-12 object-contain rounded-full shadow-md bg-white p-1">
            <div>
              <h1 class="text-xl font-black tracking-tight text-white font-outfit">NexusAcademy<span class="text-indigo-400">LS</span></h1>
              <p class="text-[11px] text-indigo-300 font-medium">Coaching Academic & e-Learning Management Portal</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <!-- Dark Mode Toggle Button -->
            <button onclick="App.toggleDarkMode()" id="dark-mode-login-btn" title="Toggle Light / Dark Mode"
              class="p-2 text-slate-300 hover:text-white rounded-xl bg-white/5 hover:bg-white/10 transition border border-white/10 flex items-center justify-center">
              <i data-lucide="${this.isDarkMode ? 'sun' : 'moon'}" class="w-4 h-4 dark-mode-toggle-icon ${this.isDarkMode ? 'text-amber-400' : 'text-slate-300'}"></i>
            </button>
            <div class="hidden sm:flex items-center gap-2 text-xs text-indigo-200">
              <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
              Role-Based Authentication Engine
            </div>
          </div>
        </header>

        <!-- Main Login Card Area -->
        <main class="flex-1 flex items-center justify-center p-4 sm:p-6 relative z-10">
          <div class="w-full max-w-lg bg-slate-800/90 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl">
            
            <!-- Branding Header -->
            <div class="text-center mb-6">
              <div class="w-14 h-14 mx-auto mb-2 rounded-2xl bg-gradient-to-tr from-indigo-700 to-indigo-900 p-1 shadow-lg flex items-center justify-center">
                <img src="/assets/logo.png" alt="Logo" class="w-full h-full object-contain rounded-xl">
              </div>
              <h2 class="text-2xl font-black text-white font-outfit">Sign In to Your Account</h2>
              <p class="text-xs text-slate-400 mt-1">Enter your credentials to access your academic portal</p>
            </div>

            <!-- Login Form -->
            <form id="login-form" onsubmit="App.handleLogin(event)" class="space-y-4">
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Username / ID or Email
                </label>
                <div class="relative">
                  <input type="text" id="login-identifier" required oninput="App.handleIdentifierInput(this.value)"
                    placeholder="Enter Username, Student ID, or Email"
                    class="w-full text-sm px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition">
                  <span id="detected-role-tag" class="absolute right-3 top-3 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider hidden"></span>
                </div>
                <div class="mt-2.5 p-3 rounded-xl bg-slate-900/70 border border-slate-700/60 text-[11px] text-slate-400 space-y-1">
                  <div class="flex items-center gap-1.5 text-slate-300 font-semibold">
                    <i data-lucide="shield-check" class="w-3.5 h-3.5 text-indigo-400"></i>
                    <span>Automatic Role Routing:</span>
                  </div>
                  <div class="text-[10.5px] text-slate-400 space-y-0.5 pl-5">
                    <div>• <strong>@admin</strong> handle &rarr; Admin Master Console</div>
                    <div>• <strong>@teacher</strong> handle &rarr; Teacher Portal (Roster, Gradebook, Notes)</div>
                    <div>• <strong>Student ID / Name</strong> (no suffix) &rarr; Student Portal (ELMS Cards & Results)</div>
                  </div>
                </div>
              </div>

              <div>
                <div class="flex items-center justify-between mb-1.5">
                  <label class="block text-xs font-bold uppercase tracking-wider text-slate-300">Password</label>
                  <span class="text-[11px] text-indigo-300">Default: nexus123</span>
                </div>
                <input type="password" id="login-password" required placeholder="Enter account password"
                  class="w-full text-sm px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition">
              </div>

              <button type="submit" id="btn-login-submit" class="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2">
                <span id="btn-login-text">Sign In</span>
                <i data-lucide="arrow-right" class="w-4 h-4"></i>
              </button>
            </form>

          </div>
        </main>

        <!-- Footer -->
        <footer class="py-4 px-6 border-t border-white/10 text-center text-xs text-slate-400 relative z-10 bg-slate-950/50 backdrop-blur">
          <div class="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <span class="font-medium text-slate-300">Nexus Academy Coaching Center • Mirpur-2, Dhaka-1216</span>
            <div class="flex items-center gap-4 text-[11px]">
              <span>📞 01633151496, 01799008544</span>
              <span>✉️ nexusacademy.edu.bd@gmail.com</span>
            </div>
          </div>
        </footer>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  handleIdentifierInput(val) {
    const clean = (val || '').toLowerCase().trim();
    const tag = document.getElementById('detected-role-tag');
    if (!tag) return;

    if (clean.includes('@admin')) {
      tag.innerText = 'Admin';
      tag.className = 'absolute right-3 top-3 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30 block';
    } else if (clean.includes('@teacher')) {
      tag.innerText = 'Teacher';
      tag.className = 'absolute right-3 top-3 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 block';
    } else if (clean.length > 0) {
      tag.innerText = 'Student';
      tag.className = 'absolute right-3 top-3 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 block';
    } else {
      tag.className = 'hidden';
    }
  },

  async handleLogin(event) {
    event.preventDefault();
    const identifier = document.getElementById('login-identifier').value.trim();
    const password = document.getElementById('login-password').value;
    const btn = document.getElementById('btn-login-submit');

    btn.disabled = true;
    btn.innerHTML = '<span>Verifying credentials...</span>';

    // Detect role from input
    let roleToSend = null;
    if (identifier.includes('@admin')) roleToSend = 'admin';
    else if (identifier.includes('@teacher')) roleToSend = 'teacher';

    try {
      const res = await API.login(identifier, password, roleToSend);
      showToast(res.message, 'success');
      this.renderAuthenticatedLayout(res.user);
    } catch (err) {
      showToast(err.message, 'error');
      btn.disabled = false;
      btn.innerHTML = '<span>Sign In</span><i data-lucide="arrow-right" class="w-4 h-4"></i>';
      if (window.lucide) window.lucide.createIcons();
    }
  },

  // 2. MAIN AUTHENTICATED PORTAL WITH DIRECT ROLE-BASED PANEL REDIRECTION
  renderAuthenticatedLayout(user) {
    const root = document.getElementById('app-root');
    if (!root) return;

    const roleBadge = user.role === 'teacher' ? 'badge-role-teacher' : user.role === 'student' ? 'badge-role-student' : 'badge-role-admin';

    root.innerHTML = `
      <div class="min-h-screen flex flex-col justify-between bg-slate-50 dark:bg-slate-950">
        <!-- Top Navbar with Authentic Branding -->
        <header class="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 shadow-xs">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex items-center justify-between h-16">
              
              <!-- Brand Logo & Title -->
              <div class="flex items-center gap-3">
                <a href="#" onclick="App.routeToRoleDefault('${user.role}')" class="flex items-center gap-3 group">
                  <img src="/assets/logo.png" alt="Nexus Academy" class="w-10 h-10 object-contain rounded-full shadow-xs border border-indigo-100">
                  <div>
                    <span class="text-lg font-black tracking-tight text-slate-900 font-outfit block leading-tight">NexusAcademy<span class="text-indigo-900">LS</span></span>
                    <span class="text-[10px] font-semibold text-slate-400 block tracking-wide uppercase">
                      ${user.role === 'admin' ? 'Administrator Control Panel' : user.role === 'teacher' ? 'Teacher & Faculty Portal' : 'Student Academic Portal'}
                    </span>
                  </div>
                </a>
              </div>

              <!-- Main Navigation Tabs Customized for the Role -->
              <nav class="hidden md:flex items-center gap-1 h-full">
                
                ${user.role === 'admin' ? `
                  <button id="nav-btn-admin" onclick="App.switchView('admin')" 
                    class="h-full px-4 flex items-center gap-2 text-xs uppercase tracking-wider font-bold transition nav-tab-active text-rose-800">
                    <i data-lucide="shield-check" class="w-4 h-4 text-rose-600"></i>
                    Admin Master Panel
                  </button>
                  <button id="nav-btn-ucam" onclick="App.switchView('ucam')" 
                    class="h-full px-4 flex items-center gap-2 text-xs uppercase tracking-wider font-bold transition nav-tab-inactive">
                    <i data-lucide="award" class="w-4 h-4"></i>
                    Student Roster & Marks
                  </button>
                  <button id="nav-btn-elms" onclick="App.switchView('elms')" 
                    class="h-full px-4 flex items-center gap-2 text-xs uppercase tracking-wider font-bold transition nav-tab-inactive">
                    <i data-lucide="book-open" class="w-4 h-4"></i>
                    Course Materials
                  </button>
                ` : user.role === 'teacher' ? `
                  <button id="nav-btn-ucam" onclick="App.switchView('ucam')" 
                    class="h-full px-4 flex items-center gap-2 text-xs uppercase tracking-wider font-bold transition nav-tab-active text-emerald-800">
                    <i data-lucide="users" class="w-4 h-4 text-emerald-600"></i>
                    Teacher Panel (Student List & Enrollment)
                  </button>
                  <button id="nav-btn-elms" onclick="App.switchView('elms')" 
                    class="h-full px-4 flex items-center gap-2 text-xs uppercase tracking-wider font-bold transition nav-tab-inactive">
                    <i data-lucide="book-open" class="w-4 h-4"></i>
                    Upload Notes & Links
                  </button>
                ` : `
                  <button id="nav-btn-elms" onclick="App.switchView('elms')" 
                    class="h-full px-4 flex items-center gap-2 text-xs uppercase tracking-wider font-bold transition nav-tab-active">
                    <i data-lucide="layout-grid" class="w-4 h-4"></i>
                    Nexus ELMS (My Course Cards)
                  </button>
                  <button id="nav-btn-ucam" onclick="App.switchView('ucam')" 
                    class="h-full px-4 flex items-center gap-2 text-xs uppercase tracking-wider font-bold transition nav-tab-inactive">
                    <i data-lucide="award" class="w-4 h-4"></i>
                    UCAM (Results & Class Rank)
                  </button>
                `}

                <button id="nav-btn-notices" onclick="App.switchView('notices')" 
                  class="h-full px-4 flex items-center gap-2 text-xs uppercase tracking-wider font-bold transition nav-tab-inactive relative">
                  <i data-lucide="bell" class="w-4 h-4"></i>
                  <span>Notice Board</span>
                  <span id="notices-badge-counter" class="hidden px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-bold">0</span>
                </button>

                <button id="nav-btn-messaging" onclick="App.switchView('messaging')" 
                  class="h-full px-4 flex items-center gap-2 text-xs uppercase tracking-wider font-bold transition nav-tab-inactive relative">
                  <i data-lucide="message-square" class="w-4 h-4"></i>
                  <span>Messages</span>
                  <span id="msg-badge-counter" class="hidden px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold">0</span>
                </button>
              </nav>

              <!-- User Profile & Action Menu -->
              <div class="flex items-center gap-2.5">
                
                <!-- Dark Mode Toggle Button -->
                <button onclick="App.toggleDarkMode()" id="dark-mode-header-btn" title="Toggle Light / Dark Mode" 
                  class="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-amber-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-xs">
                  <i data-lucide="${this.isDarkMode ? 'sun' : 'moon'}" class="w-4 h-4 dark-mode-toggle-icon ${this.isDarkMode ? 'text-amber-400' : 'text-slate-600'}"></i>
                </button>

                <!-- User Pill -->
                <div class="flex items-center gap-2.5">
                  <div class="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-lg shadow-xs">
                    ${user.avatar || '👤'}
                  </div>
                  <div class="hidden sm:block text-left">
                    <div class="flex items-center gap-1.5">
                      <span class="text-xs font-bold text-slate-800">${user.name}</span>
                      <span class="text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${roleBadge}">${user.role}</span>
                    </div>
                    <span class="text-[10px] text-slate-400 block">${user.id}</span>
                  </div>
                  
                  <button onclick="App.openProfileMenu()" title="Account Settings" class="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
                    <i data-lucide="settings" class="w-4 h-4"></i>
                  </button>
                  <button onclick="App.handleLogout()" title="Log Out" class="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition">
                    <i data-lucide="log-out" class="w-4 h-4"></i>
                  </button>
                </div>
              </div>

            </div>
          </div>

          <!-- Mobile Nav Bar -->
          <div class="flex md:hidden items-center justify-around border-t border-slate-100 bg-white py-2 text-xs font-bold">
            ${user.role === 'admin' ? `
              <button onclick="App.switchView('admin')" class="flex flex-col items-center gap-1 text-rose-700">
                <i data-lucide="shield-check" class="w-4 h-4"></i>
                <span>Admin</span>
              </button>
            ` : ''}
            <button onclick="App.switchView('ucam')" class="flex flex-col items-center gap-1 text-slate-600 hover:text-indigo-900">
              <i data-lucide="award" class="w-4 h-4"></i>
              <span>${user.role === 'teacher' ? 'Gradebook' : 'Results'}</span>
            </button>
            <button onclick="App.switchView('elms')" class="flex flex-col items-center gap-1 text-slate-600 hover:text-indigo-900">
              <i data-lucide="book-open" class="w-4 h-4"></i>
              <span>Notes</span>
            </button>
            <button onclick="App.switchView('notices')" class="flex flex-col items-center gap-1 text-slate-600 dark:text-slate-300 hover:text-indigo-900 relative">
              <div class="relative">
                <i data-lucide="bell" class="w-4 h-4"></i>
                <span id="notices-mobile-badge" class="hidden absolute -top-1 -right-2 px-1 py-0.2 text-[9px] font-bold rounded-full bg-amber-500 text-white leading-none">0</span>
              </div>
              <span>Notices</span>
            </button>
            <button onclick="App.switchView('messaging')" class="flex flex-col items-center gap-1 text-slate-600 hover:text-indigo-900">
              <i data-lucide="message-square" class="w-4 h-4"></i>
              <span>Messages</span>
            </button>
          </div>
        </header>

        <!-- Main View Container -->
        <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          
          <!-- View 1: ELMS Portal (Materials & Links) -->
          <div id="view-elms" class="view-panel hidden">
            <div id="elms-content-area"></div>
          </div>

          <!-- View 2: UCAM Portal (Results, GPA/Rank, Routine, Gradebook) -->
          <div id="view-ucam" class="view-panel hidden">
            <div id="ucam-content-area"></div>
          </div>

          <!-- View: Notice Board (Course Notices, Teacher Announcements & Exam Dates) -->
          <div id="view-notices" class="view-panel hidden">
            <div id="notices-view-area"></div>
          </div>

          <!-- View 3: Messaging (Student <-> Teacher) -->
          <div id="view-messaging" class="view-panel hidden">
            <div id="messaging-view-area"></div>
          </div>

          <!-- View 4: Admin Console -->
          <div id="view-admin" class="view-panel hidden">
            <div id="admin-content-area"></div>
          </div>

        </main>

        <!-- Branded Footer Banner with Verified Academy Coordinates -->
        <footer class="bg-indigo-950 text-white border-t border-indigo-900/50 mt-12">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div class="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-indigo-900/60">
              <div class="flex items-center gap-4">
                <img src="/assets/logo.png" alt="Nexus Academy" class="w-12 h-12 object-contain rounded-full bg-white p-1 shadow-sm">
                <div>
                  <h4 class="text-base font-black text-white font-outfit">Nexus Academy Coaching Center</h4>
                  <p class="text-xs text-indigo-300">Excellence in Academic Coaching & University Admissions</p>
                </div>
              </div>

              <!-- Contact Pills as shown on image banner -->
              <div class="flex flex-wrap items-center gap-4 text-xs">
                <div class="flex items-center gap-2 bg-indigo-900/60 px-3.5 py-2 rounded-xl border border-indigo-800">
                  <i data-lucide="mail" class="w-4 h-4 text-indigo-300"></i>
                  <span>nexusacademy.edu.bd@gmail.com</span>
                </div>
                <div class="flex items-center gap-2 bg-indigo-900/60 px-3.5 py-2 rounded-xl border border-indigo-800">
                  <i data-lucide="phone" class="w-4 h-4 text-indigo-300"></i>
                  <span>01633151496, 01799008544</span>
                </div>
              </div>
            </div>

            <div class="pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-indigo-300">
              <div class="flex items-center gap-2">
                <i data-lucide="map-pin" class="w-4 h-4 text-indigo-400"></i>
                <span>Address: 965/1, Middle Monipur (Opposite Green Pharma), Mirpur-2, Dhaka-1216</span>
              </div>
              <span class="text-[11px] text-indigo-400">© 2024-2025 NexusAcademyLS. Dedicated Role Routing Architecture.</span>
            </div>
          </div>
        </footer>

        <!-- Global Modal Container -->
        <div id="modal-container" class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay hidden">
          <div id="modal-box" class="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden transform transition-all border border-slate-100">
            <!-- Modal HTML injected dynamically -->
          </div>
        </div>

      </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    // Direct role-based redirection:
    // @admin thakle -> admin pannel a niye jabe
    // @teacher thakle -> teacher panal a
    // kichu na thakle -> student panal a niye jabe
    this.routeToRoleDefault(user.role);
    this.checkUnreadNotices();
    this.startNoticesBadgePolling();
  },

  updateNoticesBadge(unreadCount) {
    const count = parseInt(unreadCount, 10) || 0;
    const badge = document.getElementById('notices-badge-counter');
    const mobileBadge = document.getElementById('notices-mobile-badge');
    [badge, mobileBadge].forEach(el => {
      if (el) {
        if (count > 0) {
          el.innerText = count > 99 ? '99+' : count;
          el.classList.remove('hidden');
        } else {
          el.classList.add('hidden');
        }
      }
    });
  },

  async checkUnreadNotices() {
    try {
      const user = API.getCurrentUser();
      if (!user) return;
      const res = await API.getUnreadNoticesCount();
      if (res && res.unreadCount !== undefined) {
        this.updateNoticesBadge(res.unreadCount);
      }
    } catch (e) {
      // silently ignore
    }
  },

  startNoticesBadgePolling() {
    if (this._noticesPollTimer) clearInterval(this._noticesPollTimer);
    this._noticesPollTimer = setInterval(() => {
      this.checkUnreadNotices();
    }, 12000);
  },

  routeToRoleDefault(role) {
    if (role === 'admin') {
      this.switchView('admin');
    } else if (role === 'teacher') {
      this.switchView('ucam');
      if (typeof UCAM !== 'undefined') UCAM.setTab('students');
    } else {
      // Student ("kichu na thakle student panal a niye jabe")
      // Directly opens Nexus ELMS Course Cards so enrolled section cards are immediately visible!
      this.switchView('elms');
    }
  },

  switchView(viewName) {
    this.currentView = viewName;
    const views = ['elms', 'ucam', 'notices', 'messaging', 'admin'];

    views.forEach(v => {
      const panel = document.getElementById(`view-${v}`);
      const btn = document.getElementById(`nav-btn-${v}`);

      if (panel) {
        if (v === viewName) {
          panel.classList.remove('hidden');
        } else {
          panel.classList.add('hidden');
        }
      }

      if (btn) {
        if (v === viewName) {
          btn.classList.remove('nav-tab-inactive');
          btn.classList.add('nav-tab-active');
        } else {
          btn.classList.remove('nav-tab-active');
          btn.classList.add('nav-tab-inactive');
        }
      }
    });

    // Initialize the respective view logic
    if (viewName === 'elms') {
      ELMS.init();
    } else if (viewName === 'ucam') {
      const user = API.getCurrentUser();
      const defaultSubTab = (user && user.role === 'teacher') ? 'students' : 'results';
      const targetTab = (typeof UCAM !== 'undefined' && UCAM.activeTab && UCAM.activeTab !== 'results') ? UCAM.activeTab : defaultSubTab;
      UCAM.init(targetTab);
    } else if (viewName === 'notices') {
      if (typeof NoticeBoard !== 'undefined') NoticeBoard.init();
    } else if (viewName === 'messaging') {
      Messaging.init();
    } else if (viewName === 'admin') {
      Admin.init();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  handleLogout() {
    if (this._noticesPollTimer) clearInterval(this._noticesPollTimer);
    API.logout();
    showToast('Logged out of session', 'info');
    this.renderLoginScreen();
  },

  openProfileMenu() {
    const user = API.getCurrentUser();
    this.showModal(`
      <div class="p-6">
        <div class="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <h3 class="text-lg font-bold text-slate-900">Account Settings</h3>
          <button onclick="App.closeModal()" class="text-slate-400 hover:text-slate-600">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <div class="flex items-center gap-3.5 p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 mb-4">
          <div class="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-2xl shadow-xs">
            ${user.avatar || '👤'}
          </div>
          <div>
            <h4 class="text-sm font-bold text-slate-900">${user.name}</h4>
            <span class="text-xs text-indigo-900 font-semibold uppercase">${user.role} • ${user.id}</span>
            <span class="text-xs text-slate-500 block">${user.email}</span>
          </div>
        </div>

        <!-- Theme Toggle Option -->
        <div class="flex items-center justify-between p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 mb-5">
          <div class="flex items-center gap-2.5">
            <span class="text-lg">${this.isDarkMode ? '🌙' : '☀️'}</span>
            <div>
              <strong class="text-xs font-bold text-slate-800 dark:text-slate-100 block">Appearance Theme</strong>
              <span class="text-[11px] text-slate-500 dark:text-slate-400">Current: ${this.isDarkMode ? 'Dark Mode' : 'Light Mode'}</span>
            </div>
          </div>
          <button type="button" onclick="App.toggleDarkMode(); App.openProfileMenu();" 
            class="px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${this.isDarkMode ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-indigo-50 text-indigo-900 border-indigo-200'}">
            <i data-lucide="${this.isDarkMode ? 'sun' : 'moon'}" class="w-3.5 h-3.5"></i>
            <span>Switch to ${this.isDarkMode ? 'Light' : 'Dark'}</span>
          </button>
        </div>

        <form onsubmit="App.submitChangePassword(event)" class="space-y-3.5">
          <h5 class="text-xs font-bold uppercase tracking-wider text-slate-700">Change Password</h5>
          <div>
            <label class="block text-xs text-slate-500 mb-1">Current Password</label>
            <input type="password" name="oldPassword" required placeholder="Enter current password"
              class="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:outline-none">
          </div>
          <div>
            <label class="block text-xs text-slate-500 mb-1">New Password</label>
            <input type="password" name="newPassword" required placeholder="Minimum 6 characters"
              class="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:outline-none">
          </div>

          <div class="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button type="button" onclick="App.closeModal()" class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition">Close</button>
            <button type="submit" class="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-900 hover:bg-indigo-800 text-white transition shadow-sm">
              Update Password
            </button>
          </div>
        </form>
      </div>
    `);
    if (window.lucide) window.lucide.createIcons();
  },

  async submitChangePassword(event) {
    event.preventDefault();
    const form = event.target;
    try {
      await API.changePassword(form.oldPassword.value, form.newPassword.value);
      showToast('Password changed successfully!', 'success');
      this.closeModal();
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  showModal(htmlContent) {
    const container = document.getElementById('modal-container');
    const box = document.getElementById('modal-box');
    if (!container || !box) return;

    box.innerHTML = htmlContent;
    container.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  },

  closeModal() {
    const container = document.getElementById('modal-container');
    if (container) container.classList.add('hidden');
  }
};

// Global App Auto-Launch
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
