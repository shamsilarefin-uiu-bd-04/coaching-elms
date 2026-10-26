// NexusAcademyLS API Client
const API = {
  getToken() {
    return localStorage.getItem('nexus_token');
  },

  setToken(token) {
    if (token) localStorage.setItem('nexus_token', token);
    else localStorage.removeItem('nexus_token');
  },

  getCurrentUser() {
    const raw = localStorage.getItem('nexus_user');
    return raw ? JSON.parse(raw) : null;
  },

  setCurrentUser(user) {
    if (user) localStorage.setItem('nexus_user', JSON.stringify(user));
    else localStorage.removeItem('nexus_user');
  },

  async request(endpoint, options = {}) {
    const token = this.getToken();
    const headers = {
      ...(options.headers || {})
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    try {
      const response = await fetch(endpoint, {
        ...options,
        headers
      });

      if (response.status === 401 || response.status === 403) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 401 && !endpoint.includes('/api/auth/login')) {
          this.logout();
          window.location.reload();
          throw new Error('Session expired. Please log in again.');
        }
        throw new Error(errorData.error || 'Access denied');
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || `Request failed with status ${response.status}`);
      }

      return data;
    } catch (err) {
      console.error(`API Error on [${options.method || 'GET'} ${endpoint}]:`, err);
      throw err;
    }
  },

  // Auth
  async login(email, password, role = null) {
    const res = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, role })
    });
    this.setToken(res.token);
    this.setCurrentUser(res.user);
    return res;
  },

  logout() {
    this.setToken(null);
    this.setCurrentUser(null);
  },

  async getMe() {
    const res = await this.request('/api/auth/me');
    this.setCurrentUser(res.user);
    return res.user;
  },

  async changePassword(oldPassword, newPassword) {
    return this.request('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ oldPassword, newPassword })
    });
  },

  // Classes
  async getClasses() {
    return this.request('/api/classes');
  },

  async getClass(id) {
    return this.request(`/api/classes/${id}`);
  },

  async createClass(payload) {
    return this.request('/api/classes', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async updateClass(id, payload) {
    return this.request(`/api/classes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },

  async deleteClass(id) {
    return this.request(`/api/classes/${id}`, {
      method: 'DELETE'
    });
  },

  // Enrollment & Student Directory (Teacher exclusive management)
  async getAllStudents(classId = null) {
    const url = classId ? `/api/students?classId=${encodeURIComponent(classId)}` : '/api/students';
    return this.request(url);
  },

  async registerStudent(studentData) {
    return this.request('/api/students', {
      method: 'POST',
      body: JSON.stringify(studentData)
    });
  },

  async getClassStudents(classId) {
    return this.request(`/api/classes/${classId}/students`);
  },

  async getAvailableStudents(classId) {
    return this.request(`/api/classes/${classId}/available-students`);
  },

  async enrollStudent(classId, studentId) {
    return this.request(`/api/classes/${classId}/enroll`, {
      method: 'POST',
      body: JSON.stringify({ studentId })
    });
  },

  async unenrollStudent(classId, studentId) {
    return this.request(`/api/classes/${classId}/enroll/${studentId}`, {
      method: 'DELETE'
    });
  },

  // Course Materials (Soft copies of notes)
  async getMaterials(classId) {
    return this.request(`/api/classes/${classId}/materials`);
  },

  async uploadMaterial(classId, formData) {
    return this.request(`/api/classes/${classId}/materials`, {
      method: 'POST',
      body: formData
    });
  },

  async deleteMaterial(materialId) {
    return this.request(`/api/materials/${materialId}`, {
      method: 'DELETE'
    });
  },

  // External Links
  async getLinks(classId) {
    return this.request(`/api/classes/${classId}/links`);
  },

  async addLink(classId, linkData) {
    return this.request(`/api/classes/${classId}/links`, {
      method: 'POST',
      body: JSON.stringify(linkData)
    });
  },

  async deleteLink(linkId) {
    return this.request(`/api/links/${linkId}`, {
      method: 'DELETE'
    });
  },

  // Exams & Gradebook (UCAM Continuous Assessment)
  async getExams(classId) {
    return this.request(`/api/classes/${classId}/exams`);
  },

  async createExam(classId, examData) {
    return this.request(`/api/classes/${classId}/exams`, {
      method: 'POST',
      body: JSON.stringify(examData)
    });
  },

  async deleteExam(examId) {
    return this.request(`/api/exams/${examId}`, {
      method: 'DELETE'
    });
  },

  async getExamRoster(examId) {
    return this.request(`/api/exams/${examId}/roster`);
  },

  async saveExamResults(examId, marks) {
    return this.request(`/api/exams/${examId}/results`, {
      method: 'POST',
      body: JSON.stringify({ marks })
    });
  },

  async getGradeSheet(studentId = null, classId = null) {
    let url = '/api/gradesheet';
    const params = new URLSearchParams();
    if (studentId) params.append('studentId', studentId);
    if (classId) params.append('classId', classId);
    const qs = params.toString();
    if (qs) url += `?${qs}`;
    return this.request(url);
  },

  // Messaging (Student <-> Teacher)
  async getConversations() {
    return this.request('/api/messages/conversations');
  },

  async getMessages(partnerId, classId = null) {
    let url = `/api/messages/${partnerId}`;
    if (classId) url += `?classId=${classId}`;
    return this.request(url);
  },

  async sendMessage(receiverId, content, subject = '', classId = null, attachmentFile = null) {
    if (attachmentFile) {
      const formData = new FormData();
      formData.append('receiverId', receiverId);
      formData.append('content', content || '');
      if (subject) formData.append('subject', subject);
      if (classId) formData.append('classId', classId);
      formData.append('attachment', attachmentFile);

      return this.request('/api/messages', {
        method: 'POST',
        body: formData
      });
    }

    return this.request('/api/messages', {
      method: 'POST',
      body: JSON.stringify({ receiverId, content, subject, classId })
    });
  },

  async getMessageContacts() {
    return this.request('/api/messages-contacts');
  },

  // Section Discussion Groups (Teacher + Enrolled Students)
  async getSectionGroups() {
    return this.request('/api/messages/groups');
  },

  async getSectionGroupMessages(classId) {
    return this.request(`/api/messages/groups/${classId}`);
  },

  async sendSectionGroupMessage(classId, content, attachmentFile = null) {
    if (attachmentFile) {
      const formData = new FormData();
      formData.append('content', content || '');
      formData.append('attachment', attachmentFile);

      return this.request(`/api/messages/groups/${classId}`, {
        method: 'POST',
        body: formData
      });
    }

    return this.request(`/api/messages/groups/${classId}`, {
      method: 'POST',
      body: JSON.stringify({ content })
    });
  },

  // Notice Board & Announcements
  async getNoticeBoard() {
    return this.request('/api/notices');
  },

  async markNoticeAsRead(id) {
    return this.request(`/api/notices/${id}/read`, {
      method: 'POST'
    });
  },

  async markAllNoticesAsRead() {
    return this.request('/api/notices/mark-all-read', {
      method: 'POST'
    });
  },

  async getUnreadNoticesCount() {
    return this.request('/api/notices/unread-count');
  },

  async createNotice(payload) {
    return this.request('/api/notices', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async updateNotice(id, payload) {
    return this.request(`/api/notices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },

  async deleteNotice(id) {
    return this.request(`/api/notices/${id}`, {
      method: 'DELETE'
    });
  },

  // Announcements (backward compatibility)
  async getAnnouncements(classId = null) {
    let url = '/api/announcements';
    if (classId) url += `?classId=${classId}`;
    return this.request(url);
  },

  async createAnnouncement(payload) {
    return this.request('/api/announcements', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async updateAnnouncement(id, payload) {
    return this.request(`/api/announcements/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },

  async deleteAnnouncement(id) {
    return this.request(`/api/announcements/${id}`, {
      method: 'DELETE'
    });
  },

  // Admin Management
  async getAdminStats() {
    return this.request('/api/admin/stats');
  },

  async getAdminUsers(role = null, search = '') {
    let url = '/api/admin/users';
    const p = new URLSearchParams();
    if (role) p.append('role', role);
    if (search) p.append('search', search);
    const qs = p.toString();
    if (qs) url += `?${qs}`;
    return this.request(url);
  },

  async createAdminUser(userData) {
    return this.request('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },

  async updateAdminUser(id, userData) {
    return this.request(`/api/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  },

  async deleteAdminUser(id) {
    return this.request(`/api/admin/users/${id}`, {
      method: 'DELETE'
    });
  },

  async resetUserPassword(id, newPassword) {
    return this.request(`/api/admin/users/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword })
    });
  }
};

// UI Notification Toasts
function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  const bg = type === 'success' ? 'bg-emerald-600' : type === 'error' ? 'bg-rose-600' : 'bg-slate-800';
  const icon = type === 'success' ? 'check-circle' : type === 'error' ? 'alert-circle' : 'info';

  toast.className = `${bg} text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 transition-all transform translate-y-3 opacity-0 pointer-events-auto border border-white/10`;
  toast.innerHTML = `
    <i data-lucide="${icon}" class="w-5 h-5 flex-shrink-0"></i>
    <span class="text-sm font-medium flex-1">${message}</span>
  `;

  container.appendChild(toast);
  if (window.lucide) window.lucide.createIcons();

  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-3', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');
  });

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}
