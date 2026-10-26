// NexusAcademyLS - UCAM (Academic Management & Merit Ranking) Portal Logic
const UCAM = {
  classes: [],
  activeTab: 'results', // 'results' | 'routine' | 'gradebook' | 'enrollment'
  selectedClassId: null,

  formatOrdinal(n) {
    if (!n && n !== 0) return 'N/A';
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  },

  getRankBadge(rank) {
    if (rank === 1) {
      return { icon: '🥇', label: '1st Merit Rank', bg: 'bg-amber-100 text-amber-900 border-amber-300' };
    }
    if (rank === 2) {
      return { icon: '🥈', label: '2nd Merit Rank', bg: 'bg-slate-200 text-slate-800 border-slate-300' };
    }
    if (rank === 3) {
      return { icon: '🥉', label: '3rd Merit Rank', bg: 'bg-orange-100 text-orange-900 border-orange-300' };
    }
    return { icon: '🎖️', label: `${this.formatOrdinal(rank)} Rank`, bg: 'bg-indigo-50 text-indigo-900 border-indigo-200' };
  },

  async init(subTab = 'results') {
    this.activeTab = subTab;
    try {
      this.classes = await API.getClasses();
      if (this.classes.length > 0) {
        if (!this.selectedClassId || !this.classes.some(c => c.id === this.selectedClassId)) {
          this.selectedClassId = this.classes[0].id;
        }
      }
      this.render();
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  async setTab(tab) {
    this.activeTab = tab;
    this.render();
  },

  async render() {
    const container = document.getElementById('ucam-content-area');
    if (!container) return;
    const user = API.getCurrentUser();
    const isTeacher = user.role === 'teacher' || user.role === 'admin';

    container.innerHTML = `
      <!-- UCAM Header Banner -->
      <div class="ucam-header-banner text-white rounded-2xl p-6 sm:p-8 mb-8 shadow-lg relative overflow-hidden">
        <div class="relative z-10">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur text-xs font-semibold uppercase tracking-wider mb-2">
                <span class="w-2 h-2 rounded-full bg-cyan-400"></span>
                Academic Management & Merit Ranking
              </div>
              <h2 class="text-2xl sm:text-3xl font-bold text-white">Continuous Assessment & Class Ranking</h2>
              <p class="text-indigo-100 text-xs sm:text-sm mt-1 max-w-xl">
                Continuous assessment marks, Class & Section merit positions, marks comparison, and routine.
              </p>
            </div>

            <!-- Student / Teacher Status Pill -->
            <div class="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-3.5 flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-white text-indigo-950 flex items-center justify-center font-bold text-lg shadow">
                ${user.avatar || '👨‍🎓'}
              </div>
              <div>
                <h4 class="text-xs font-bold text-white">${user.name}</h4>
                <p class="text-[11px] text-indigo-200">${user.id} • ${user.role === 'teacher' ? (user.subject ? `${user.subject} Faculty Lead` : (user.designation || 'Faculty')) : (user.batch || 'Enrolled')}</p>
              </div>
            </div>
          </div>

          <!-- UCAM Sub Navigation Bar -->
          <div class="flex items-center gap-2 mt-6 pt-5 border-t border-white/15 overflow-x-auto text-xs sm:text-sm">
            ${isTeacher ? `
              <button onclick="UCAM.setTab('students')" 
                class="px-4 py-2 rounded-xl font-bold transition flex items-center gap-2 whitespace-nowrap ${this.activeTab === 'students' ? 'bg-white text-indigo-950 shadow-sm' : 'text-white/80 hover:bg-white/10'}">
                <i data-lucide="users" class="w-4 h-4"></i>
                Student List (কে কে শিক্ষার্থী আছে)
              </button>

              <button onclick="UCAM.setTab('enrollment')" 
                class="px-4 py-2 rounded-xl font-bold transition flex items-center gap-2 whitespace-nowrap ${this.activeTab === 'enrollment' ? 'bg-white text-indigo-950 shadow-sm' : 'text-white/80 hover:bg-white/10'}">
                <i data-lucide="user-check" class="w-4 h-4"></i>
                Class Enrollment Roster
              </button>

              <button onclick="UCAM.setTab('gradebook')" 
                class="px-4 py-2 rounded-xl font-bold transition flex items-center gap-2 whitespace-nowrap ${this.activeTab === 'gradebook' ? 'bg-white text-indigo-950 shadow-sm' : 'text-white/80 hover:bg-white/10'}">
                <i data-lucide="edit-3" class="w-4 h-4"></i>
                Teacher Gradebook & Marks Entry
              </button>
            ` : `
              <button onclick="UCAM.setTab('classmates')" 
                class="px-4 py-2 rounded-xl font-bold transition flex items-center gap-2 whitespace-nowrap ${this.activeTab === 'classmates' ? 'bg-white text-indigo-950 shadow-sm' : 'text-white/80 hover:bg-white/10'}">
                <i data-lucide="users" class="w-4 h-4"></i>
                My Classmates (আমার সহপাঠীগণ)
              </button>
            `}

            <button onclick="UCAM.setTab('results')" 
              class="px-4 py-2 rounded-xl font-bold transition flex items-center gap-2 whitespace-nowrap ${this.activeTab === 'results' ? 'bg-white text-indigo-950 shadow-sm' : 'text-white/80 hover:bg-white/10'}">
              <i data-lucide="award" class="w-4 h-4"></i>
              ${user.role === 'student' ? 'My Exam Results & Rank' : 'Student Merit & Rank Reports'}
            </button>

            <button onclick="UCAM.setTab('routine')" 
              class="px-4 py-2 rounded-xl font-bold transition flex items-center gap-2 whitespace-nowrap ${this.activeTab === 'routine' ? 'bg-white text-indigo-950 shadow-sm' : 'text-white/80 hover:bg-white/10'}">
              <i data-lucide="calendar" class="w-4 h-4"></i>
              Class Routine & Schedule
            </button>
          </div>
        </div>
      </div>

      <!-- Tab Content Area -->
      <div id="ucam-tab-content">
        <!-- Rendered dynamically below -->
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    if (this.activeTab === 'students') this.renderStudentList();
    else if (this.activeTab === 'enrollment') this.renderEnrollmentManager();
    else if (this.activeTab === 'gradebook') this.renderGradebook();
    else if (this.activeTab === 'classmates') this.renderStudentClassmates();
    else if (this.activeTab === 'results') this.renderResults();
    else if (this.activeTab === 'routine') this.renderRoutine();
  },

  // 1. RESULTS & MERIT RANK VIEW (Student UCAM view)
  async renderResults() {
    const subContainer = document.getElementById('ucam-tab-content');
    if (!subContainer) return;

    try {
      subContainer.innerHTML = `
        <div class="py-12 text-center">
          <div class="inline-block animate-spin w-8 h-8 border-4 border-indigo-900 border-t-transparent rounded-full mb-3"></div>
          <p class="text-xs text-slate-500 font-semibold">Calculating Class & Section Merit Rankings...</p>
        </div>
      `;

      const data = await API.getGradeSheet();
      const { student, bestRank, overallAvgScore, courses } = data;

      if (!courses || courses.length === 0) {
        subContainer.innerHTML = `
          <div class="bg-white rounded-2xl p-12 text-center border border-slate-200 max-w-xl mx-auto">
            <i data-lucide="file-question" class="w-12 h-12 text-slate-400 mx-auto mb-3"></i>
            <h4 class="text-lg font-bold text-slate-800">No Assessment Records Found</h4>
            <p class="text-xs text-slate-500 mt-1">You are not enrolled in any classes or exams have not been published yet.</p>
          </div>
        `;
        if (window.lucide) window.lucide.createIcons();
        return;
      }

      const bestBadge = bestRank ? this.getRankBadge(bestRank) : null;

      subContainer.innerHTML = `
        <!-- Class & Section Rank Summary Cards (NO GPA/CGPA) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          
          <!-- Card 1: Top Merit Rank -->
          <div class="nexus-card p-5 border-l-4 border-l-amber-500">
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Best Merit Position</span>
            ${bestRank ? `
              <div class="flex items-center gap-2 mt-2">
                <span class="text-2xl">${bestBadge.icon}</span>
                <span class="text-2xl sm:text-3xl font-black text-indigo-950">${this.formatOrdinal(bestRank)}</span>
                <span class="text-xs font-semibold text-slate-500">Rank</span>
              </div>
              <span class="inline-block mt-2 px-2.5 py-0.5 rounded text-[11px] font-bold ${bestBadge.bg} border">
                ${bestRank === 1 ? 'Class Top Scorer' : bestRank <= 3 ? 'Top 3 Merit Standing' : 'Active Batch Rank'}
              </span>
            ` : `
              <div class="flex items-center gap-2 mt-2">
                <span class="text-2xl">🔒</span>
                <span class="text-base font-bold text-slate-600">Ranking Disabled</span>
              </div>
              <span class="inline-block mt-2 px-2.5 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                Continuous Evaluation
              </span>
            `}
          </div>

          <!-- Card 2: Overall Score & Class Comparison -->
          <div class="nexus-card p-5 border-l-4 border-l-indigo-600">
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Overall Assessment Score</span>
            <div class="flex items-baseline gap-1 mt-2">
              <span class="text-3xl font-extrabold text-slate-800">${overallAvgScore}%</span>
            </div>
            <span class="text-xs text-slate-500 mt-2 block font-medium">Weighted continuous average across classes</span>
          </div>

          <!-- Card 3: Batch / Section -->
          <div class="nexus-card p-5 border-l-4 border-l-sky-600">
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Coaching Batch & ID</span>
            <div class="text-lg font-bold text-slate-800 mt-2 truncate">${student.batch || 'HSC 2025 Science'}</div>
            <span class="text-xs text-slate-500 mt-1 block">Student ID: <strong>${student.id}</strong></span>
          </div>

          <!-- Card 4: Official Marks Sheet Print -->
          <div class="nexus-card p-5 border-l-4 border-l-emerald-600 flex flex-col justify-between">
            <div>
              <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Official Mark Sheet</span>
              <p class="text-xs text-slate-500 mt-1">Printable report with Class & Section Ranks.</p>
            </div>
            <button onclick="UCAM.printTranscript()" class="w-full mt-3 flex items-center justify-center gap-2 px-3 py-2 bg-indigo-900 hover:bg-indigo-800 text-white rounded-xl text-xs font-bold transition shadow-xs">
              <i data-lucide="printer" class="w-3.5 h-3.5"></i>
              Print Mark Sheet
            </button>
          </div>
        </div>

        <!-- Detailed Marks & Ranks per Enrolled Class -->
        <div class="space-y-6">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 class="text-lg font-bold text-slate-800">Class & Section Merit Positions</h3>
            <span class="text-xs font-semibold text-slate-500">Ranking is computed across all enrolled students in each subject batch</span>
          </div>

          ${courses.map(course => {
            const classRankBadge = this.getRankBadge(course.classRank);
            const sectionRankBadge = this.getRankBadge(course.sectionRank);

            return `
              <div class="nexus-card overflow-hidden">
                <!-- Course Card Header with Prominent Class & Section Rank Badges -->
                <div class="p-5 bg-slate-50 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="px-2.5 py-1 rounded bg-indigo-900 text-white text-xs font-bold tracking-wider">${course.classCode}</span>
                      <h4 class="text-base font-bold text-slate-800">${course.classTitle}</h4>
                    </div>
                    <p class="text-xs text-slate-500 mt-1">
                      Faculty: <strong class="text-slate-700">${course.teacherName}</strong> • Section: <strong class="text-slate-700">${course.section}</strong>
                    </p>
                  </div>

                  <!-- Section & Course Rank Display Pill Blocks (Subject to Teacher showRank setting) -->
                  <div class="flex flex-wrap items-center gap-3">
                    
                    ${course.showRank ? `
                      <!-- Section Rank Pill -->
                      <div class="p-2.5 rounded-xl border bg-indigo-50/90 border-indigo-200 flex items-center gap-2.5 shadow-xs">
                        <div class="w-8 h-8 rounded-lg bg-indigo-900 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                          SEC
                        </div>
                        <div>
                          <div class="flex items-center gap-1">
                            <span class="text-[10px] font-bold uppercase tracking-wider text-indigo-900 block">Section Rank</span>
                            <span class="text-[9px] font-semibold text-indigo-600 bg-indigo-100/80 px-1 rounded">Sec: ${course.section}</span>
                          </div>
                          <div class="text-sm font-black text-indigo-950 leading-tight">
                            ${this.formatOrdinal(course.sectionRank)} <span class="text-xs font-semibold text-slate-500">/ ${course.totalSectionStudents}</span>
                          </div>
                        </div>
                      </div>

                      <!-- Course-Wise Rank Pill -->
                      <div class="p-2.5 rounded-xl border ${classRankBadge.bg} flex items-center gap-2.5 shadow-xs">
                        <span class="text-2xl">${classRankBadge.icon}</span>
                        <div>
                          <div class="flex items-center gap-1">
                            <span class="text-[10px] font-bold uppercase tracking-wider block opacity-80">Course Rank</span>
                            <span class="text-[9px] font-semibold bg-white/60 px-1 rounded">${course.classCode}</span>
                          </div>
                          <div class="text-sm font-black leading-tight">
                            ${this.formatOrdinal(course.courseRank || course.classRank)} <span class="text-xs font-bold opacity-75">/ ${course.totalCourseStudents || course.totalClassStudents}</span>
                          </div>
                        </div>
                      </div>
                    ` : `
                      <!-- Rank Disabled Indicator -->
                      <div class="p-2.5 rounded-xl border bg-slate-100/80 border-slate-200 flex items-center gap-2 text-slate-600 text-xs shadow-xs">
                        <i data-lucide="eye-off" class="w-4 h-4 text-slate-400"></i>
                        <span>Merit Ranking: <strong class="text-slate-700">Disabled by Teacher</strong></span>
                      </div>
                    `}

                    <!-- Individual Score Summary -->
                    <div class="p-2.5 rounded-xl border bg-white border-slate-200 text-right shadow-xs">
                      <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Your Weighted Score</span>
                      <div class="text-sm font-bold text-slate-800">
                        <span class="text-indigo-900 font-black">${course.totalWeightedMarks}</span>
                        <span class="text-xs text-slate-500 font-normal"> / ${course.totalPossibleWeight}% (${course.overallPercentage}%)</span>
                      </div>
                    </div>

                  </div>
                </div>

                <!-- Individual Marks Table -->
                <div class="overflow-x-auto">
                  <table class="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr class="bg-slate-100/75 text-slate-600 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                        <th class="py-3 px-5">Assessment Component</th>
                        <th class="py-3 px-4">Exam Type</th>
                        <th class="py-3 px-4">Exam Date</th>
                        <th class="py-3 px-4 text-center">Marks Obtained</th>
                        <th class="py-3 px-4 text-center">Max Marks</th>
                        <th class="py-3 px-4 text-center">Weight (%)</th>
                        <th class="py-3 px-4 text-center">Weighted Score</th>
                        <th class="py-3 px-5">Teacher Remarks / Feedback</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                      ${course.marksBreakdown.length === 0 ? `
                        <tr>
                          <td colspan="8" class="text-center py-6 text-slate-400">No exams or quizzes published for this course yet.</td>
                        </tr>
                      ` : course.marksBreakdown.map(exam => `
                        <tr class="hover:bg-slate-50/75 transition">
                          <td class="py-3.5 px-5 font-semibold text-slate-800">
                            ${exam.title}
                          </td>
                          <td class="py-3.5 px-4">
                            <span class="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${exam.type === 'midterm' || exam.type === 'final' ? 'bg-purple-100 text-purple-800' : 'bg-blue-50 text-blue-800'}">
                              ${exam.type.replace('_', ' ')}
                            </span>
                          </td>
                          <td class="py-3.5 px-4 text-slate-500">${exam.examDate}</td>
                          <td class="py-3.5 px-4 text-center font-bold text-slate-800 text-sm">
                            ${exam.marksObtained !== null ? exam.marksObtained : '<span class="text-slate-400 italic font-normal text-xs">Pending</span>'}
                          </td>
                          <td class="py-3.5 px-4 text-center text-slate-500">${exam.maxMarks}</td>
                          <td class="py-3.5 px-4 text-center font-semibold text-slate-600">${exam.weightPercentage}%</td>
                          <td class="py-3.5 px-4 text-center font-bold ${exam.weightedScore !== null ? 'text-indigo-900' : 'text-slate-400'}">
                            ${exam.weightedScore !== null ? exam.weightedScore : '-'}
                          </td>
                          <td class="py-3.5 px-5 text-slate-600 italic">
                            ${exam.remarks || '<span class="text-slate-300">No remarks</span>'}
                          </td>
                        </tr>
                      `).join('')}
                    </tbody>
                    <tfoot class="bg-slate-50 font-bold border-t border-slate-200 text-slate-800">
                      <tr>
                        <td colspan="3" class="py-3.5 px-5 text-right font-bold text-slate-600">Total Score:</td>
                        <td class="py-3.5 px-4 text-center text-indigo-950 font-black text-sm">${course.totalRawMarks} / ${course.totalMaxRawMarks}</td>
                        <td class="py-3.5 px-4 text-center text-slate-400">-</td>
                        <td class="py-3.5 px-4 text-center">${course.totalPossibleWeight}%</td>
                        <td class="py-3.5 px-4 text-center text-indigo-950 font-extrabold text-sm">${course.totalWeightedMarks}</td>
                        <td class="py-3.5 px-5 text-indigo-900 font-extrabold">
                          ${course.showRank ? `
                            Section Rank: ${this.formatOrdinal(course.sectionRank)} (${course.totalSectionStudents}) • Course Rank: ${this.formatOrdinal(course.courseRank || course.classRank)} (${course.totalCourseStudents || course.totalClassStudents})
                          ` : `
                            <span class="text-slate-400 font-semibold text-xs">Merit Ranking: Disabled by Teacher</span>
                          `}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;

      if (window.lucide) window.lucide.createIcons();
    } catch (err) {
      subContainer.innerHTML = `
        <div class="p-6 bg-rose-50 text-rose-700 rounded-xl text-center text-sm">
          Failed to load exam results: ${err.message}
        </div>
      `;
    }
  },

  // 2. ROUTINE & SCHEDULE VIEW
  renderRoutine() {
    const subContainer = document.getElementById('ucam-tab-content');
    if (!subContainer) return;
    const user = API.getCurrentUser();

    subContainer.innerHTML = `
      <div class="nexus-card p-6 sm:p-8">
        <div class="flex items-center justify-between pb-5 border-b border-slate-100 mb-6">
          <div>
            <h3 class="text-xl font-bold text-slate-800">Class Routine & Room Allocations</h3>
            <p class="text-xs text-slate-500 mt-1">Weekly scheduled timeslots for your enrolled classes at Nexus Academy Mirpur Campus.</p>
          </div>
          <span class="px-3 py-1 bg-indigo-50 text-indigo-900 font-bold text-xs rounded-full border border-indigo-100">
            Session 2024-2025
          </span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${this.classes.map(c => `
            <div class="p-5 rounded-2xl border border-slate-200 hover:border-indigo-400 bg-white transition space-y-3">
              <div class="flex items-center justify-between">
                <span class="px-2.5 py-1 rounded bg-indigo-900 text-white text-xs font-bold">${c.code}</span>
                <span class="text-xs font-bold text-slate-500">${c.section}</span>
              </div>
              <h4 class="text-base font-bold text-slate-800">${c.title}</h4>
              
              <div class="space-y-1.5 pt-2 border-t border-slate-100 text-xs text-slate-600">
                <div class="flex items-center gap-2">
                  <i data-lucide="clock" class="w-4 h-4 text-indigo-600"></i>
                  <span class="font-semibold text-slate-800">${c.schedule}</span>
                </div>
                <div class="flex items-center gap-2">
                  <i data-lucide="map-pin" class="w-4 h-4 text-slate-400"></i>
                  <span>${c.room}</span>
                </div>
                <div class="flex items-center gap-2">
                  <i data-lucide="user" class="w-4 h-4 text-slate-400"></i>
                  <span>Faculty: <strong>${c.teacherName}</strong></span>
                </div>
              </div>

              <div class="pt-2 flex items-center justify-between text-xs">
                <span class="text-slate-400">${c.enrolledCount} Students Enrolled</span>
                <button onclick="ELMS.init('${c.id}'); App.switchView('elms')" class="text-indigo-900 font-bold hover:underline inline-flex items-center gap-1">
                  Go to ELMS <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  // 3. TEACHER GRADEBOOK & MARKS ENTRY
  async renderGradebook() {
    const subContainer = document.getElementById('ucam-tab-content');
    if (!subContainer) return;

    if (this.classes.length === 0) {
      subContainer.innerHTML = `<p class="text-center py-8 text-slate-400">No classes assigned.</p>`;
      return;
    }

    const currentClass = this.classes.find(c => c.id === this.selectedClassId) || this.classes[0];
    this.selectedClassId = currentClass.id;

    try {
      const exams = await API.getExams(currentClass.id);

      subContainer.innerHTML = `
        <div class="nexus-card p-6 sm:p-7">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
            <div>
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold">
                  <i data-lucide="edit-3" class="w-5 h-5"></i>
                </div>
                <h3 class="text-xl font-bold text-slate-800">Continuous Assessment Gradebook</h3>
              </div>
              <p class="text-xs text-slate-500 mt-1">Create exams, input quiz & midterm marks, and publish results with Class & Section Rankings.</p>
            </div>

            <!-- Class Selector & Create Exam Button -->
            <div class="flex items-center gap-2.5 flex-wrap">
              <select onchange="UCAM.selectedClassId = this.value; UCAM.renderGradebook()" class="text-xs font-semibold px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600">
                ${this.classes.map(c => `
                  <option value="${c.id}" ${c.id === currentClass.id ? 'selected' : ''}>${c.code} - ${c.title} • [Sec: ${c.section || 'Regular'}]</option>
                `).join('')}
              </select>

              <!-- Rank Visibility Toggle Button -->
              <button onclick="UCAM.toggleSectionRank('${currentClass.id}', ${currentClass.showRank !== false ? 'false' : 'true'})" 
                class="px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs border ${currentClass.showRank !== false ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100' : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'}"
                title="${currentClass.showRank !== false ? 'Click to Disable Student Merit Ranking for this section' : 'Click to Enable Student Merit Ranking for this section'}">
                <i data-lucide="${currentClass.showRank !== false ? 'trophy' : 'eye-off'}" class="w-3.5 h-3.5 ${currentClass.showRank !== false ? 'text-amber-600' : 'text-slate-400'}"></i>
                <span>Rank: ${currentClass.showRank !== false ? 'Enabled' : 'Disabled'}</span>
              </button>

              <button onclick="UCAM.openCreateExamModal('${currentClass.id}')" class="px-4 py-2 bg-indigo-900 hover:bg-indigo-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm">
                <i data-lucide="plus-circle" class="w-4 h-4"></i>
                New Exam
              </button>
            </div>
          </div>

          <!-- Exams Cards List -->
          <div class="mt-6 space-y-4">
            ${exams.length === 0 ? `
              <div class="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <i data-lucide="calendar-plus" class="w-10 h-10 text-slate-400 mx-auto mb-2"></i>
                <p class="text-sm font-semibold text-slate-700">No exams configured for this class yet.</p>
                <p class="text-xs text-slate-400 mt-1">Click "New Exam" to add a Class Test, Quiz, Midterm or Final Exam.</p>
              </div>
            ` : `
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                ${exams.map(e => `
                  <div class="p-5 rounded-2xl border border-slate-200 hover:border-indigo-400 bg-white transition flex flex-col justify-between group">
                    <div>
                      <div class="flex items-center justify-between mb-2">
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${e.type === 'midterm' || e.type === 'final' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}">
                          ${e.type.replace('_', ' ')}
                        </span>
                        <button onclick="UCAM.deleteExam('${e.id}')" class="text-slate-300 hover:text-rose-600 transition">
                          <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                        </button>
                      </div>
                      <h4 class="text-sm font-bold text-slate-800 group-hover:text-indigo-900 transition">${e.title}</h4>
                      <div class="flex items-center gap-3 text-xs text-slate-500 mt-2">
                        <span>Max: <strong>${e.maxMarks}</strong></span>
                        <span>•</span>
                        <span>Weight: <strong>${e.weightPercentage}%</strong></span>
                        <span>•</span>
                        <span>${e.examDate}</span>
                      </div>
                    </div>

                    <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span class="text-[11px] font-semibold ${e.isPublished ? 'text-emerald-600' : 'text-amber-600'}">
                        ${e.isPublished ? '● Published' : '○ Draft'}
                      </span>
                      <button onclick="UCAM.openMarksEntryModal('${e.id}')" class="px-3 py-1.5 bg-indigo-900 hover:bg-indigo-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1">
                        <i data-lucide="edit-2" class="w-3 h-3"></i>
                        Input Marks
                      </button>
                    </div>
                  </div>
                `).join('')}
              </div>
            `}
          </div>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  // 4. CLASS ENROLLMENT MANAGER (Exclusively managed by the teacher)
  async renderEnrollmentManager() {
    const subContainer = document.getElementById('ucam-tab-content');
    if (!subContainer) return;

    if (this.classes.length === 0) {
      subContainer.innerHTML = `<p class="text-center py-8 text-slate-400">No classes assigned.</p>`;
      return;
    }

    const currentClass = this.classes.find(c => c.id === this.selectedClassId) || this.classes[0];
    this.selectedClassId = currentClass.id;

    try {
      const [enrolled, available] = await Promise.all([
        API.getClassStudents(currentClass.id),
        API.getAvailableStudents(currentClass.id)
      ]);

      subContainer.innerHTML = `
        <div class="nexus-card p-6 sm:p-7">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
            <div>
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-900 flex items-center justify-center font-bold">
                  <i data-lucide="user-check" class="w-5 h-5"></i>
                </div>
                <h3 class="text-xl font-bold text-slate-800">Class Enrollment Roster</h3>
              </div>
              <p class="text-xs text-slate-500 mt-1">Enrollment is managed exclusively by the assigned teacher. Students only see classes they attend.</p>
            </div>

            <!-- Class Selection -->
            <div class="flex items-center gap-2">
              <label class="text-xs font-bold text-slate-500">Selected Class:</label>
              <select onchange="UCAM.selectedClassId = this.value; UCAM.renderEnrollmentManager()" class="text-xs font-semibold px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600">
                ${this.classes.map(c => `
                  <option value="${c.id}" ${c.id === currentClass.id ? 'selected' : ''}>${c.code} - ${c.title} • [Sec: ${c.section || 'Regular'}]</option>
                `).join('')}
              </select>
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            <!-- Currently Enrolled Students (2 Cols) -->
            <div class="lg:col-span-2">
              <div class="flex items-center justify-between mb-3 flex-wrap gap-2">
                <div class="flex items-center gap-2">
                  <h4 class="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Enrolled Students (${enrolled.length})
                  </h4>
                  <span class="text-[11px] text-slate-400">• Active class section access</span>
                </div>
                ${enrolled.length > 0 ? `
                  <button onclick="Messaging.openGroupChat('${currentClass.id}')" 
                    class="px-3 py-1.5 bg-indigo-900 hover:bg-indigo-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs">
                    <i data-lucide="messages-square" class="w-3.5 h-3.5 text-cyan-300"></i>
                    <span>Message All Students (গ্রুপ মেসেজ)</span>
                  </button>
                ` : ''}
              </div>

              <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table class="w-full text-left text-xs">
                  <thead class="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                    <tr>
                      <th class="py-3 px-4">Student ID & Name</th>
                      <th class="py-3 px-4">Batch</th>
                      <th class="py-3 px-4">Contact Phone</th>
                      <th class="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    ${enrolled.length === 0 ? `
                      <tr>
                        <td colspan="4" class="text-center py-8 text-slate-400">No students enrolled yet. Add students from the right panel.</td>
                      </tr>
                    ` : enrolled.map(e => `
                      <tr class="hover:bg-slate-50/70 transition">
                        <td class="py-3 px-4">
                          <span class="font-bold text-slate-800 block">${e.studentName}</span>
                          <span class="text-[11px] text-slate-400">${e.studentId} • ${e.studentEmail}</span>
                        </td>
                        <td class="py-3 px-4 text-slate-600">${e.studentBatch || 'Regular'}</td>
                        <td class="py-3 px-4 text-slate-500">${e.studentPhone || 'N/A'}</td>
                        <td class="py-3 px-4 text-right">
                          <div class="flex items-center justify-end gap-1.5">
                            <button onclick="Messaging.openChat('${e.studentId}', '${currentClass.id}')" title="Message ${e.studentName}"
                              class="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 rounded-lg text-xs font-bold transition border border-indigo-200 flex items-center gap-1">
                              <i data-lucide="message-square" class="w-3 h-3 text-indigo-600"></i>
                              <span>Chat</span>
                            </button>
                            <button onclick="UCAM.unenrollStudent('${currentClass.id}', '${e.studentId}', '${e.studentName}')" class="px-2.5 py-1 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold transition">
                              Remove
                            </button>
                          </div>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Available Students to Enroll (1 Col) -->
            <div>
              <div class="flex items-center justify-between mb-3">
                <h4 class="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Add Student to Class (${available.length})
                </h4>
              </div>

              <div class="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <input type="text" id="student-search-input" oninput="UCAM.filterAvailableStudents(this.value)" placeholder="Search student name or ID..."
                  class="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-white">

                <div id="available-students-list" class="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                  ${available.length === 0 ? `
                    <p class="text-xs text-slate-400 text-center py-4">All registered academy students are enrolled in this batch.</p>
                  ` : available.map(s => `
                    <div class="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between gap-2 hover:border-indigo-300 transition">
                      <div class="truncate">
                        <span class="text-xs font-bold text-slate-800 block truncate">${s.name}</span>
                        <span class="text-[10px] text-slate-400">${s.id} • ${s.batch || 'Student'}</span>
                      </div>
                      <button onclick="UCAM.enrollStudent('${currentClass.id}', '${s.id}', '${s.name}')" class="px-2.5 py-1 bg-indigo-900 hover:bg-indigo-800 text-white rounded text-[11px] font-bold transition flex-shrink-0">
                        + Enroll
                      </button>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  filterAvailableStudents(query) {
    const list = document.getElementById('available-students-list');
    if (!list) return;
    const items = list.querySelectorAll('div');
    const q = query.toLowerCase();
    items.forEach(it => {
      const txt = it.innerText.toLowerCase();
      it.style.display = txt.includes(q) ? 'flex' : 'none';
    });
  },

  async enrollStudent(classId, studentId, studentName) {
    try {
      await API.enrollStudent(classId, studentId);
      showToast(`${studentName} enrolled in class!`, 'success');
      await this.renderEnrollmentManager();
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  async unenrollStudent(classId, studentId, studentName) {
    if (!confirm(`Are you sure you want to remove ${studentName} from this class enrollment?`)) return;
    try {
      await API.unenrollStudent(classId, studentId);
      showToast(`${studentName} removed from class`, 'success');
      await this.renderEnrollmentManager();
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  openEnrollmentModal(classId) {
    this.selectedClassId = classId;
    this.setTab('enrollment');
  },

  // 5. STUDENT LIST & DIRECTORY (Teacher & Admin view - "teacher student list dekhte parbe k k ache")
  async renderStudentList() {
    const subContainer = document.getElementById('ucam-tab-content');
    if (!subContainer) return;

    try {
      subContainer.innerHTML = `
        <div class="text-center py-12">
          <div class="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p class="text-xs text-slate-500 font-semibold">Loading academy students and enrollments...</p>
        </div>
      `;

      const [students, classes] = await Promise.all([
        API.getAllStudents(),
        API.getClasses()
      ]);

      const currentUser = API.getCurrentUser();
      const isTeacher = currentUser && currentUser.role === 'teacher';

      this.classes = classes;
      const totalStudents = students.length;
      const enrolledCount = students.filter(s => s.enrolledCount > 0).length;
      const unEnrolledCount = totalStudents - enrolledCount;

      subContainer.innerHTML = `
        <div class="nexus-card p-6 sm:p-7">
          
          <!-- Header and Stats -->
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <div class="flex items-center gap-2.5">
                <div class="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-900 flex items-center justify-center font-bold text-xl">
                  👥
                </div>
                <div>
                  <h3 class="text-xl font-bold text-slate-800">
                    ${isTeacher ? 'Enrolled Students in Your Sections (আপনার সেকশনের শিক্ষার্থীবৃন্দ)' : 'Academy Student Directory (শিক্ষার্থী তালিকা)'}
                  </h3>
                  <p class="text-xs text-slate-500 mt-0.5">
                    ${isTeacher 
                      ? 'Students enrolled in your assigned courses and sections. Teachers only see students enrolled in their classes. (শুধুমাত্র আপনার ক্লাসের সেকশনে এনরোল করা শিক্ষার্থীবৃন্দ)' 
                      : 'All registered students, contact numbers, and their active class/section enrollments.'}
                  </p>
                </div>
              </div>
            </div>

            <!-- Summary KPI Badges -->
            <div class="flex items-center gap-2.5 flex-wrap">
              <div class="px-3.5 py-2 rounded-xl bg-indigo-50 border border-indigo-100 text-xs">
                <span class="text-slate-500 block text-[10px] font-bold uppercase tracking-wider">${isTeacher ? 'Your Students' : 'Total Students'}</span>
                <strong class="text-indigo-950 font-black text-sm">${totalStudents}</strong>
              </div>
              <div class="px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-100 text-xs">
                <span class="text-emerald-600 block text-[10px] font-bold uppercase tracking-wider">Active Enrolled</span>
                <strong class="text-emerald-800 font-black text-sm">${enrolledCount}</strong>
              </div>
            </div>
          </div>

          <!-- Search, Section Filter and Actions Bar -->
          <div class="mt-5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div class="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <div class="relative w-full sm:w-72">
                <input type="text" id="student-list-search" oninput="UCAM.filterStudentList(this.value)"
                  placeholder="Search by name, ID (e.g. STU-8340), phone..."
                  class="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 focus:outline-none bg-slate-50">
              </div>

              ${isTeacher && classes.length > 0 ? `
                <div class="w-full sm:w-auto">
                  <select id="student-list-section-filter" onchange="UCAM.filterStudentListBySection(this.value)"
                    class="w-full sm:w-auto text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:ring-2 focus:ring-indigo-600">
                    <option value="all">All My Sections (${totalStudents} Students)</option>
                    ${classes.map(c => `
                      <option value="${c.id}">${c.code} - ${c.title} • [Sec: ${c.section || 'Regular'}]</option>
                    `).join('')}
                  </select>
                </div>
              ` : ''}
            </div>

            <div class="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
              ${isTeacher && classes.length > 0 ? `
                <button onclick="Messaging.openGroupChat('${classes[0].id}')" 
                  class="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-900 hover:bg-indigo-800 text-white transition flex items-center gap-1.5 shadow-sm"
                  title="Message all enrolled students in section group">
                  <i data-lucide="messages-square" class="w-3.5 h-3.5 text-cyan-300"></i>
                  <span>Message All Students (গ্রুপ চ্যাট)</span>
                </button>
              ` : ''}
              <button onclick="UCAM.openRegisterStudentModal()" class="px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-200 transition flex items-center gap-1.5 shadow-xs">
                <i data-lucide="user-plus" class="w-3.5 h-3.5"></i>
                <span>+ Register New Student</span>
              </button>
              <button onclick="UCAM.setTab('enrollment')" class="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 transition flex items-center gap-1.5 shadow-xs">
                <i data-lucide="layers" class="w-3.5 h-3.5 text-indigo-700"></i>
                <span>Section Roster View</span>
              </button>
            </div>
          </div>

          <!-- Students Table -->
          <div class="mt-5 border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs">
                <thead class="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <tr>
                    <th class="py-3.5 px-4">Student Name & ID</th>
                    <th class="py-3.5 px-4">Batch / Group</th>
                    <th class="py-3.5 px-4">Contact Phone & Email</th>
                    <th class="py-3.5 px-4">Enrolled Course Sections</th>
                    <th class="py-3.5 px-4 text-right">Enroll in Course Section</th>
                  </tr>
                </thead>
                <tbody id="student-list-tbody" class="divide-y divide-slate-100">
                  ${students.length === 0 ? `
                    <tr>
                      <td colspan="5" class="text-center py-12 text-slate-400 font-medium">
                        <div class="max-w-md mx-auto">
                          <div class="text-3xl mb-2">👥</div>
                          <p class="text-sm font-bold text-slate-700">${isTeacher ? 'No students enrolled in your sections yet.' : 'No students registered in the academy yet.'}</p>
                          <p class="text-xs text-slate-500 mt-1">${isTeacher ? 'Students will appear here once they are enrolled in your assigned course sections.' : 'Register new students using the button above.'}</p>
                          ${isTeacher ? `
                            <button onclick="UCAM.setTab('enrollment')" class="mt-4 px-4 py-2 bg-indigo-900 text-white rounded-xl text-xs font-bold hover:bg-indigo-800 transition">
                              Go to Class Enrollment Roster
                            </button>
                          ` : ''}
                        </div>
                      </td>
                    </tr>
                  ` : students.map(s => `
                    <tr class="hover:bg-slate-50/70 transition student-row-item" data-enrolled-classes='${JSON.stringify(s.enrolledClasses.map(c => c.classId))}'>
                      <td class="py-3.5 px-4">
                        <div class="flex items-center gap-2.5">
                          <span class="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-base shadow-xs flex-shrink-0">
                            ${s.avatar || '👨‍🎓'}
                          </span>
                          <div>
                            <strong class="text-slate-800 text-xs block leading-tight">${s.name}</strong>
                            <span class="font-mono text-[10px] font-bold text-indigo-800 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-100 inline-block mt-0.5">
                              ${s.id}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td class="py-3.5 px-4 text-slate-600 font-medium">
                        ${s.batch || s.department || 'Regular Student'}
                      </td>
                      <td class="py-3.5 px-4">
                        <span class="block text-slate-800 font-semibold">${s.phone || 'N/A'}</span>
                        <span class="text-[11px] text-slate-400 block">${s.email}</span>
                      </td>
                      <td class="py-3.5 px-4">
                        <div class="flex flex-wrap gap-1.5 max-w-sm">
                          ${s.enrolledClasses.length === 0 ? `
                            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              ⚠️ Not enrolled in any section
                            </span>
                          ` : s.enrolledClasses.map(c => {
                            const canUnenroll = !isTeacher || this.classes.some(tc => tc.id === c.classId);
                            return `
                              <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-indigo-50 text-indigo-950 border border-indigo-200">
                                <span>${c.code} (${c.section || 'Sec'})</span>
                                ${canUnenroll ? `
                                  <button onclick="UCAM.unenrollStudentFromList('${c.classId}', '${s.id}', '${s.name}', '${c.title}')" class="text-rose-500 hover:text-rose-700 ml-1 font-black text-xs" title="Remove enrollment">×</button>
                                ` : `
                                  <span class="text-slate-400 text-[10px] ml-0.5 font-normal cursor-help" title="Section taught by another faculty member">🔒</span>
                                `}
                              </span>
                            `;
                          }).join('')}
                        </div>
                      </td>
                      <td class="py-3.5 px-4 text-right">
                        <div class="inline-flex items-center gap-1.5 justify-end">
                          <button onclick="Messaging.openChat('${s.id}')" title="Message ${s.name}"
                            class="px-2 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-900 text-slate-600 rounded-lg text-[11px] font-bold transition border border-slate-200 flex items-center gap-1">
                            <i data-lucide="message-square" class="w-3.5 h-3.5 text-indigo-600"></i>
                            <span>Chat</span>
                          </button>
                          <select id="enroll-select-${s.id}" class="text-[11px] font-semibold px-2 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:ring-1 focus:ring-indigo-600 max-w-[190px]">
                            <option value="" disabled selected>-- Select Section --</option>
                            ${this.classes.map(c => {
                              const isAlready = s.enrolledClasses.some(ec => ec.classId === c.id);
                              return `
                                <option value="${c.id}" ${isAlready ? 'disabled' : ''}>
                                  ${c.code} - ${c.title} [${c.section || 'Regular'}] ${isAlready ? '(Already Enrolled)' : ''}
                                </option>
                              `;
                            }).join('')}
                          </select>
                          <button onclick="UCAM.enrollFromDirectory('${s.id}', '${s.name}')" 
                            class="px-2.5 py-1.5 bg-indigo-900 hover:bg-indigo-800 text-white rounded-lg text-[11px] font-bold transition shadow-xs whitespace-nowrap flex items-center gap-1">
                            <i data-lucide="user-plus" class="w-3.5 h-3.5"></i>
                            <span>Enroll</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;

      if (window.lucide) window.lucide.createIcons();
    } catch (err) {
      subContainer.innerHTML = `<p class="text-center py-8 text-rose-500 font-semibold">${err.message}</p>`;
    }
  },

  filterStudentListBySection(classId) {
    this.selectedSectionFilter = classId;
    this.applyStudentListFilters();
  },

  filterStudentList(query) {
    this.studentSearchQuery = query;
    this.applyStudentListFilters();
  },

  applyStudentListFilters() {
    const q = (this.studentSearchQuery || '').toLowerCase().trim();
    const section = this.selectedSectionFilter || 'all';
    const rows = document.querySelectorAll('.student-row-item');
    rows.forEach(r => {
      const text = r.innerText.toLowerCase();
      const matchesSearch = !q || text.includes(q);
      let matchesSection = true;
      if (section !== 'all') {
        const enrolledClassIds = JSON.parse(r.getAttribute('data-enrolled-classes') || '[]');
        matchesSection = enrolledClassIds.includes(section);
      }
      r.style.display = (matchesSearch && matchesSection) ? '' : 'none';
    });
  },

  // 6. STUDENT CLASSMATES ROSTER VIEW ("student rao dekhte parbe k k ache")
  async renderStudentClassmates() {
    const subContainer = document.getElementById('ucam-tab-content');
    if (!subContainer) return;

    const user = API.getCurrentUser();
    if (this.classes.length === 0) {
      subContainer.innerHTML = `
        <div class="nexus-card p-12 text-center max-w-xl mx-auto my-6">
          <div class="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3 text-2xl">
            👥
          </div>
          <h3 class="text-lg font-bold text-slate-800">No Enrolled Classes Found</h3>
          <p class="text-xs text-slate-500 mt-1">You are not enrolled in any class yet. Once enrolled, you will see your classmates here.</p>
        </div>
      `;
      return;
    }

    const currentClass = this.classes.find(c => c.id === this.selectedClassId) || this.classes[0];
    this.selectedClassId = currentClass.id;

    try {
      subContainer.innerHTML = `
        <div class="text-center py-12">
          <div class="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p class="text-xs text-slate-500 font-semibold">Loading your section classmates...</p>
        </div>
      `;

      const classmates = await API.getClassStudents(currentClass.id);

      subContainer.innerHTML = `
        <div class="nexus-card p-6 sm:p-7">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <div class="flex items-center gap-2.5">
                <div class="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-900 flex items-center justify-center font-bold text-xl">
                  👥
                </div>
                <div>
                  <h3 class="text-xl font-bold text-slate-800">My Classmates & Section Roster (আমার সহপাঠীগণ)</h3>
                  <p class="text-xs text-slate-500 mt-0.5">
                    Fellow students enrolled in <strong>${currentClass.code} (${currentClass.section})</strong> with <strong>${currentClass.teacherName}</strong>.
                  </p>
                </div>
              </div>
            </div>

            <!-- Class Selection Dropdown -->
            <div class="flex items-center gap-2">
              <label class="text-xs font-bold text-slate-500 whitespace-nowrap">Select Section:</label>
              <select onchange="UCAM.selectedClassId = this.value; UCAM.renderStudentClassmates()" 
                class="text-xs font-semibold px-3 py-2 bg-slate-100 border border-slate-200 text-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-600">
                ${this.classes.map(c => `
                  <option value="${c.id}" ${c.id === currentClass.id ? 'selected' : ''}>
                    ${c.code} - ${c.title} • [Sec: ${c.section || 'Regular'}]
                  </option>
                `).join('')}
              </select>
            </div>
          </div>

          <!-- Classmates Stats & Actions -->
          <div class="mt-5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <span class="text-xs text-slate-600">
                Total Enrolled in this Section: <strong class="text-indigo-900 font-bold">${classmates.length} Students</strong>
              </span>
              <button onclick="Messaging.openGroupChat('${currentClass.id}')" 
                class="px-3 py-1.5 bg-indigo-900 hover:bg-indigo-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs">
                <i data-lucide="messages-square" class="w-3.5 h-3.5 text-cyan-300"></i>
                <span>Open Section Group Chat (গ্রুপ চ্যাট)</span>
              </button>
            </div>
            <div class="w-full sm:w-64">
              <input type="text" oninput="UCAM.filterClassmates(this.value)" placeholder="Search classmate name or ID..."
                class="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:ring-2 focus:ring-indigo-600">
            </div>
          </div>

          <!-- Classmate Cards Grid -->
          <div id="classmates-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            ${classmates.map(c => {
              const isMe = c.studentId === user.id;
              return `
                <div class="classmate-card p-4 rounded-2xl border ${isMe ? 'border-indigo-400 bg-indigo-50/40' : 'border-slate-200 bg-white'} hover:shadow-sm transition flex flex-col justify-between">
                  <div class="flex items-start gap-3">
                    <span class="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xl flex-shrink-0 shadow-xs">
                      ${c.studentAvatar || '👨‍🎓'}
                    </span>
                    <div class="min-w-0 flex-1">
                      <div class="flex items-center gap-1.5 flex-wrap">
                        <strong class="text-sm font-bold text-slate-800 block truncate">${c.studentName}</strong>
                        ${isMe ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-600 text-white shadow-xs">You</span>` : ''}
                      </div>
                      <span class="font-mono text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 inline-block mt-0.5">
                        ${c.studentId}
                      </span>
                      <p class="text-xs text-slate-500 mt-1">${c.studentBatch || 'Nexus Student'}</p>
                    </div>
                  </div>

                  <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span class="text-[11px] text-slate-400 truncate">
                      ${c.studentEmail ? c.studentEmail.split('@')[0] : ''}
                    </span>
                    ${!isMe ? `
                      <button onclick="Messaging.openChat('${c.studentId}', '${currentClass.id}')" 
                        class="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 text-xs font-bold transition flex items-center gap-1.5 border border-indigo-200">
                        <i data-lucide="message-square" class="w-3.5 h-3.5 text-indigo-600"></i>
                        <span>Chat</span>
                      </button>
                    ` : `
                      <span class="text-[11px] font-semibold text-emerald-600">● Enrolled Active</span>
                    `}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;

      if (window.lucide) window.lucide.createIcons();
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  filterClassmates(query) {
    const grid = document.getElementById('classmates-grid');
    if (!grid) return;
    const cards = grid.querySelectorAll('.classmate-card');
    const q = query.toLowerCase();
    cards.forEach(card => {
      const txt = card.innerText.toLowerCase();
      card.style.display = txt.includes(q) ? 'flex' : 'none';
    });
  },

  async enrollFromDirectory(studentId, studentName) {
    const select = document.getElementById(`enroll-select-${studentId}`);
    if (!select || !select.value) {
      showToast('Please select a course section from the dropdown first.', 'error');
      return;
    }
    const classId = select.value;
    try {
      const res = await API.enrollStudent(classId, studentId);
      showToast(res.message || `${studentName} enrolled successfully!`, 'success');
      await this.renderStudentList();
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  async unenrollStudentFromList(classId, studentId, studentName, classTitle) {
    if (!confirm(`Are you sure you want to remove ${studentName} from ${classTitle}?`)) return;
    try {
      await API.unenrollStudent(classId, studentId);
      showToast(`${studentName} removed from ${classTitle}`, 'success');
      await this.renderStudentList();
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  async toggleSectionRank(classId, newState) {
    try {
      await API.updateClass(classId, { showRank: newState });
      showToast(newState ? 'Merit Ranking enabled for this section.' : 'Merit Ranking disabled for this section.', 'success');
      const cls = this.classes.find(c => c.id === classId);
      if (cls) cls.showRank = newState;
      await this.renderGradebook();
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  openRegisterStudentModal() {
    App.showModal(`
      <div class="p-6">
        <div class="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div class="flex items-center gap-2">
            <span class="text-xl">👨‍🎓</span>
            <h3 class="text-lg font-bold text-slate-900">Register New Academy Student</h3>
          </div>
          <button onclick="App.closeModal()" class="text-slate-400 hover:text-slate-600">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <form onsubmit="UCAM.submitRegisterStudent(event)" class="space-y-4">
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Full Student Name</label>
            <input type="text" name="name" placeholder="e.g. Mahinul Islam" required
              class="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:outline-none">
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Username / Email</label>
              <input type="text" name="email" placeholder="e.g. mahinul or m@nexus" required
                class="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:outline-none">
            </div>
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Phone Number</label>
              <input type="text" name="phone" placeholder="017XXXXXXXX"
                class="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:outline-none">
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Batch / Class</label>
              <input type="text" name="batch" placeholder="e.g. Class 9, Class 10, HSC 2026"
                class="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:outline-none">
            </div>
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Initial Password</label>
              <input type="password" name="password" value="nexus123" placeholder="nexus123"
                class="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:outline-none">
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Enroll Into Course Section (Optional)</label>
            <select name="initialClassId" class="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-600">
              <option value="">-- Do not enroll yet (Can enroll later) --</option>
              ${this.classes.map(c => `
                <option value="${c.id}">${c.code} - ${c.title} [Section: ${c.section || 'Regular'}]</option>
              `).join('')}
            </select>
          </div>

          <div class="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button type="button" onclick="App.closeModal()" class="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition">Cancel</button>
            <button type="submit" class="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-900 hover:bg-indigo-800 text-white transition shadow-md">Register & Save Student</button>
          </div>
        </form>
      </div>
    `);
    if (window.lucide) window.lucide.createIcons();
  },

  async submitRegisterStudent(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    try {
      const res = await API.registerStudent(data);
      showToast(res.message || 'Student registered successfully!', 'success');
      App.closeModal();
      await this.renderStudentList();
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  // Modal: Create New Exam
  openCreateExamModal(classId) {
    App.showModal(`
      <div class="p-6">
        <div class="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <h3 class="text-lg font-bold text-slate-900">Configure New Exam Assessment</h3>
          <button onclick="App.closeModal()" class="text-slate-400 hover:text-slate-600">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <form onsubmit="UCAM.submitCreateExam(event, '${classId}')" class="space-y-4">
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Exam / Assessment Title</label>
            <input type="text" name="title" placeholder="e.g. Class Test 3: Electromagnetism & Optics" required
              class="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:outline-none">
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Assessment Type</label>
              <select name="type" class="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:outline-none">
                <option value="class_test">Class Test (CT)</option>
                <option value="quiz">Pop Quiz</option>
                <option value="midterm">Midterm Examination</option>
                <option value="final">Final Examination</option>
                <option value="assignment">Homework Assignment</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Exam Date</label>
              <input type="date" name="examDate" value="${new Date().toISOString().split('T')[0]}" required
                class="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:outline-none">
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Max Marks</label>
              <input type="number" name="maxMarks" value="25" min="1" max="100" required
                class="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:outline-none">
            </div>
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Weight (%)</label>
              <input type="number" name="weightPercentage" value="15" min="1" max="100" required
                class="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:outline-none">
            </div>
          </div>

          <div class="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button type="button" onclick="App.closeModal()" class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition">Cancel</button>
            <button type="submit" class="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-900 hover:bg-indigo-800 text-white transition shadow-sm">
              Create Exam
            </button>
          </div>
        </form>
      </div>
    `);
    if (window.lucide) window.lucide.createIcons();
  },

  async submitCreateExam(event, classId) {
    event.preventDefault();
    const form = event.target;
    try {
      await API.createExam(classId, {
        title: form.title.value,
        type: form.type.value,
        examDate: form.examDate.value,
        maxMarks: form.maxMarks.value,
        weightPercentage: form.weightPercentage.value
      });
      showToast('Exam created successfully!', 'success');
      App.closeModal();
      await this.renderGradebook();
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  async deleteExam(examId) {
    if (!confirm('Are you sure you want to delete this exam and its recorded marks?')) return;
    try {
      await API.deleteExam(examId);
      showToast('Exam deleted', 'success');
      await this.renderGradebook();
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  // Modal: Enter Marks for Students (Interactive Roster)
  async openMarksEntryModal(examId) {
    try {
      const { exam, roster } = await API.getExamRoster(examId);

      App.showModal(`
        <div class="p-6 max-w-2xl w-full">
          <div class="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div>
              <span class="text-[11px] font-bold text-indigo-900 uppercase tracking-wider">Marks Entry Sheet</span>
              <h3 class="text-lg font-bold text-slate-900">${exam.title}</h3>
              <p class="text-xs text-slate-500">Max Marks: ${exam.maxMarks} • Weight: ${exam.weightPercentage}%</p>
            </div>
            <button onclick="App.closeModal()" class="text-slate-400 hover:text-slate-600">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <form id="marks-entry-form" onsubmit="UCAM.submitMarks(event, '${exam.id}')" class="space-y-4">
            <div class="max-h-[50vh] overflow-y-auto pr-1">
              <table class="w-full text-left text-xs">
                <thead class="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] sticky top-0 border-b border-slate-200">
                  <tr>
                    <th class="py-2.5 px-3">Student Name</th>
                    <th class="py-2.5 px-3 w-28 text-center">Marks (${exam.maxMarks})</th>
                    <th class="py-2.5 px-3">Teacher Remarks / Feedback</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  ${roster.map(r => `
                    <tr class="hover:bg-slate-50/70">
                      <td class="py-2.5 px-3">
                        <span class="font-bold text-slate-800 block">${r.studentName}</span>
                        <span class="text-[10px] text-slate-400">${r.studentId} • ${r.studentBatch || 'Regular'}</span>
                      </td>
                      <td class="py-2.5 px-3 text-center">
                        <input type="number" step="0.5" min="0" max="${exam.maxMarks}" name="marks_${r.studentId}" 
                          value="${r.marksObtained !== null ? r.marksObtained : ''}" placeholder="0 - ${exam.maxMarks}"
                          class="w-24 text-center font-bold px-2 py-1.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:outline-none bg-white">
                      </td>
                      <td class="py-2.5 px-3">
                        <input type="text" name="remarks_${r.studentId}" value="${r.remarks || ''}" placeholder="Optional remark..."
                          class="w-full px-2 py-1.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:outline-none bg-white text-xs">
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>

            <div class="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span class="text-[11px] text-slate-400">Scores will reflect immediately in student UCAM grade report.</span>
              <div class="flex items-center gap-2">
                <button type="button" onclick="App.closeModal()" class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition">Cancel</button>
                <button type="submit" class="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-sm">
                  Save & Publish Marks
                </button>
              </div>
            </div>
          </form>
        </div>
      `);
      if (window.lucide) window.lucide.createIcons();
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  async submitMarks(event, examId) {
    event.preventDefault();
    const form = event.target;
    const inputs = form.querySelectorAll('input[name^="marks_"]');
    const marksPayload = [];

    inputs.forEach(input => {
      const studentId = input.name.replace('marks_', '');
      const val = input.value.trim();
      const remarksInput = form.querySelector(`input[name="remarks_${studentId}"]`);
      if (val !== '') {
        marksPayload.push({
          studentId,
          marksObtained: parseFloat(val),
          remarks: remarksInput ? remarksInput.value.trim() : ''
        });
      }
    });

    try {
      await API.saveExamResults(examId, marksPayload);
      showToast('Marks saved and published to students!', 'success');
      App.closeModal();
      await this.renderGradebook();
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  // Print Transcript View (Opens clean print modal)
  printTranscript() {
    window.print();
  }
};
