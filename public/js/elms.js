// NexusAcademyLS - ELMS (e-Learning Management System) Portal with Nexus ELMS Course Cards Grid
const ELMS = {
  viewMode: 'cards', // 'cards' | 'course'
  currentClassId: null,
  classes: [],
  materials: [],
  links: [],
  announcements: [],

  // Theme palettes for Nexus ELMS Course Cards
  cardThemes: [
    { gradient: 'from-blue-700 via-indigo-800 to-indigo-950', badge: 'bg-blue-100 text-blue-900', border: 'hover:border-indigo-400' },
    { gradient: 'from-emerald-700 via-teal-800 to-slate-900', badge: 'bg-emerald-100 text-emerald-900', border: 'hover:border-emerald-400' },
    { gradient: 'from-purple-700 via-indigo-900 to-slate-950', badge: 'bg-purple-100 text-purple-900', border: 'hover:border-purple-400' },
    { gradient: 'from-amber-700 via-orange-800 to-stone-900', badge: 'bg-amber-100 text-amber-900', border: 'hover:border-amber-400' },
    { gradient: 'from-rose-700 via-pink-900 to-slate-950', badge: 'bg-rose-100 text-rose-900', border: 'hover:border-rose-400' }
  ],

  async init(targetClassId = null) {
    try {
      this.classes = await API.getClasses();
      if (this.classes.length === 0) {
        this.renderEmpty();
        return;
      }

      if (targetClassId && this.classes.some(c => c.id === targetClassId)) {
        this.viewMode = 'course';
        await this.loadClassData(targetClassId);
      } else {
        // Default to Nexus ELMS Course Cards Dashboard
        this.viewMode = 'cards';
        this.renderCourseCards();
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  showCardsView() {
    this.viewMode = 'cards';
    this.renderCourseCards();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  // 1. Nexus ELMS COURSE CARDS GRID DASHBOARD
  renderCourseCards() {
    const container = document.getElementById('elms-content-area');
    if (!container) return;
    const user = API.getCurrentUser();

    container.innerHTML = `
      <!-- Nexus ELMS Course Overview Header -->
      <div class="elms-header-banner text-white rounded-2xl p-6 sm:p-8 mb-8 shadow-lg relative overflow-hidden">
        <div class="relative z-10">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur text-xs font-semibold uppercase tracking-wider mb-2">
                <span class="w-2 h-2 rounded-full bg-cyan-400"></span>
                Nexus ELMS Course Overview Dashboard
              </div>
              <h2 class="text-2xl sm:text-3xl font-extrabold text-white">My Enrolled Course Sections</h2>
              <p class="text-indigo-100 text-xs sm:text-sm mt-1 max-w-xl leading-relaxed">
                ${user.role === 'student' 
                  ? 'Showing only the specific course sections you are currently enrolled in at Nexus Academy.' 
                  : 'Showing assigned subject sections under your faculty instruction.'}
              </p>
            </div>

            <!-- Total Enrolled Sections Pill -->
            <div class="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-3.5 flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-white text-indigo-950 flex items-center justify-center font-black text-lg shadow">
                ${this.classes.length}
              </div>
              <div>
                <h4 class="text-xs font-bold text-white">Active Sections</h4>
                <p class="text-[11px] text-indigo-200">Enrolled & Authorized</p>
              </div>
            </div>
          </div>

          <!-- Course Search / Filter Bar -->
          <div class="mt-6 pt-5 border-t border-white/15 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div class="relative w-full sm:w-80">
              <input type="text" id="elms-course-search" oninput="ELMS.filterCourseCards(this.value)"
                placeholder="Search course code or subject..." 
                class="w-full text-xs text-slate-800 font-medium px-4 py-2.5 rounded-xl bg-white border-0 focus:ring-2 focus:ring-cyan-300 shadow-sm">
            </div>

            <div class="text-xs text-indigo-200 font-medium">
              Click any course card below to access study materials and lecture notes.
            </div>
          </div>
        </div>
      </div>

      <!-- Notice Board Quick Alert & Upcoming Exams Strip -->
      <div class="mb-8 p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800/60 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-lg shadow-xs flex-shrink-0">
            🔔
          </div>
          <div>
            <div class="flex items-center gap-2">
              <strong class="text-xs font-bold text-amber-950 dark:text-amber-200">Notice Board & Upcoming Exam Schedules</strong>
              <span class="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100">Live</span>
            </div>
            <p class="text-[11px] text-amber-800/90 dark:text-amber-300 mt-0.5">Check official exam dates, class routines, and syllabus notices posted by your teachers.</p>
          </div>
        </div>
        <button onclick="App.switchView('notices')" 
          class="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition flex items-center gap-1.5 shadow-xs whitespace-nowrap self-start sm:self-auto">
          <span>Open Notice Board</span>
          <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
        </button>
      </div>

      <!-- Nexus ELMS COURSE CARDS GRID -->
      <div id="elms-course-cards-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        ${this.classes.map((cls, idx) => {
          const theme = this.cardThemes[idx % this.cardThemes.length];
          return `
            <div class="nexus-card overflow-hidden flex flex-col justify-between group hover:shadow-xl transition-all duration-200 ${theme.border} border-2">
              
              <!-- Card Top Decorative Banner (as like Nexus ELMS) -->
              <div>
                <div class="bg-gradient-to-r ${theme.gradient} p-5 text-white relative">
                  <div class="flex items-center justify-between mb-2">
                    <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 backdrop-blur text-white border border-white/20">
                      ${cls.code}
                    </span>
                    <span class="text-[11px] font-semibold text-white/80">
                      ${cls.term || 'Session 2024-25'}
                    </span>
                  </div>

                  <h3 class="text-lg font-bold text-white group-hover:text-cyan-200 transition line-clamp-2 leading-snug">
                    ${cls.title}
                  </h3>
                  
                  <span class="inline-block mt-2 text-[11px] font-bold px-2 py-0.5 rounded bg-black/25 text-white/90">
                    Subject: ${cls.subject || cls.title} • Section: ${cls.section || 'Regular'}
                  </span>
                </div>

                <!-- Card Body Details -->
                <div class="p-5 space-y-3">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-lg shadow-xs flex-shrink-0">
                      👨‍🏫
                    </div>
                    <div class="truncate">
                      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Faculty Instructor</span>
                      <h4 class="text-xs font-bold text-slate-800 truncate">${cls.teacherName} <span class="text-indigo-900 font-bold">(${cls.teacherSubject || cls.subject || 'Faculty'})</span></h4>
                    </div>
                  </div>

                  <div class="pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                    <div class="flex items-center gap-2">
                      <i data-lucide="clock" class="w-4 h-4 text-indigo-600 flex-shrink-0"></i>
                      <span class="truncate">${cls.schedule}</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <i data-lucide="map-pin" class="w-4 h-4 text-slate-400 flex-shrink-0"></i>
                      <span class="truncate">${cls.room}</span>
                    </div>
                  </div>

                  <!-- Quick Counters (Notes, Links, Exams) -->
                  <div class="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span class="flex items-center gap-1 font-semibold text-indigo-950">
                      <i data-lucide="file-text" class="w-3.5 h-3.5 text-indigo-600"></i>
                      ${cls.materialsCount || 0} Notes
                    </span>
                    <span class="flex items-center gap-1 font-semibold text-sky-950">
                      <i data-lucide="link" class="w-3.5 h-3.5 text-sky-600"></i>
                      ${cls.linksCount || 0} Links
                    </span>
                    <span class="flex items-center gap-1 font-semibold text-slate-700">
                      <i data-lucide="users" class="w-3.5 h-3.5 text-slate-400"></i>
                      ${cls.enrolledCount || 0} Enrolled
                    </span>
                  </div>
                </div>
              </div>

              <!-- Card Bottom Action Button -->
              <div class="p-4 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
                <button onclick="ELMS.openCourseDirect('${cls.id}')" 
                  class="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold bg-indigo-900 hover:bg-indigo-800 text-white transition flex items-center justify-center gap-1.5 shadow-xs group-hover:shadow-md">
                  <span>Enter Course</span>
                  <i data-lucide="arrow-right" class="w-3.5 h-3.5 group-hover:translate-x-1 transition"></i>
                </button>
                ${cls.teacherId ? `
                  <button onclick="event.stopPropagation(); Messaging.openChat('${cls.teacherId}', '${cls.id}')" 
                    title="Send message to ${cls.teacherName}"
                    class="py-2.5 px-3 rounded-xl text-xs font-bold bg-white hover:bg-indigo-50 text-indigo-950 border border-slate-200 transition flex items-center justify-center gap-1.5 shadow-xs">
                    <i data-lucide="message-square" class="w-3.5 h-3.5 text-indigo-600"></i>
                    <span>Teacher</span>
                  </button>
                ` : ''}
              </div>

            </div>
          `;
        }).join('')}
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  filterCourseCards(query) {
    const grid = document.getElementById('elms-course-cards-grid');
    if (!grid) return;
    const cards = grid.children;
    const q = query.toLowerCase().trim();

    Array.from(cards).forEach(card => {
      const text = card.innerText.toLowerCase();
      card.style.display = text.includes(q) ? 'flex' : 'none';
    });
  },

  async openCourseDirect(classId) {
    this.viewMode = 'course';
    await this.loadClassData(classId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  // 2. DETAILED COURSE WORKSPACE (Materials, Links, Discussions, Classmates)
  async loadClassData(classId) {
    this.currentClassId = classId;
    const container = document.getElementById('elms-content-area');
    if (!container) return;

    try {
      const [materials, links, announcements, enrolledStudents] = await Promise.all([
        API.getMaterials(classId),
        API.getLinks(classId),
        API.getAnnouncements(classId),
        API.getClassStudents(classId).catch(() => [])
      ]);

      this.materials = materials;
      this.links = links;
      this.announcements = announcements;
      this.enrolledStudents = enrolledStudents || [];
      this.renderClassWorkspace();
    } catch (err) {
      showToast('Failed to load class resources: ' + err.message, 'error');
    }
  },

  renderEmpty() {
    const container = document.getElementById('elms-content-area');
    if (!container) return;
    const user = API.getCurrentUser();

    container.innerHTML = `
      <div class="bg-white rounded-2xl p-12 text-center border border-slate-200 max-w-xl mx-auto my-8">
        <div class="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <i data-lucide="book-x" class="w-8 h-8"></i>
        </div>
        <h3 class="text-xl font-bold text-slate-800 mb-2">No Enrolled Course Sections Found</h3>
        <p class="text-slate-600 text-sm mb-6">
          ${user.role === 'student' 
            ? 'You are not currently enrolled in any coaching course or section. Class enrollment is managed exclusively by your subject teachers.' 
            : 'No classes are assigned yet. Administrators can create and assign classes in the Admin console.'}
        </p>
        ${user.role === 'teacher' ? `
          <button onclick="App.openCreateClassModal()" class="px-5 py-2.5 bg-indigo-900 text-white rounded-xl text-sm font-semibold hover:bg-indigo-800 transition">
            Request Class Assignment
          </button>
        ` : ''}
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
  },

  renderClassWorkspace() {
    const container = document.getElementById('elms-content-area');
    if (!container) return;
    const user = API.getCurrentUser();
    const currentClass = this.classes.find(c => c.id === this.currentClassId) || this.classes[0];
    const isTeacher = user.role === 'teacher' || user.role === 'admin';

    // Group materials by topic
    const groupedMaterials = {};
    this.materials.forEach(m => {
      const topic = m.topic || 'General Lecture Notes';
      if (!groupedMaterials[topic]) groupedMaterials[topic] = [];
      groupedMaterials[topic].push(m);
    });

    // Group links by topic
    const groupedLinks = {};
    this.links.forEach(l => {
      const topic = l.topic || 'General Resource Links';
      if (!groupedLinks[topic]) groupedLinks[topic] = [];
      groupedLinks[topic].push(l);
    });

    container.innerHTML = `
      <!-- Breadcrumb Navigation & Back to Course Cards Button -->
      <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
        <button onclick="ELMS.showCardsView()" 
          class="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-indigo-900 hover:border-indigo-300 text-xs font-bold transition shadow-xs">
          <i data-lucide="arrow-left" class="w-4 h-4"></i>
          <span>← Back to My Course Cards</span>
        </button>

        <div class="flex items-center gap-2 text-xs font-semibold text-slate-400">
          <span>My Courses</span>
          <span>&gt;</span>
          <span class="text-indigo-950 font-bold">${currentClass.code} (${currentClass.section})</span>
        </div>
      </div>

      <!-- ELMS Course Header Banner -->
      <div class="elms-header-banner text-white rounded-2xl p-6 sm:p-8 mb-8 shadow-lg relative overflow-hidden">
        <div class="relative z-10">
          <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur text-xs font-semibold uppercase tracking-wider mb-3">
                <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
                ${currentClass.code} • ${currentClass.section}
              </div>
              <h2 class="text-2xl sm:text-3xl font-extrabold text-white mb-2">${currentClass.title}</h2>
              <p class="text-indigo-100 text-xs sm:text-sm max-w-2xl leading-relaxed">${currentClass.description || 'Comprehensive study modules, lecture notes, formula sheets, and external references.'}</p>
              
              <div class="flex flex-wrap items-center gap-3 mt-4 text-xs sm:text-sm text-indigo-200">
                <span class="flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-lg">
                  <i data-lucide="user-check" class="w-4 h-4 text-indigo-300"></i>
                  Faculty: <strong class="text-white ml-1">${currentClass.teacherName}</strong>
                </span>
                <span class="flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-lg">
                  <i data-lucide="calendar" class="w-4 h-4 text-indigo-300"></i>
                  ${currentClass.schedule}
                </span>
                <span class="flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-lg">
                  <i data-lucide="map-pin" class="w-4 h-4 text-indigo-300"></i>
                  ${currentClass.room}
                </span>
                <span class="flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-lg">
                  <i data-lucide="users" class="w-4 h-4 text-indigo-300"></i>
                  ${currentClass.enrolledCount} Enrolled
                </span>
              </div>
            </div>

            <!-- Course Navigation & Quick Actions -->
            <div class="flex flex-col gap-2 min-w-[240px]">
              <div class="flex items-center justify-between">
                <span class="text-xs font-semibold text-indigo-200">Active Course Section:</span>
                <button onclick="ELMS.renderCourseCards()" class="text-[11px] font-bold text-white hover:underline flex items-center gap-1">
                  <i data-lucide="layout-grid" class="w-3 h-3"></i>
                  All Cards
                </button>
              </div>
              <select onchange="ELMS.loadClassData(this.value)" class="w-full bg-white text-slate-800 text-xs font-bold rounded-xl px-4 py-2.5 border-0 focus:ring-2 focus:ring-white shadow-md">
                ${this.classes.map(c => `
                  <option value="${c.id}" ${c.id === this.currentClassId ? 'selected' : ''}>
                    ${c.code} - ${c.title} (${c.section})
                  </option>
                `).join('')}
              </select>

              ${user.role === 'student' ? `
                <div class="flex flex-col gap-2">
                  <button onclick="Messaging.openGroupChat('${currentClass.id}')" class="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-md">
                    <i data-lucide="messages-square" class="w-4 h-4 text-cyan-300"></i>
                    Section Group Chat (গ্রুপ চ্যাট)
                  </button>
                  <button onclick="Messaging.openChat('${currentClass.teacherId}', '${currentClass.id}')" class="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-sm">
                    <i data-lucide="message-square" class="w-3.5 h-3.5"></i>
                    Message Teacher (${currentClass.teacherName})
                  </button>
                </div>
              ` : `
                <div class="space-y-2">
                  <button onclick="Messaging.openGroupChat('${currentClass.id}')" class="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-md">
                    <i data-lucide="messages-square" class="w-4 h-4 text-cyan-300"></i>
                    Section Group Chat (গ্রুপ চ্যাট)
                  </button>
                  <div class="flex items-center gap-2">
                    <button onclick="ELMS.openUploadMaterialModal()" class="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-semibold backdrop-blur transition">
                      <i data-lucide="upload" class="w-3.5 h-3.5"></i>
                      Upload Notes
                    </button>
                    <button onclick="ELMS.openAddLinkModal()" class="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-semibold backdrop-blur transition">
                      <i data-lucide="link" class="w-3.5 h-3.5"></i>
                      Add Link
                    </button>
                  </div>
                </div>
              `}
            </div>
          </div>
        </div>
      </div>

      <!-- Main ELMS Layout Columns: Left (Notes & Links) & Right (Announcements & Teacher Profile) -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Left: Course Materials (Soft Copies) & External Links -->
        <div class="lg:col-span-2 space-y-8">
          
          <!-- SECTION 1: SOFT COPIES OF NOTES -->
          <div class="nexus-card p-6 sm:p-7">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div>
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-900 flex items-center justify-center font-bold">
                    <i data-lucide="file-text" class="w-5 h-5"></i>
                  </div>
                  <h3 class="text-xl font-bold text-slate-800">Soft Copies of Notes & Handouts</h3>
                </div>
                <p class="text-xs text-slate-500 mt-1">Official lecture notes, formula sheets, solved question sets, and chapter materials.</p>
              </div>

              ${isTeacher ? `
                <button onclick="ELMS.openUploadMaterialModal()" class="inline-flex items-center gap-2 px-4 py-2 bg-indigo-900 hover:bg-indigo-800 text-white text-xs font-semibold rounded-xl transition shadow-sm">
                  <i data-lucide="plus-circle" class="w-4 h-4"></i>
                  Add Soft Copy Note
                </button>
              ` : ''}
            </div>

            <!-- Notes List -->
            <div class="mt-6 space-y-6">
              ${this.materials.length === 0 ? `
                <div class="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <i data-lucide="inbox" class="w-10 h-10 text-slate-400 mx-auto mb-2"></i>
                  <p class="text-sm font-medium text-slate-600">No lecture notes uploaded yet for this class.</p>
                  <p class="text-xs text-slate-400 mt-1">Your teacher will upload soft copies of notes and handouts here.</p>
                </div>
              ` : Object.keys(groupedMaterials).map(topic => `
                <div>
                  <div class="flex items-center gap-2 mb-3">
                    <span class="w-2 h-2 rounded-full bg-indigo-600"></span>
                    <h4 class="text-xs font-bold uppercase tracking-wider text-indigo-950">${topic}</h4>
                  </div>
                  <div class="space-y-3">
                    ${groupedMaterials[topic].map(m => `
                      <div class="p-4 rounded-xl border border-slate-200 hover:border-indigo-300 bg-white transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
                        <div class="flex items-start gap-3.5">
                          <div class="w-10 h-10 rounded-xl ${m.fileType === 'pdf' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'} flex items-center justify-center flex-shrink-0 font-bold text-xs uppercase shadow-xs">
                            ${m.fileType === 'pdf' ? '<i data-lucide="file" class="w-5 h-5"></i>' : '<i data-lucide="file-code" class="w-5 h-5"></i>'}
                          </div>
                          <div>
                            <div class="flex items-center gap-2">
                              <h5 class="text-sm font-semibold text-slate-800 group-hover:text-indigo-900 transition">${m.title}</h5>
                              <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 uppercase tracking-wider">${m.fileType}</span>
                              <span class="text-[11px] text-slate-400">• ${m.fileSize}</span>
                            </div>
                            <p class="text-xs text-slate-500 mt-1 line-clamp-2">${m.description || 'Lecture note prepared by course faculty.'}</p>
                            <span class="text-[11px] text-slate-400 mt-1 block">Uploaded: ${new Date(m.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <!-- Action Buttons: Download & Teacher Delete -->
                        <div class="flex items-center gap-2 sm:self-center self-end">
                          <a href="${m.fileUrl}" download="${m.fileName}" target="_blank" class="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-900 text-xs font-semibold rounded-lg transition border border-slate-200">
                            <i data-lucide="download" class="w-3.5 h-3.5"></i>
                            Download
                          </a>
                          <button onclick="ELMS.previewFile('${m.fileUrl}', '${m.title}')" class="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition border border-slate-200">
                            <i data-lucide="eye" class="w-3.5 h-3.5"></i>
                            View
                          </button>
                          ${isTeacher ? `
                            <button onclick="ELMS.deleteMaterial('${m.id}')" title="Delete Note" class="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition">
                              <i data-lucide="trash-2" class="w-4 h-4"></i>
                            </button>
                          ` : ''}
                        </div>
                      </div>
                    `).join('')}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- SECTION 2: EXTERNAL LINKS & WEB RESOURCES -->
          <div class="nexus-card p-6 sm:p-7">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div>
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center font-bold">
                    <i data-lucide="external-link" class="w-5 h-5"></i>
                  </div>
                  <h3 class="text-xl font-bold text-slate-800">External Links & Interactive Media</h3>
                </div>
                <p class="text-xs text-slate-500 mt-1">Direct links to Google Drive archives, YouTube lectures, simulations, and portals.</p>
              </div>

              ${isTeacher ? `
                <button onclick="ELMS.openAddLinkModal()" class="inline-flex items-center gap-2 px-4 py-2 bg-sky-700 hover:bg-sky-800 text-white text-xs font-semibold rounded-xl transition shadow-sm">
                  <i data-lucide="plus-circle" class="w-4 h-4"></i>
                  Add External Link
                </button>
              ` : ''}
            </div>

            <!-- Links List -->
            <div class="mt-6 space-y-4">
              ${this.links.length === 0 ? `
                <div class="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <i data-lucide="link-2-off" class="w-10 h-10 text-slate-400 mx-auto mb-2"></i>
                  <p class="text-sm font-medium text-slate-600">No external links attached to this course yet.</p>
                  <p class="text-xs text-slate-400 mt-1">Teachers can add YouTube videos, Google Drive links, and web materials.</p>
                </div>
              ` : Object.keys(groupedLinks).map(topic => `
                <div>
                  <div class="flex items-center gap-2 mb-3">
                    <span class="w-2 h-2 rounded-full bg-sky-600"></span>
                    <h4 class="text-xs font-bold uppercase tracking-wider text-slate-700">${topic}</h4>
                  </div>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    ${groupedLinks[topic].map(l => {
                      let iconName = 'globe';
                      let catColor = 'bg-sky-50 text-sky-600 border-sky-100';
                      let catLabel = 'Web Resource';
                      if (l.category === 'youtube') {
                        iconName = 'play-circle';
                        catColor = 'bg-rose-50 text-rose-600 border-rose-100';
                        catLabel = 'YouTube Lecture';
                      } else if (l.category === 'google_drive') {
                        iconName = 'hard-drive';
                        catColor = 'bg-amber-50 text-amber-700 border-amber-100';
                        catLabel = 'Google Drive';
                      } else if (l.category === 'simulation') {
                        iconName = 'cpu';
                        catColor = 'bg-emerald-50 text-emerald-700 border-emerald-100';
                        catLabel = 'Interactive Tool';
                      }

                      return `
                        <div class="p-4 rounded-xl border border-slate-200 hover:border-sky-300 bg-white transition flex flex-col justify-between group">
                          <div>
                            <div class="flex items-center justify-between mb-2">
                              <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${catColor} border">
                                <i data-lucide="${iconName}" class="w-3 h-3"></i>
                                ${catLabel}
                              </span>
                              ${isTeacher ? `
                                <button onclick="ELMS.deleteLink('${l.id}')" title="Remove Link" class="text-slate-300 hover:text-rose-600 transition">
                                  <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                                </button>
                              ` : ''}
                            </div>
                            <h5 class="text-sm font-semibold text-slate-800 group-hover:text-sky-700 transition">${l.title}</h5>
                            <p class="text-xs text-slate-500 mt-1 line-clamp-2">${l.description || 'External learning resource for students.'}</p>
                          </div>

                          <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                            <span class="text-[11px] text-slate-400 truncate max-w-[170px]">${l.url.replace(/^https?:\/\//i, '')}</span>
                            <a href="${l.url}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 text-xs font-bold text-sky-700 hover:text-sky-900 group-hover:translate-x-0.5 transition">
                              Open Resource
                              <i data-lucide="arrow-up-right" class="w-3.5 h-3.5"></i>
                            </a>
                          </div>
                        </div>
                      `;
                    }).join('')}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Right: Faculty Profile & Announcements -->
        <div class="space-y-6">
          <!-- Faculty Information Card -->
          <div class="nexus-card p-6">
            <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Course Faculty</h4>
            <div class="flex items-center gap-4">
              <div class="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-3xl shadow-xs">
                👨‍🏫
              </div>
              <div>
                <h5 class="text-base font-bold text-slate-800">${currentClass.teacherName}</h5>
                <span class="text-xs text-indigo-900 font-semibold block">Nexus Academy Lead Faculty</span>
                <span class="text-xs text-slate-500">${currentClass.schedule}</span>
              </div>
            </div>

            <div class="mt-5 pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
              <div class="flex items-center gap-2">
                <i data-lucide="map-pin" class="w-4 h-4 text-slate-400"></i>
                <span>${currentClass.room}</span>
              </div>
              <div class="flex items-center gap-2">
                <i data-lucide="award" class="w-4 h-4 text-slate-400"></i>
                <span>Section: ${currentClass.section}</span>
              </div>
            </div>

            <div class="mt-5">
              ${user.role === 'student' ? `
                <button onclick="Messaging.openChat('${currentClass.teacherId}', '${currentClass.id}')" class="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-900 hover:bg-indigo-800 text-white rounded-xl text-xs font-semibold transition shadow-sm">
                  <i data-lucide="message-square" class="w-4 h-4"></i>
                  Ask Teacher a Question
                </button>
              ` : `
                <button onclick="UCAM.openEnrollmentModal('${currentClass.id}')" class="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-900 hover:bg-indigo-800 text-white rounded-xl text-xs font-semibold transition shadow-sm">
                  <i data-lucide="user-plus" class="w-4 h-4"></i>
                  Manage Class Enrollments
                </button>
              `}
            </div>
          </div>

          <!-- Section Classmates & Roster ("student rao dekhte parbe k k ache") -->
          <div class="nexus-card p-6">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-2">
                <i data-lucide="users" class="w-4 h-4 text-indigo-600"></i>
                <h4 class="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Section Classmates (${(this.enrolledStudents || []).length})
                </h4>
              </div>
              <div class="flex items-center gap-1.5">
                <button onclick="Messaging.openGroupChat('${currentClass.id}')" 
                  class="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 rounded-lg text-[10px] font-bold transition flex items-center gap-1 border border-indigo-200">
                  <i data-lucide="messages-square" class="w-3 h-3 text-indigo-600"></i>
                  <span>Group Chat</span>
                </button>
                <span class="text-[10px] font-bold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                  ${currentClass.section || 'Regular'}
                </span>
              </div>
            </div>

            <div class="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
              ${(!this.enrolledStudents || this.enrolledStudents.length === 0) ? `
                <p class="text-xs text-slate-400 py-4 text-center">No classmates enrolled yet in this section.</p>
              ` : this.enrolledStudents.map(c => {
                const isMe = c.studentId === user.id;
                return `
                  <div class="p-2.5 rounded-xl border ${isMe ? 'border-indigo-300 bg-indigo-50/50' : 'border-slate-100 bg-white hover:border-slate-200'} transition flex items-center justify-between gap-2.5">
                    <div class="flex items-center gap-2.5 min-w-0">
                      <span class="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-sm flex-shrink-0">
                        ${c.studentAvatar || '👨‍🎓'}
                      </span>
                      <div class="min-w-0">
                        <div class="flex items-center gap-1.5">
                          <span class="text-xs font-bold text-slate-800 truncate block">${c.studentName}</span>
                          ${isMe ? `<span class="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-indigo-600 text-white">You</span>` : ''}
                        </div>
                        <span class="text-[10px] text-slate-400 font-mono block">${c.studentId} • ${c.studentBatch || 'Student'}</span>
                      </div>
                    </div>

                    ${!isMe ? `
                      <button onclick="Messaging.openChat('${c.studentId}', '${currentClass.id}')" title="Message ${c.studentName}"
                        class="p-1.5 rounded-lg bg-slate-50 hover:bg-indigo-50 hover:text-indigo-900 text-slate-500 border border-slate-200 transition flex-shrink-0">
                        <i data-lucide="message-square" class="w-3.5 h-3.5"></i>
                      </button>
                    ` : ''}
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Class Announcements & Notices -->
          <div class="nexus-card p-6">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-2">
                <i data-lucide="bell" class="w-4 h-4 text-amber-600"></i>
                <h4 class="text-xs font-bold uppercase tracking-wider text-slate-700">Class Notices</h4>
              </div>
              ${isTeacher ? `
                <button onclick="ELMS.openAddNoticeModal()" class="text-xs font-bold text-indigo-900 hover:underline">
                  + Post
                </button>
              ` : ''}
            </div>

            <div class="space-y-3">
              ${this.announcements.length === 0 ? `
                <p class="text-xs text-slate-400 py-4 text-center">No active notices for this class.</p>
              ` : this.announcements.map(a => `
                <div onclick="ELMS.markNoticeRead('${a.id}')" 
                  class="p-3.5 rounded-xl cursor-pointer transition ${!a.isRead ? 'ring-1 ring-emerald-500/50 bg-emerald-50/30 dark:bg-emerald-950/20' : ''} ${a.priority === 'important' ? 'bg-amber-50/60 border border-amber-200' : 'bg-slate-50 border border-slate-100 dark:border-slate-800 dark:bg-slate-900'}">
                  <div class="flex items-center justify-between mb-1">
                    <div class="flex items-center gap-1.5">
                      <span class="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${a.priority === 'important' ? 'bg-amber-200 text-amber-900' : 'bg-slate-200 text-slate-700'}">
                        ${a.priority}
                      </span>
                      ${!a.isRead ? '<span class="px-1.5 py-0.2 rounded text-[9px] font-black bg-emerald-500 text-white animate-pulse">NEW</span>' : ''}
                    </div>
                    <div class="flex items-center gap-1.5">
                      <span class="text-[10px] text-slate-400">${new Date(a.createdAt).toLocaleDateString()}</span>
                      ${(user.role === 'admin' || user.id === a.postedBy) ? `
                        <button onclick="event.stopPropagation(); ELMS.openEditNoticeModal('${a.id}')" title="Edit notice (নোটিশ পরিবর্তন)" class="p-1 text-slate-400 hover:text-indigo-900 dark:hover:text-indigo-300">
                          <i data-lucide="edit-3" class="w-3 h-3"></i>
                        </button>
                        <button onclick="event.stopPropagation(); ELMS.deleteNotice('${a.id}', '${(a.title || '').replace(/'/g, "\\'")}')" title="Delete notice (নোটিশ মুছে ফেলুন)" class="p-1 text-slate-400 hover:text-rose-600">
                          <i data-lucide="trash-2" class="w-3 h-3"></i>
                        </button>
                      ` : ''}
                    </div>
                  </div>
                  <h6 class="text-xs font-bold text-slate-800 dark:text-slate-100">${a.title}</h6>
                  <p class="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">${a.content}</p>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  // Modal: Upload Material (Teacher only)
  openUploadMaterialModal() {
    const user = API.getCurrentUser();
    if (user.role !== 'teacher' && user.role !== 'admin') {
      showToast('Only teachers have authority to upload lecture notes.', 'error');
      return;
    }

    const currentClass = this.classes.find(c => c.id === this.currentClassId);
    App.showModal(`
      <div class="p-6">
        <div class="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div>
            <h3 class="text-lg font-bold text-slate-900">Upload Soft Copy Note</h3>
            <p class="text-xs text-slate-500">${currentClass ? currentClass.code + ' - ' + currentClass.title : ''}</p>
          </div>
          <button onclick="App.closeModal()" class="text-slate-400 hover:text-slate-600">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <form id="upload-material-form" onsubmit="ELMS.submitUploadMaterial(event)" class="space-y-4">
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Topic / Chapter Section</label>
            <input type="text" name="topic" placeholder="e.g. Week 3: Vector Dynamics & Friction" required
              class="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:outline-none">
          </div>

          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Note Title</label>
            <input type="text" name="title" placeholder="e.g. Chapter 3 Comprehensive Handout & Formulas" required
              class="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:outline-none">
          </div>

          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Description / Faculty Remarks</label>
            <textarea name="description" rows="2" placeholder="Brief guidance for enrolled students..."
              class="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:outline-none"></textarea>
          </div>

          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Select Document File (PDF, PPT, DOC, Image)</label>
            <input type="file" name="file" required
              class="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-900 hover:file:bg-indigo-100 cursor-pointer border border-slate-200 rounded-xl p-2">
          </div>

          <div class="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button type="button" onclick="App.closeModal()" class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition">Cancel</button>
            <button type="submit" id="btn-upload-submit" class="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-900 hover:bg-indigo-800 text-white transition shadow-sm">
              Upload Handout
            </button>
          </div>
        </form>
      </div>
    `);
    if (window.lucide) window.lucide.createIcons();
  },

  async submitUploadMaterial(event) {
    event.preventDefault();
    const form = event.target;
    const btn = document.getElementById('btn-upload-submit');
    btn.disabled = true;
    btn.innerHTML = 'Uploading...';

    const formData = new FormData(form);

    try {
      await API.uploadMaterial(this.currentClassId, formData);
      showToast('Soft copy note uploaded successfully!', 'success');
      App.closeModal();
      await this.loadClassData(this.currentClassId);
    } catch (err) {
      showToast(err.message, 'error');
      btn.disabled = false;
      btn.innerHTML = 'Upload Handout';
    }
  },

  // Modal: Add External Link (Teacher only)
  openAddLinkModal() {
    const currentClass = this.classes.find(c => c.id === this.currentClassId);
    App.showModal(`
      <div class="p-6">
        <div class="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div>
            <h3 class="text-lg font-bold text-slate-900">Add External Resource Link</h3>
            <p class="text-xs text-slate-500">${currentClass ? currentClass.code + ' - ' + currentClass.title : ''}</p>
          </div>
          <button onclick="App.closeModal()" class="text-slate-400 hover:text-slate-600">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <form id="add-link-form" onsubmit="ELMS.submitAddLink(event)" class="space-y-4">
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Link Title</label>
            <input type="text" name="title" placeholder="e.g. Google Drive Solved Paper Archive" required
              class="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-600 focus:outline-none">
          </div>

          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Destination URL</label>
            <input type="url" name="url" placeholder="https://drive.google.com/... or https://youtube.com/..." required
              class="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-600 focus:outline-none">
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Topic</label>
              <input type="text" name="topic" placeholder="e.g. Practice Tests"
                class="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-600 focus:outline-none">
            </div>
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Category</label>
              <select name="category" class="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-600 focus:outline-none">
                <option value="google_drive">Google Drive Folder</option>
                <option value="youtube">YouTube Lecture</option>
                <option value="simulation">Interactive Tool / Lab</option>
                <option value="website">Reference Website</option>
                <option value="zoom">Live Class (Zoom / Meet)</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Description (Optional)</label>
            <textarea name="description" rows="2" placeholder="Instructions for students accessing this link..."
              class="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-600 focus:outline-none"></textarea>
          </div>

          <div class="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button type="button" onclick="App.closeModal()" class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition">Cancel</button>
            <button type="submit" class="px-5 py-2 rounded-xl text-xs font-semibold bg-sky-700 hover:bg-sky-800 text-white transition shadow-sm">
              Save Link
            </button>
          </div>
        </form>
      </div>
    `);
    if (window.lucide) window.lucide.createIcons();
  },

  async submitAddLink(event) {
    event.preventDefault();
    const form = event.target;
    const title = form.title.value;
    const url = form.url.value;
    const topic = form.topic.value;
    const category = form.category.value;
    const description = form.description.value;

    try {
      await API.addLink(this.currentClassId, { title, url, topic, category, description });
      showToast('External resource link saved!', 'success');
      App.closeModal();
      await this.loadClassData(this.currentClassId);
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  // Modal: Add Notice
  openAddNoticeModal() {
    App.showModal(`
      <div class="p-6">
        <div class="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <h3 class="text-lg font-bold text-slate-900">Post Class Notice</h3>
          <button onclick="App.closeModal()" class="text-slate-400 hover:text-slate-600">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <form id="add-notice-form" onsubmit="ELMS.submitAddNotice(event)" class="space-y-4">
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Notice Title</label>
            <input type="text" name="title" placeholder="e.g. Schedule for Next Class Test" required
              class="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:outline-none">
          </div>

          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Priority</label>
            <select name="priority" class="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:outline-none">
              <option value="normal">Normal Announcement</option>
              <option value="important">Important (Highlighted)</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Notice Content</label>
            <textarea name="content" rows="4" placeholder="Detailed announcement text..." required
              class="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:outline-none"></textarea>
          </div>

          <div class="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button type="button" onclick="App.closeModal()" class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition">Cancel</button>
            <button type="submit" class="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-900 hover:bg-indigo-800 text-white transition shadow-sm">
              Publish Notice
            </button>
          </div>
        </form>
      </div>
    `);
    if (window.lucide) window.lucide.createIcons();
  },

  async submitAddNotice(event) {
    event.preventDefault();
    const form = event.target;
    try {
      await API.createAnnouncement({
        classId: this.currentClassId,
        title: form.title.value,
        priority: form.priority.value,
        content: form.content.value
      });
      showToast('Class announcement published!', 'success');
      App.closeModal();
      await this.loadClassData(this.currentClassId);
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  openEditNoticeModal(id) {
    const notice = (this.announcements || []).find(a => a.id === id);
    if (!notice) return;

    App.showModal(`
      <div class="p-6">
        <div class="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
          <h3 class="text-lg font-bold text-slate-900 dark:text-white">Edit Class Notice</h3>
          <button onclick="App.closeModal()" class="text-slate-400 hover:text-slate-600">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <form onsubmit="ELMS.submitEditNotice(event, '${notice.id}')" class="space-y-4">
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">Notice Title</label>
            <input type="text" name="title" value="${(notice.title || '').replace(/"/g, '&quot;')}" required
              class="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-indigo-600 focus:outline-none bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">
          </div>

          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">Priority</label>
            <select name="priority" class="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-indigo-600 focus:outline-none bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">
              <option value="normal" ${notice.priority === 'normal' ? 'selected' : ''}>Normal Announcement</option>
              <option value="important" ${notice.priority === 'important' ? 'selected' : ''}>Important (Highlighted)</option>
              <option value="urgent" ${notice.priority === 'urgent' ? 'selected' : ''}>Urgent</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">Notice Content</label>
            <textarea name="content" rows="4" required
              class="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-indigo-600 focus:outline-none bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">${(notice.content || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</textarea>
          </div>

          <div class="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <button type="button" onclick="App.closeModal()" class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition">Cancel</button>
            <button type="submit" class="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-900 hover:bg-indigo-800 text-white transition shadow-sm">
              Save Changes
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
    try {
      await API.updateAnnouncement(id, {
        title: form.title.value.trim(),
        priority: form.priority.value,
        content: form.content.value.trim()
      });
      showToast('Class notice updated successfully!', 'success');
      App.closeModal();
      await this.loadClassData(this.currentClassId);
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  async markNoticeRead(id) {
    const ann = (this.announcements || []).find(a => a.id === id);
    if (ann && !ann.isRead) {
      ann.isRead = true;
      try {
        await API.markNoticeAsRead(id);
        if (typeof App !== 'undefined' && App.checkUnreadNotices) {
          App.checkUnreadNotices();
        }
        await this.loadClassData(this.currentClassId);
      } catch (e) {
        // silent
      }
    }
  },

  async deleteNotice(id, title) {
    if (!confirm(`Are you sure you want to delete this notice: "${title || 'Notice'}"?`)) return;
    try {
      await API.deleteAnnouncement(id);
      showToast('Class notice removed', 'success');
      await this.loadClassData(this.currentClassId);
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  async deleteMaterial(id) {
    if (!confirm('Are you sure you want to delete this lecture note?')) return;
    try {
      await API.deleteMaterial(id);
      showToast('Lecture note removed', 'success');
      await this.loadClassData(this.currentClassId);
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  async deleteLink(id) {
    if (!confirm('Are you sure you want to remove this external link?')) return;
    try {
      await API.deleteLink(id);
      showToast('External link removed', 'success');
      await this.loadClassData(this.currentClassId);
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  previewFile(url, title) {
    App.showModal(`
      <div class="p-6">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div class="flex items-center gap-2">
            <i data-lucide="file-text" class="w-5 h-5 text-indigo-900"></i>
            <h3 class="text-base font-bold text-slate-900">${title}</h3>
          </div>
          <button onclick="App.closeModal()" class="text-slate-400 hover:text-slate-600">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>
        <div class="w-full h-[65vh] bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
          <iframe src="${url}" class="w-full h-full border-0"></iframe>
        </div>
        <div class="mt-4 flex items-center justify-between">
          <span class="text-xs text-slate-400">Official Nexus Academy Study Material</span>
          <a href="${url}" download target="_blank" class="px-4 py-2 bg-indigo-900 text-white text-xs font-semibold rounded-xl hover:bg-indigo-800 transition">
            Download Copy
          </a>
        </div>
      </div>
    `);
    if (window.lucide) window.lucide.createIcons();
  }
};
