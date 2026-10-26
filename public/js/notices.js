// NexusAcademyLS - Comprehensive Notice Board (Course Notices, Teacher Announcements & Exam Dates)
const NoticeBoard = {
  data: {
    notices: [],
    upcomingExams: [],
    stats: {},
    userClasses: []
  },
  activeFilter: 'all', // 'all' | 'exams' | 'notices' | 'urgent'
  searchQuery: '',
  selectedClassId: 'all',

  async init() {
    const container = document.getElementById('notices-view-area');
    if (!container) return;

    container.innerHTML = `
      <div class="text-center py-16">
        <div class="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p class="text-xs text-slate-500 font-semibold">Loading Notice Board & Exam Schedules...</p>
      </div>
    `;

    try {
      this.data = await API.getNoticeBoard();
      this.updateBadgeCounter();
      this.render();
    } catch (err) {
      container.innerHTML = `
        <div class="p-8 text-center bg-rose-50 text-rose-700 rounded-2xl border border-rose-200">
          <p class="font-bold text-sm">Failed to load Notice Board</p>
          <p class="text-xs mt-1">${err.message}</p>
        </div>
      `;
    }
  },

  updateBadgeCounter() {
    const unreadCount = (this.data.stats && this.data.stats.unreadCount !== undefined)
      ? this.data.stats.unreadCount
      : ((this.data.notices || []).filter(n => !n.isRead).length);

    if (typeof App !== 'undefined' && App.updateNoticesBadge) {
      App.updateNoticesBadge(unreadCount);
    }
  },

  setFilter(filter) {
    this.activeFilter = filter;
    this.renderCardsOnly();
    // Update active filter pill style
    const filterPills = document.querySelectorAll('.notice-filter-pill');
    filterPills.forEach(btn => {
      const f = btn.getAttribute('data-filter');
      if (f === filter) {
        btn.className = 'notice-filter-pill px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 bg-indigo-900 text-white shadow-xs';
      } else {
        btn.className = 'notice-filter-pill px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200';
      }
    });
  },

  setSearchQuery(q) {
    this.searchQuery = (q || '').toLowerCase().trim();
    this.renderCardsOnly();
  },

  setClassFilter(classId) {
    this.selectedClassId = classId;
    this.renderCardsOnly();
  },

  render() {
    const container = document.getElementById('notices-view-area');
    if (!container) return;
    const user = API.getCurrentUser() || {};
    const stats = this.data.stats || {};
    const canPost = user.role === 'teacher' || user.role === 'admin';
    const unreadCount = stats.unreadCount || 0;

    container.innerHTML = `
      <!-- Hero Banner -->
      <div class="elms-header-banner text-white rounded-3xl p-6 sm:p-8 mb-8 shadow-lg relative overflow-hidden">
        <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur text-xs font-semibold uppercase tracking-wider mb-2 text-cyan-200">
              <span class="w-2 h-2 rounded-full ${unreadCount > 0 ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}"></span>
              Notice Board & Exam Schedule (নোটিশ বোর্ড)
            </div>
            <h2 class="text-2xl sm:text-3xl font-extrabold text-white font-outfit">
              Official Course Notices & Exam Dates
            </h2>
            <p class="text-indigo-100 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Stay updated with your teachers' latest course notices, class routines, homework instructions, and upcoming exam dates across all your enrolled batches.
            </p>
          </div>

          <!-- Quick Action: Post Notice Button for Teacher / Admin -->
          ${canPost ? `
            <div class="flex-shrink-0">
              <button onclick="NoticeBoard.openPostNoticeModal()" 
                class="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition shadow-lg flex items-center gap-2 transform active:scale-95">
                <i data-lucide="plus-circle" class="w-4 h-4 text-slate-950"></i>
                <span>+ Post Course Notice</span>
              </button>
            </div>
          ` : ''}
        </div>

        <!-- KPI Mini Stats Strip -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/15">
          <div class="bg-white/10 backdrop-blur rounded-xl p-3">
            <span class="text-[10px] uppercase font-bold text-indigo-200 block">Total Notices</span>
            <strong class="text-xl font-black text-white">${stats.totalNotices || 0}</strong>
          </div>
          <div class="bg-white/10 backdrop-blur rounded-xl p-3">
            <div class="flex items-center justify-between">
              <span class="text-[10px] uppercase font-bold text-emerald-200 block">Unread Notices</span>
              ${unreadCount > 0 ? '<span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>' : ''}
            </div>
            <strong class="text-xl font-black ${unreadCount > 0 ? 'text-emerald-300' : 'text-slate-300'}">${unreadCount}</strong>
          </div>
          <div class="bg-white/10 backdrop-blur rounded-xl p-3">
            <span class="text-[10px] uppercase font-bold text-indigo-200 block">Upcoming Exams</span>
            <strong class="text-xl font-black text-cyan-300">${stats.upcomingExamsCount || 0}</strong>
          </div>
          <div class="bg-white/10 backdrop-blur rounded-xl p-3">
            <span class="text-[10px] uppercase font-bold text-indigo-200 block">Urgent Alerts</span>
            <strong class="text-xl font-black text-amber-300">${stats.urgentCount || 0}</strong>
          </div>
        </div>
      </div>

      <!-- Controls & Filter Toolbar -->
      <div class="nexus-card p-4 sm:p-5 mb-8">
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          <!-- Category Filter Pills & Mark All Read -->
          <div class="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">
            <button onclick="NoticeBoard.setFilter('all')" data-filter="all"
              class="notice-filter-pill px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${this.activeFilter === 'all' ? 'bg-indigo-900 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}">
              <i data-lucide="layers" class="w-3.5 h-3.5"></i>
              <span>All (${(stats.totalNotices || 0) + (stats.upcomingExamsCount || 0)})</span>
            </button>
            <button onclick="NoticeBoard.setFilter('unread')" data-filter="unread"
              class="notice-filter-pill px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${this.activeFilter === 'unread' ? 'bg-indigo-900 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}">
              <i data-lucide="bell-ring" class="w-3.5 h-3.5 ${unreadCount > 0 ? 'text-emerald-500 animate-bounce' : 'text-slate-400'}"></i>
              <span>Unread (${unreadCount})</span>
            </button>
            <button onclick="NoticeBoard.setFilter('exams')" data-filter="exams"
              class="notice-filter-pill px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${this.activeFilter === 'exams' ? 'bg-indigo-900 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}">
              <i data-lucide="calendar" class="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400"></i>
              <span>Exam Dates (${stats.upcomingExamsCount || 0})</span>
            </button>
            <button onclick="NoticeBoard.setFilter('notices')" data-filter="notices"
              class="notice-filter-pill px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${this.activeFilter === 'notices' ? 'bg-indigo-900 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}">
              <i data-lucide="bell" class="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400"></i>
              <span>Course Notices (${stats.totalNotices || 0})</span>
            </button>
            <button onclick="NoticeBoard.setFilter('urgent')" data-filter="urgent"
              class="notice-filter-pill px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${this.activeFilter === 'urgent' ? 'bg-indigo-900 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}">
              <i data-lucide="alert-triangle" class="w-3.5 h-3.5 text-rose-600"></i>
              <span>Urgent (${stats.urgentCount || 0})</span>
            </button>

            <!-- Quick Action: Mark All as Read -->
            <button id="btn-mark-all-read" onclick="NoticeBoard.markAllAsRead()" 
              class="${unreadCount > 0 ? '' : 'hidden'} px-3 py-2 rounded-xl text-xs font-bold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 transition flex items-center gap-1.5 shadow-2xs ml-auto">
              <i data-lucide="check-check" class="w-3.5 h-3.5 text-emerald-600"></i>
              <span>Mark All Read</span>
            </button>
          </div>

          <!-- Search & Course Selector -->
          <div class="flex items-center gap-2.5 w-full lg:w-auto">
            <div class="relative flex-1 sm:w-64">
              <input type="text" id="notice-search-input" oninput="NoticeBoard.setSearchQuery(this.value)"
                placeholder="Search notices, exams, faculty..."
                class="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 focus:outline-none bg-slate-50 dark:bg-slate-900">
            </div>

            <select onchange="NoticeBoard.setClassFilter(this.value)" 
              class="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-indigo-600">
              <option value="all">All Batches</option>
              ${(this.data.userClasses || []).map(c => `
                <option value="${c.id}">${c.code} - ${c.title} (${c.section || 'Sec'})</option>
              `).join('')}
            </select>
          </div>

        </div>
      </div>

      <!-- Feed Container -->
      <div id="notices-feed-content"></div>
    `;

    this.renderCardsOnly();
  },

  renderCardsOnly() {
    const feedContainer = document.getElementById('notices-feed-content');
    if (!feedContainer) return;
    const user = API.getCurrentUser() || {};

    let notices = this.data.notices || [];
    let exams = this.data.upcomingExams || [];

    // Filter by Class
    if (this.selectedClassId !== 'all') {
      notices = notices.filter(n => n.classId === this.selectedClassId || n.classId === null);
      exams = exams.filter(e => e.classId === this.selectedClassId);
    }

    // Filter by Search Query
    if (this.searchQuery) {
      notices = notices.filter(n => {
        const text = `${n.title} ${n.content} ${n.classTitle} ${n.classCode} ${n.teacherName} ${n.authorName}`.toLowerCase();
        return text.includes(this.searchQuery);
      });
      exams = exams.filter(e => {
        const text = `${e.title} ${e.classTitle} ${e.classCode} ${e.teacherName} ${e.type}`.toLowerCase();
        return text.includes(this.searchQuery);
      });
    }

    // Filter by Active Filter
    if (this.activeFilter === 'unread') {
      exams = [];
      notices = notices.filter(n => !n.isRead);
    } else if (this.activeFilter === 'exams') {
      notices = [];
    } else if (this.activeFilter === 'notices') {
      exams = [];
    } else if (this.activeFilter === 'urgent') {
      exams = [];
      notices = notices.filter(n => n.priority === 'urgent' || n.category === 'urgent');
    }

    feedContainer.innerHTML = `
      <div class="space-y-8">
        
        <!-- Section A: Upcoming Exam Dates Schedule (if applicable) -->
        ${(this.activeFilter === 'all' || this.activeFilter === 'exams') ? `
          <div class="space-y-4">
            <div class="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-lg bg-cyan-50 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 flex items-center justify-center font-bold">
                  <i data-lucide="calendar" class="w-4 h-4"></i>
                </div>
                <h3 class="text-lg font-bold text-slate-900 dark:text-white">Upcoming Exam Schedule (আসন্ন পরীক্ষার সময়সূচি)</h3>
              </div>
              <span class="text-xs font-semibold text-slate-500">${exams.length} exams scheduled</span>
            </div>

            ${exams.length === 0 ? `
              <div class="p-8 text-center bg-slate-50 dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                <i data-lucide="calendar-check" class="w-10 h-10 text-slate-400 mx-auto mb-2"></i>
                <p class="text-xs font-bold text-slate-700 dark:text-slate-300">No upcoming exam dates scheduled currently.</p>
                <p class="text-[11px] text-slate-400 mt-1">Teachers will publish Class Test, Midterm and Final exam dates here.</p>
              </div>
            ` : `
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                ${exams.map(e => {
                  const examDateObj = e.examDate ? new Date(e.examDate) : null;
                  const monthName = examDateObj ? examDateObj.toLocaleString('en-US', { month: 'short' }).toUpperCase() : 'DATE';
                  const dayNum = examDateObj ? examDateObj.getDate() : '--';
                  const daysLeft = examDateObj ? Math.ceil((examDateObj - new Date()) / (1000 * 60 * 60 * 24)) : null;

                  return `
                    <div class="nexus-card p-5 border-l-4 border-l-cyan-600 flex flex-col justify-between hover:shadow-md transition">
                      <div>
                        <!-- Header with Date Pill & Course Tag -->
                        <div class="flex items-start justify-between gap-3 mb-3">
                          <div class="flex items-center gap-3">
                            <div class="w-12 h-12 rounded-xl bg-cyan-900 text-white flex flex-col items-center justify-center text-center shadow-xs flex-shrink-0">
                              <span class="text-[9px] font-black tracking-wider leading-none opacity-80">${monthName}</span>
                              <span class="text-base font-black leading-none mt-0.5">${dayNum}</span>
                            </div>
                            <div>
                              <div class="flex items-center gap-1.5">
                                <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-950 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800">
                                  ${e.classCode}
                                </span>
                                <span class="text-[10px] font-bold uppercase text-slate-500">[Sec: ${e.section || 'Regular'}]</span>
                              </div>
                              <h4 class="text-sm font-bold text-slate-800 dark:text-slate-100 mt-1 line-clamp-1">${e.classTitle}</h4>
                            </div>
                          </div>
                        </div>

                        <!-- Exam Name & Type -->
                        <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-100 dark:border-slate-800 my-2">
                          <div class="flex items-center justify-between mb-1">
                            <span class="text-xs font-black text-indigo-950 dark:text-indigo-300 capitalize">${e.title}</span>
                            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 uppercase">${(e.type || 'Exam').replace('_', ' ')}</span>
                          </div>
                          <div class="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                            <span>Max Marks: <strong>${e.maxMarks}</strong></span>
                            <span>Weight: <strong>${e.weightPercentage}%</strong></span>
                          </div>
                        </div>
                      </div>

                      <!-- Footer with Faculty & Countdown -->
                      <div class="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                        <span class="text-[11px] text-slate-500 truncate">
                          Faculty: <strong class="text-slate-700 dark:text-slate-300">${e.teacherName}</strong>
                        </span>
                        ${daysLeft !== null ? `
                          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${daysLeft <= 2 ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}">
                            ${daysLeft < 0 ? 'Concluded' : daysLeft === 0 ? 'Today 🚨' : `In ${daysLeft} days`}
                          </span>
                        ` : ''}
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            `}
          </div>
        ` : ''}

        <!-- Section B: Course Notices & Announcements Stream -->
        ${(this.activeFilter === 'all' || this.activeFilter === 'unread' || this.activeFilter === 'notices' || this.activeFilter === 'urgent') ? `
          <div class="space-y-4">
            <div class="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 flex items-center justify-center font-bold">
                  <i data-lucide="bell" class="w-4 h-4"></i>
                </div>
                <h3 class="text-lg font-bold text-slate-900 dark:text-white">
                  ${this.activeFilter === 'unread' ? 'Unread Course Notices (না পড়া নোটিশ সমূহ)' : 'Important Course Notices (শিক্ষকদের নোটিশ)'}
                </h3>
              </div>
              <span class="text-xs font-semibold text-slate-500">${notices.length} notices</span>
            </div>

            ${notices.length === 0 ? `
              <div class="p-8 text-center bg-slate-50 dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                <i data-lucide="${this.activeFilter === 'unread' ? 'check-circle-2' : 'clipboard-x'}" class="w-10 h-10 ${this.activeFilter === 'unread' ? 'text-emerald-500' : 'text-slate-400'} mx-auto mb-2"></i>
                <p class="text-xs font-bold text-slate-700 dark:text-slate-300">
                  ${this.activeFilter === 'unread' ? 'All caught up! No unread notices. (সব নোটিশ পড়া সম্পন্ন হয়েছে)' : 'No notices found matching your filter.'}
                </p>
                <p class="text-[11px] text-slate-400 mt-1">Check back later or select another batch filter.</p>
              </div>
            ` : `
              <div class="space-y-4">
                ${notices.map(n => {
                  const isUrgent = n.priority === 'urgent' || n.category === 'urgent';
                  const isExam = n.category === 'exam' || Boolean(n.examDate);
                  const isAuthor = user.id === n.postedBy;
                  const isAdmin = user.role === 'admin';
                  const canEdit = isAuthor || isAdmin;
                  const canDelete = isAuthor || isAdmin;
                  const isUnread = !n.isRead;

                  return `
                    <div id="notice-card-${n.id}" onclick="NoticeBoard.onNoticeClick('${n.id}', event)" 
                      class="nexus-card p-5 sm:p-6 border-l-4 ${isUrgent ? 'border-l-rose-500' : isExam ? 'border-l-cyan-600' : 'border-l-indigo-600'} ${isUnread ? 'ring-2 ring-indigo-500/30 bg-indigo-50/20 dark:bg-slate-900 shadow-sm' : 'opacity-90 hover:opacity-100'} hover:shadow-md transition cursor-pointer relative group">
                      
                      <!-- Notice Header -->
                      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                        <div class="flex items-center gap-3">
                          <div class="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 border border-indigo-100 dark:border-indigo-800 flex items-center justify-center text-lg flex-shrink-0">
                            ${n.authorAvatar || '👨‍🏫'}
                          </div>
                          <div>
                            <div class="flex items-center gap-2 flex-wrap">
                              <strong class="text-xs font-bold text-slate-900 dark:text-white">${n.authorName}</strong>
                              <span class="text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${n.authorRole === 'teacher' ? 'badge-role-teacher' : 'badge-role-admin'}">${n.authorRole}</span>
                              <span class="text-slate-400">•</span>
                              <span class="text-[11px] font-semibold text-slate-500">
                                ${new Date(n.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} at ${new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <div class="flex items-center gap-2 mt-1 flex-wrap">
                              <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-950 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800">
                                ${n.classCode} - ${n.classTitle} [${n.section || 'All Batches'}]
                              </span>
                            </div>
                          </div>
                        </div>

                        <!-- Read Status, Priority Badges & Controls -->
                        <div class="flex items-center gap-2 flex-wrap justify-end">
                          <!-- Unread vs Read Badge -->
                          ${isUnread ? `
                            <span class="notice-unread-badge px-2.5 py-1 rounded-full text-[9px] font-black bg-emerald-500 text-white shadow-xs flex items-center gap-1.5 animate-pulse">
                              <span class="w-1.5 h-1.5 rounded-full bg-white"></span>
                              <span>NEW (নতুন নোটিশ)</span>
                            </span>
                          ` : `
                            <span class="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center gap-1">
                              <i data-lucide="check-check" class="w-3 h-3 text-emerald-600"></i>
                              <span>Read (পড়া হয়েছে)</span>
                            </span>
                          `}

                          ${isUrgent ? `
                            <span class="px-2.5 py-1 rounded-lg text-[10px] font-black bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 flex items-center gap-1">
                              <i data-lucide="alert-circle" class="w-3 h-3 text-rose-600"></i>
                              <span>URGENT</span>
                            </span>
                          ` : ''}

                          ${isExam ? `
                            <span class="px-2.5 py-1 rounded-lg text-[10px] font-black bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300 border border-cyan-300 flex items-center gap-1">
                              <i data-lucide="calendar" class="w-3 h-3 text-cyan-600"></i>
                              <span>EXAM NOTICE</span>
                            </span>
                          ` : ''}

                          ${canEdit ? `
                            <button onclick="event.stopPropagation(); NoticeBoard.openEditNoticeModal('${n.id}')" 
                              class="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950 transition" title="Edit notice (নোটিশ পরিবর্তন)">
                              <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
                            </button>
                          ` : ''}

                          ${canDelete ? `
                            <button onclick="event.stopPropagation(); NoticeBoard.deleteNotice('${n.id}', '${n.title.replace(/'/g, "\\'")}')" 
                              class="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950 transition" title="Delete notice (নোটিশ মুছে ফেলুন)">
                              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                            </button>
                          ` : ''}
                        </div>
                      </div>

                      <!-- Notice Body -->
                      <div class="mt-4">
                        <h4 class="text-base font-bold text-slate-900 dark:text-white leading-snug mb-2 group-hover:text-indigo-600 transition">
                          ${n.title}
                        </h4>

                        <!-- Exam Date Highlight Ribbon (if attached to notice) -->
                        ${n.examDate ? `
                          <div class="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 flex items-center gap-2.5 my-3 text-amber-900 dark:text-amber-200 text-xs">
                            <i data-lucide="calendar-clock" class="w-4 h-4 text-amber-600 flex-shrink-0"></i>
                            <div>
                              <strong class="font-bold">Scheduled Exam Date:</strong>
                              <span class="font-mono font-bold bg-amber-100 dark:bg-amber-900 px-1.5 py-0.5 rounded ml-1">
                                ${new Date(n.examDate).toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                              </span>
                            </div>
                          </div>
                        ` : ''}

                        <p class="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line line-clamp-3">
                          ${n.content}
                        </p>
                      </div>

                      <!-- Notice Footer Action -->
                      <div class="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div class="flex items-center gap-2">
                          <span class="text-[11px] text-slate-400">
                            ID: <span class="font-mono">${n.id}</span>
                          </span>
                          <span class="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold group-hover:underline">
                            Click to view full notice →
                          </span>
                        </div>

                        <div class="flex items-center gap-2">
                          ${isUnread ? `
                            <button onclick="event.stopPropagation(); NoticeBoard.markAsRead('${n.id}', event)" 
                              class="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition flex items-center gap-1 shadow-2xs" 
                              title="Mark as read (পড়া হয়েছে হিসেবে চিহ্নিত করুন)">
                              <i data-lucide="check" class="w-3 h-3 text-emerald-600"></i>
                              <span>Mark Read</span>
                            </button>
                          ` : ''}

                          ${user.role === 'student' && n.postedBy ? `
                            <button onclick="event.stopPropagation(); Messaging.openChat('${n.postedBy}', '${n.classId || ''}')" 
                              class="px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-indigo-900 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition border border-indigo-200 dark:border-indigo-800 flex items-center gap-1.5 shadow-2xs">
                              <i data-lucide="message-square" class="w-3 h-3"></i>
                              <span>Ask Teacher</span>
                            </button>
                          ` : ''}
                        </div>
                      </div>

                    </div>
                  `;
                }).join('')}
              </div>
            `}
          </div>
        ` : ''}

      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  // On notice card click: Mark as read and open detail modal
  async onNoticeClick(id, event) {
    if (event && event.target) {
      // Don't trigger if user clicked on specific sub-buttons (edit, delete, message)
      const isButton = event.target.closest('button');
      if (isButton && !isButton.classList.contains('card-click-allow')) {
        return;
      }
    }

    // Mark as read immediately
    await this.markAsRead(id);

    // Open full detail modal
    this.openNoticeDetailModal(id);
  },

  async markAsRead(id, event) {
    if (event && event.stopPropagation) event.stopPropagation();
    const notice = (this.data.notices || []).find(n => n.id === id);
    if (!notice || notice.isRead) return;

    // Optimistically mark as read
    notice.isRead = true;
    if (this.data.stats && this.data.stats.unreadCount > 0) {
      this.data.stats.unreadCount--;
    }
    this.updateBadgeCounter();

    // Update card styling in DOM
    const card = document.getElementById(`notice-card-${id}`);
    if (card) {
      card.classList.remove('ring-2', 'ring-indigo-500/30', 'bg-indigo-50/20');
      card.classList.add('opacity-90');
      const badge = card.querySelector('.notice-unread-badge');
      if (badge) {
        badge.outerHTML = `
          <span class="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <i data-lucide="check-check" class="w-3 h-3 text-emerald-600"></i>
            <span>Read (পড়া হয়েছে)</span>
          </span>
        `;
      }
      if (window.lucide) window.lucide.createIcons();
    }

    // Update "Mark All Read" button visibility
    const markAllBtn = document.getElementById('btn-mark-all-read');
    if (markAllBtn && this.data.stats && this.data.stats.unreadCount <= 0) {
      markAllBtn.classList.add('hidden');
    }

    try {
      const res = await API.markNoticeAsRead(id);
      if (res && res.unreadCount !== undefined) {
        if (this.data.stats) this.data.stats.unreadCount = res.unreadCount;
        this.updateBadgeCounter();
      }
    } catch (err) {
      console.error('Failed to mark notice as read:', err);
    }
  },

  async markAllAsRead() {
    (this.data.notices || []).forEach(n => { n.isRead = true; });
    if (this.data.stats) this.data.stats.unreadCount = 0;
    this.updateBadgeCounter();
    this.render();

    try {
      await API.markAllNoticesAsRead();
      showToast('All notices marked as read! (সকল নোটিশ পড়া হয়েছে হিসেবে চিহ্নিত)', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  openNoticeDetailModal(id) {
    const n = (this.data.notices || []).find(item => item.id === id);
    if (!n) return;
    const user = API.getCurrentUser() || {};
    const isUrgent = n.priority === 'urgent' || n.category === 'urgent';
    const isExam = n.category === 'exam' || Boolean(n.examDate);

    App.showModal(`
      <div class="p-6 max-w-2xl w-full">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
          <div class="flex items-center gap-2">
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${isUrgent ? 'bg-rose-100 text-rose-800' : isExam ? 'bg-cyan-100 text-cyan-800' : 'bg-indigo-100 text-indigo-900'}">
              ${isUrgent ? 'URGENT NOTICE' : isExam ? 'EXAM ANNOUNCEMENT' : 'COURSE NOTICE'}
            </span>
            <span class="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center gap-1">
              <i data-lucide="check-check" class="w-3 h-3 text-emerald-600"></i> Read (পড়া হয়েছে)
            </span>
          </div>
          <button onclick="App.closeModal()" class="text-slate-400 hover:text-slate-600">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <!-- Author Header -->
        <div class="flex items-center gap-3 mb-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
          <span class="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 flex items-center justify-center text-lg shadow-xs flex-shrink-0">
            ${n.authorAvatar || '👨‍🏫'}
          </span>
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <strong class="text-xs font-bold text-slate-900 dark:text-white truncate">${n.authorName}</strong>
              <span class="text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${n.authorRole === 'teacher' ? 'badge-role-teacher' : 'badge-role-admin'}">${n.authorRole}</span>
            </div>
            <span class="text-[10px] text-slate-400 block truncate">
              ${n.classCode} - ${n.classTitle} [${n.section || 'All Batches'}] • ${new Date(n.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} at ${new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        <!-- Notice Content -->
        <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-3 leading-snug">
          ${n.title}
        </h3>

        ${n.examDate ? `
          <div class="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center gap-2.5 my-3 text-amber-900 dark:text-amber-200 text-xs font-bold">
            <i data-lucide="calendar-clock" class="w-4 h-4 text-amber-600 flex-shrink-0"></i>
            <span>Scheduled Exam Date: ${new Date(n.examDate).toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        ` : ''}

        <div class="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line max-h-72 overflow-y-auto">
          ${n.content}
        </div>

        <div class="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span class="text-[11px] text-slate-400">Notice ID: ${n.id}</span>
          <div class="flex items-center gap-2">
            ${user.role === 'student' && n.postedBy ? `
              <button onclick="App.closeModal(); Messaging.openChat('${n.postedBy}', '${n.classId || ''}')" 
                class="px-3 py-2 rounded-xl text-xs font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-900 dark:text-indigo-200 hover:bg-indigo-100 transition flex items-center gap-1.5 border border-indigo-200 dark:border-indigo-800">
                <i data-lucide="message-square" class="w-3.5 h-3.5"></i>
                <span>Direct Message Teacher</span>
              </button>
            ` : ''}
            <button type="button" onclick="App.closeModal()" class="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition">
              Close
            </button>
          </div>
        </div>
      </div>
    `);
    if (window.lucide) window.lucide.createIcons();
  },

  openPostNoticeModal() {
    const user = API.getCurrentUser() || {};
    const classes = this.data.userClasses || [];

    App.showModal(`
      <div class="p-6">
        <div class="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
          <div class="flex items-center gap-2">
            <span class="text-xl">📢</span>
            <h3 class="text-lg font-bold text-slate-900 dark:text-white">Post Important Course Notice</h3>
          </div>
          <button onclick="App.closeModal()" class="text-slate-400 hover:text-slate-600">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <form onsubmit="NoticeBoard.submitNotice(event)" class="space-y-4">
          <!-- Class Selector -->
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Target Course Section
            </label>
            <select name="classId" required class="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-indigo-600 bg-white dark:bg-slate-900">
              ${user.role === 'admin' ? '<option value="">All Academy Batches (Global Announcement)</option>' : ''}
              ${classes.map(c => `
                <option value="${c.id}">${c.code} - ${c.title} • [Sec: ${c.section || 'Regular'}]</option>
              `).join('')}
            </select>
            <span class="text-[10px] text-slate-400 mt-1 block">Notice will appear on the Notice Board for students enrolled in this section.</span>
          </div>

          <!-- Notice Title -->
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Notice Title
            </label>
            <input type="text" name="title" required placeholder="e.g. Physics Chapter 7 Class Test Date & Syllabus Announcement"
              class="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-indigo-600 bg-white dark:bg-slate-900">
          </div>

          <!-- Notice Category & Priority Grid -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">Category</label>
              <select name="category" class="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-indigo-600 bg-white dark:bg-slate-900">
                <option value="exam">📅 Exam Announcement (পরীক্ষা সংক্রান্ত)</option>
                <option value="routine">⏰ Routine & Time Change (রুটিন পরিবর্তন)</option>
                <option value="syllabus">📚 Homework & Syllabus (সিলেবাস/টাস্ক)</option>
                <option value="general">ℹ️ General Academic Notice (সাধারণ)</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">Priority Level</label>
              <select name="priority" class="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-indigo-600 bg-white dark:bg-slate-900">
                <option value="normal">Normal Notice</option>
                <option value="important" selected>Important 📌</option>
                <option value="urgent">Urgent Alert 🚨</option>
              </select>
            </div>
          </div>

          <!-- Optional Exam Date -->
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Scheduled Exam Date (Optional)
            </label>
            <input type="date" name="examDate"
              class="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-indigo-600 bg-white dark:bg-slate-900">
            <span class="text-[10px] text-slate-400 mt-1 block">Specify a date if this notice informs students of an upcoming test/exam.</span>
          </div>

          <!-- Notice Content -->
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Notice Details & Instructions
            </label>
            <textarea name="content" required rows="4" placeholder="Write full details, chapters included, test format, allowed materials..."
              class="w-full text-xs p-3.5 rounded-xl border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-indigo-600 bg-white dark:bg-slate-900"></textarea>
          </div>

          <!-- Action Buttons -->
          <div class="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <button type="button" onclick="App.closeModal()" class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition">Cancel</button>
            <button type="submit" class="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-900 hover:bg-indigo-800 text-white transition shadow-sm flex items-center gap-1.5">
              <i data-lucide="send" class="w-3.5 h-3.5"></i>
              <span>Publish Notice</span>
            </button>
          </div>
        </form>
      </div>
    `);

    if (window.lucide) window.lucide.createIcons();
  },

  async submitNotice(event) {
    event.preventDefault();
    const form = event.target;
    const payload = {
      classId: form.classId.value || null,
      title: form.title.value.trim(),
      content: form.content.value.trim(),
      category: form.category.value,
      priority: form.priority.value,
      examDate: form.examDate.value || null
    };

    try {
      await API.createNotice(payload);
      showToast('Notice published successfully!', 'success');
      App.closeModal();
      await this.init();
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  openEditNoticeModal(id) {
    const user = API.getCurrentUser() || {};
    const notice = (this.data.notices || []).find(n => n.id === id);
    if (!notice) {
      showToast('Notice not found', 'error');
      return;
    }

    const classes = this.data.userClasses || [];

    App.showModal(`
      <div class="p-6">
        <div class="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
          <div class="flex items-center gap-2">
            <span class="text-xl">✏️</span>
            <div>
              <h3 class="text-lg font-bold text-slate-900 dark:text-white">Edit Course Notice</h3>
              <p class="text-xs text-slate-400">Notice ID: ${notice.id} • Posted by ${notice.authorName}</p>
            </div>
          </div>
          <button onclick="App.closeModal()" class="text-slate-400 hover:text-slate-600">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <form onsubmit="NoticeBoard.submitEditNotice(event, '${notice.id}')" class="space-y-4">
          <!-- Class Selector -->
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Target Course Section
            </label>
            <select name="classId" required class="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-indigo-600 bg-white dark:bg-slate-900">
              ${user.role === 'admin' ? `<option value="" ${!notice.classId ? 'selected' : ''}>All Academy Batches (Global Announcement)</option>` : ''}
              ${classes.map(c => `
                <option value="${c.id}" ${c.id === notice.classId ? 'selected' : ''}>${c.code} - ${c.title} • [Sec: ${c.section || 'Regular'}]</option>
              `).join('')}
            </select>
          </div>

          <!-- Notice Title -->
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Notice Headline / Topic
            </label>
            <input type="text" name="title" required value="${(notice.title || '').replace(/"/g, '&quot;')}"
              placeholder="e.g. Schedule Change, Exam Syllabus, Homework Deadline..."
              class="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-indigo-600 bg-white dark:bg-slate-900">
          </div>

          <!-- Category & Priority in 2 Cols -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">Category</label>
              <select name="category" class="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-indigo-600 bg-white dark:bg-slate-900">
                <option value="general" ${notice.category === 'general' ? 'selected' : ''}>General Notice</option>
                <option value="exam" ${notice.category === 'exam' ? 'selected' : ''}>Upcoming Exam Date</option>
                <option value="homework" ${notice.category === 'homework' ? 'selected' : ''}>Homework / Assignment</option>
                <option value="urgent" ${notice.category === 'urgent' ? 'selected' : ''}>Urgent Alert</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">Priority</label>
              <select name="priority" class="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-indigo-600 bg-white dark:bg-slate-900">
                <option value="normal" ${notice.priority === 'normal' ? 'selected' : ''}>Normal Notice</option>
                <option value="important" ${notice.priority === 'important' ? 'selected' : ''}>Important 📌</option>
                <option value="urgent" ${notice.priority === 'urgent' ? 'selected' : ''}>Urgent Alert 🚨</option>
              </select>
            </div>
          </div>

          <!-- Optional Exam Date -->
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Scheduled Exam Date (Optional)
            </label>
            <input type="date" name="examDate" value="${notice.examDate ? notice.examDate.split('T')[0] : ''}"
              class="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-indigo-600 bg-white dark:bg-slate-900">
          </div>

          <!-- Notice Content -->
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Notice Details & Instructions
            </label>
            <textarea name="content" required rows="4" placeholder="Write full details..."
              class="w-full text-xs p-3.5 rounded-xl border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-indigo-600 bg-white dark:bg-slate-900">${(notice.content || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</textarea>
          </div>

          <!-- Action Buttons -->
          <div class="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <button type="button" onclick="App.closeModal()" class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition">Cancel</button>
            <button type="submit" class="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-900 hover:bg-indigo-800 text-white transition shadow-sm flex items-center gap-1.5">
              <i data-lucide="check" class="w-3.5 h-3.5"></i>
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    `);

    if (window.lucide) window.lucide.createIcons();
  },

  async submitEditNotice(event, id) {
    event.preventDefault();
    const form = event.target;
    const payload = {
      classId: form.classId.value || null,
      title: form.title.value.trim(),
      content: form.content.value.trim(),
      category: form.category.value,
      priority: form.priority.value,
      examDate: form.examDate.value || null
    };

    try {
      await API.updateNotice(id, payload);
      showToast('Notice updated successfully!', 'success');
      App.closeModal();
      await this.init();
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  async deleteNotice(id, title) {
    if (!confirm(`Are you sure you want to delete this notice: "${title}"?`)) return;
    try {
      await API.deleteNotice(id);
      showToast('Notice deleted', 'success');
      await this.init();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }
};
