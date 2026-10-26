// NexusAcademyLS - Section Groups & Direct Messaging System
const Messaging = {
  activeType: 'group', // 'group' | 'direct'
  sidebarTab: 'groups', // 'groups' | 'direct'
  activeGroupId: null,
  activePartnerId: null,
  activeClassId: null,
  activeGroupData: null,
  activePartnerData: null,
  currentViewKey: null, // Tracks what chat view is currently mounted to prevent polling resets
  lastGroupMsgCount: 0,
  lastGroupLastId: null,
  lastDirectMsgCount: 0,
  lastDirectLastId: null,
  sectionGroups: [],
  conversations: [],
  contacts: [],
  pollTimer: null,
  selectedAttachmentFile: null,
  selectedAttachmentType: null, // 'image' | 'file'

  async init() {
    await Promise.all([
      this.loadSectionGroups(),
      this.loadConversations(),
      this.loadContacts()
    ]);

    this.render();

    // Auto-open active item
    if (this.activeType === 'group' && this.activeGroupId) {
      await this.loadGroupMessages(this.activeGroupId, true);
    } else if (this.activeType === 'direct' && this.activePartnerId) {
      await this.loadMessages(this.activePartnerId, this.activeClassId, true);
    } else if (this.sectionGroups.length > 0) {
      this.activeType = 'group';
      this.sidebarTab = 'groups';
      this.activeGroupId = this.sectionGroups[0].id;
      this.updateSidebarList();
      await this.loadGroupMessages(this.activeGroupId, true);
    } else if (this.conversations.length > 0) {
      this.activeType = 'direct';
      this.sidebarTab = 'direct';
      this.activePartnerId = this.conversations[0].partnerId;
      this.activeClassId = this.conversations[0].classId;
      this.updateSidebarList();
      await this.loadMessages(this.activePartnerId, this.activeClassId, true);
    } else if (this.contacts.length > 0) {
      this.activeType = 'direct';
      this.sidebarTab = 'direct';
      this.activePartnerId = this.contacts[0].id;
      this.updateSidebarList();
      await this.loadMessages(this.activePartnerId, null, true);
    }

    this.startPolling();
  },

  startPolling() {
    if (this.pollTimer) clearInterval(this.pollTimer);
    this.pollTimer = setInterval(async () => {
      const chatContainer = document.getElementById('active-chat-container');
      if (!chatContainer) return;

      if (this.activeType === 'group' && this.activeGroupId) {
        await this.loadGroupMessages(this.activeGroupId, false);
      } else if (this.activeType === 'direct' && this.activePartnerId) {
        await this.loadMessages(this.activePartnerId, this.activeClassId, false);
      }
    }, 4000);
  },

  async loadSectionGroups() {
    try {
      this.sectionGroups = await API.getSectionGroups();
    } catch (err) {
      console.error('Failed loading section groups:', err);
      this.sectionGroups = [];
    }
  },

  async loadConversations() {
    try {
      this.conversations = await API.getConversations();
      this.updateUnreadCount();
    } catch (err) {
      console.error('Failed loading conversations:', err);
      this.conversations = [];
    }
  },

  async loadContacts() {
    try {
      this.contacts = await API.getMessageContacts();
    } catch (err) {
      console.error('Failed loading contacts:', err);
      this.contacts = [];
    }
  },

  updateUnreadCount() {
    const unreadCount = (this.conversations || []).filter(c => c.hasUnread).length;
    const badge = document.getElementById('msg-badge-counter');
    if (badge) {
      if (unreadCount > 0) {
        badge.innerText = unreadCount;
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    }
  },

  async switchSidebarTab(tab) {
    this.sidebarTab = tab;
    this.updateSidebarList();
    if (tab === 'groups' && this.sectionGroups.length > 0 && this.activeType !== 'group') {
      await this.openGroupChat(this.sectionGroups[0].id);
    } else if (tab === 'direct' && this.conversations.length > 0 && this.activeType !== 'direct') {
      await this.openChat(this.conversations[0].partnerId, this.conversations[0].classId);
    }
  },

  updateSidebarList() {
    const listEl = document.getElementById('messaging-items-list');
    const tabGroupsBtn = document.getElementById('tab-btn-groups');
    const tabDirectBtn = document.getElementById('tab-btn-direct');

    if (tabGroupsBtn && tabDirectBtn) {
      if (this.sidebarTab === 'groups') {
        tabGroupsBtn.className = 'flex-1 py-2 text-xs font-bold rounded-xl transition bg-white dark:bg-slate-800 text-indigo-900 dark:text-indigo-300 shadow-xs';
        tabDirectBtn.className = 'flex-1 py-2 text-xs font-semibold rounded-xl transition text-slate-500 hover:text-slate-800 dark:hover:text-slate-200';
      } else {
        tabDirectBtn.className = 'flex-1 py-2 text-xs font-bold rounded-xl transition bg-white dark:bg-slate-800 text-indigo-900 dark:text-indigo-300 shadow-xs';
        tabGroupsBtn.className = 'flex-1 py-2 text-xs font-semibold rounded-xl transition text-slate-500 hover:text-slate-800 dark:hover:text-slate-200';
      }
    }

    if (listEl) {
      listEl.innerHTML = this.sidebarTab === 'groups' ? this.renderSectionGroupsListHtml() : this.renderConversationsListHtml();
      if (window.lucide) window.lucide.createIcons();
    }
  },

  // Open Section Group Chat from any button
  async openGroupChat(classId) {
    this.activeType = 'group';
    this.sidebarTab = 'groups';
    this.activeGroupId = classId;
    this.selectedAttachmentFile = null;
    this.selectedAttachmentType = null;
    this.currentViewKey = null; // force fresh render

    if (typeof App !== 'undefined' && App.currentView !== 'messaging') {
      App.currentView = 'messaging';
      ['elms', 'ucam', 'messaging', 'admin', 'notices'].forEach(v => {
        const panel = document.getElementById(`view-${v}`);
        const btn = document.getElementById(`nav-btn-${v}`);
        if (panel) {
          if (v === 'messaging') panel.classList.remove('hidden');
          else panel.classList.add('hidden');
        }
        if (btn) {
          if (v === 'messaging') {
            btn.classList.remove('nav-tab-inactive');
            btn.classList.add('nav-tab-active');
          } else {
            btn.classList.remove('nav-tab-active');
            btn.classList.add('nav-tab-inactive');
          }
        }
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    await this.loadSectionGroups();
    this.render();
    await this.loadGroupMessages(classId, true);
    this.startPolling();
  },

  // Open Direct Chat with individual
  async openChat(partnerId, classId = null) {
    this.activeType = 'direct';
    this.sidebarTab = 'direct';
    this.activePartnerId = partnerId;
    this.activeClassId = classId;
    this.selectedAttachmentFile = null;
    this.selectedAttachmentType = null;
    this.currentViewKey = null; // force fresh render

    if (typeof App !== 'undefined' && App.currentView !== 'messaging') {
      App.currentView = 'messaging';
      ['elms', 'ucam', 'messaging', 'admin', 'notices'].forEach(v => {
        const panel = document.getElementById(`view-${v}`);
        const btn = document.getElementById(`nav-btn-${v}`);
        if (panel) {
          if (v === 'messaging') panel.classList.remove('hidden');
          else panel.classList.add('hidden');
        }
        if (btn) {
          if (v === 'messaging') {
            btn.classList.remove('nav-tab-inactive');
            btn.classList.add('nav-tab-active');
          } else {
            btn.classList.remove('nav-tab-active');
            btn.classList.add('nav-tab-inactive');
          }
        }
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    await this.loadConversations();
    await this.loadContacts();
    this.render();
    await this.loadMessages(partnerId, classId, true);
    this.startPolling();
  },

  renderSectionGroupsListHtml() {
    if (!this.sectionGroups || this.sectionGroups.length === 0) {
      return `
        <div class="text-center py-10 px-4">
          <div class="w-12 h-12 mx-auto mb-2 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-900 dark:text-indigo-300 flex items-center justify-center text-xl">
            👥
          </div>
          <p class="text-xs font-bold text-slate-700 dark:text-slate-200">No Section Groups</p>
          <p class="text-[11px] text-slate-400 mt-1 leading-relaxed">
            You will automatically join the section discussion group once enrolled in a course section.
          </p>
        </div>
      `;
    }

    return this.sectionGroups.map(g => {
      const isActive = this.activeType === 'group' && this.activeGroupId === g.id;
      return `
        <div onclick="Messaging.openGroupChat('${g.id}')" 
          class="p-3 rounded-2xl cursor-pointer transition flex items-start gap-3 ${isActive ? 'bg-indigo-100/80 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 shadow-xs' : 'hover:bg-white dark:hover:bg-slate-800/60 border border-transparent'}">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-700 to-indigo-950 text-white flex items-center justify-center text-base flex-shrink-0 relative shadow-xs">
            👥
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between">
              <h5 class="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">${g.code} (${g.section || 'Sec'})</h5>
              <span class="text-[10px] text-slate-400">${new Date(g.lastMessageAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
            </div>
            <div class="flex items-center gap-1.5 mt-0.5">
              <span class="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800">
                ${g.memberCount} Members
              </span>
              <span class="text-[10px] text-slate-400 truncate">👨‍🏫 ${g.teacherName}</span>
            </div>
            <p class="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-1">
              ${g.lastSenderName ? `<strong class="text-slate-700 dark:text-slate-300">${g.lastSenderName.split(' ')[0]}:</strong> ` : ''}${g.lastMessage}
            </p>
          </div>
        </div>
      `;
    }).join('');
  },

  renderConversationsListHtml() {
    const user = API.getCurrentUser();
    let displayList = [...(this.conversations || [])];

    if (this.activeType === 'direct' && this.activePartnerId) {
      const exists = displayList.some(c => c.partnerId === this.activePartnerId);
      if (!exists) {
        const contact = (this.contacts || []).find(c => c.id === this.activePartnerId);
        if (contact) {
          displayList.unshift({
            partnerId: contact.id,
            partnerName: contact.name,
            partnerRole: contact.role,
            partnerAvatar: contact.avatar || (contact.role === 'teacher' ? '👨‍🏫' : '👨‍🎓'),
            lastMessage: 'Active direct chat...',
            lastMessageAt: new Date().toISOString(),
            hasUnread: false,
            classCode: (contact.classes && contact.classes[0]) ? contact.classes[0].code : ''
          });
        }
      }
    }

    if (displayList.length === 0) {
      return `
        <div class="text-center py-8 px-4">
          <div class="w-12 h-12 mx-auto mb-2 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-900 dark:text-indigo-300 flex items-center justify-center">
            <i data-lucide="message-square" class="w-6 h-6"></i>
          </div>
          <p class="text-xs font-bold text-slate-700 dark:text-slate-200">No Direct Messages</p>
          <p class="text-[11px] text-slate-400 mt-1 mb-4 leading-relaxed">
            ${user.role === 'student' ? 'Send a question, problem photo, or homework PDF to your teacher or classmate.' : 'Direct student and faculty inquiries will appear here.'}
          </p>
          <button onclick="Messaging.openNewMessageModal()" class="w-full py-2.5 px-3 bg-indigo-900 hover:bg-indigo-800 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center justify-center gap-1.5">
            <i data-lucide="plus" class="w-3.5 h-3.5"></i>
            <span>Start Direct Message</span>
          </button>
        </div>
      `;
    }

    return displayList.map(c => {
      const isActive = this.activeType === 'direct' && this.activePartnerId === c.partnerId;
      return `
        <div onclick="Messaging.openChat('${c.partnerId}', '${c.classId || ''}')" 
          class="p-3 rounded-2xl cursor-pointer transition flex items-start gap-3 ${isActive ? 'bg-indigo-100/80 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 shadow-xs' : 'hover:bg-white dark:hover:bg-slate-800/60 border border-transparent'}">
          <div class="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-lg flex-shrink-0 relative shadow-xs">
            ${c.partnerAvatar || '👤'}
            ${c.hasUnread ? '<span class="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-white"></span>' : ''}
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between">
              <h5 class="text-xs font-bold text-slate-800 dark:text-slate-100 truncate ${c.hasUnread ? 'text-indigo-950 font-black' : ''}">${c.partnerName}</h5>
              <span class="text-[10px] text-slate-400">${new Date(c.lastMessageAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
            </div>
            <div class="flex items-center gap-1.5 mt-0.5">
              <span class="text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${c.partnerRole === 'teacher' ? 'badge-role-teacher' : c.partnerRole === 'student' ? 'badge-role-student' : 'badge-role-admin'}">${c.partnerRole}</span>
              ${c.classCode ? `<span class="text-[10px] font-bold text-indigo-800 dark:text-indigo-300 truncate">${c.classCode}</span>` : ''}
            </div>
            <p class="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-1">${c.lastMessage || 'Direct message'}</p>
          </div>
        </div>
      `;
    }).join('');
  },

  render() {
    const container = document.getElementById('messaging-view-area');
    if (!container) return;
    const user = API.getCurrentUser();

    // If shell already exists, update only the left sidebar
    const listEl = document.getElementById('messaging-items-list');
    if (listEl) {
      this.updateSidebarList();
      this.updateUnreadCount();
      return;
    }

    container.innerHTML = `
      <div class="nexus-card overflow-hidden h-[78vh] flex flex-col md:flex-row shadow-sm border border-slate-200 dark:border-slate-800">
        <!-- Left: Section Groups & Direct Messages Sidebar -->
        <div class="w-full md:w-80 border-r border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 flex flex-col h-full flex-shrink-0">
          
          <!-- Top Header -->
          <div class="p-3.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 class="text-sm font-bold text-slate-800 dark:text-slate-100">Discussion & Messages</h3>
              <p class="text-[11px] text-slate-400">Class Section Groups & Chat</p>
            </div>
            <button onclick="Messaging.openNewMessageModal()" title="Start New Direct Chat" 
              class="px-2.5 py-1.5 text-indigo-900 dark:text-indigo-200 bg-indigo-50 dark:bg-indigo-950 hover:bg-indigo-100 rounded-xl transition flex items-center gap-1 text-xs font-bold border border-indigo-100 dark:border-indigo-800">
              <i data-lucide="edit" class="w-3.5 h-3.5"></i>
              <span>Direct</span>
            </button>
          </div>

          <!-- Switcher Tabs: Section Groups vs Direct Chats -->
          <div class="p-2 bg-slate-100/80 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1">
            <button id="tab-btn-groups" onclick="Messaging.switchSidebarTab('groups')" 
              class="flex-1 py-2 text-xs font-bold rounded-xl transition ${this.sidebarTab === 'groups' ? 'bg-white dark:bg-slate-800 text-indigo-900 dark:text-indigo-300 shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}">
              👥 Section Groups (${this.sectionGroups.length})
            </button>
            <button id="tab-btn-direct" onclick="Messaging.switchSidebarTab('direct')" 
              class="flex-1 py-2 text-xs font-semibold rounded-xl transition ${this.sidebarTab === 'direct' ? 'bg-white dark:bg-slate-800 text-indigo-900 dark:text-indigo-300 shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}">
              💬 Direct Chats (${this.conversations.length})
            </button>
          </div>

          <!-- Items List Container -->
          <div id="messaging-items-list" class="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 p-2 space-y-1">
            ${this.sidebarTab === 'groups' ? this.renderSectionGroupsListHtml() : this.renderConversationsListHtml()}
          </div>
        </div>

        <!-- Right: Active Chat Area -->
        <div id="active-chat-container" class="flex-1 flex flex-col bg-white dark:bg-slate-900 h-full min-w-0">
          <div class="flex-1 flex items-center justify-center p-8 text-center text-slate-400">
            <div>
              <div class="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3 text-2xl">
                👥
              </div>
              <p class="text-sm font-semibold text-slate-700 dark:text-slate-200">Loading Section Group / Conversation...</p>
              <p class="text-xs text-slate-400 mt-1">Select a section group or person from the left panel.</p>
            </div>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
    this.updateUnreadCount();
  },

  // Helper: Render individual message bubble (for both Group and Direct chats)
  renderMessageBubble(m, currentUser, isGroup = false) {
    const isMe = m.senderId === currentUser.id;
    const isTeacher = m.senderRole === 'teacher';

    return `
      <div class="flex flex-col ${isMe ? 'items-end' : 'items-start'}">
        <!-- Sender Header for Group or Direct Messages -->
        ${isGroup ? `
          <div class="flex items-center gap-1.5 text-[11px] mb-1 px-1">
            <span class="text-xs">${m.senderAvatar || (isTeacher ? '👨‍🏫' : '👨‍🎓')}</span>
            <span class="font-bold text-slate-800 dark:text-slate-200">${isMe ? 'You (আপনি)' : m.senderName}</span>
            <span class="px-1.5 py-0.2 rounded text-[9px] font-black uppercase ${isTeacher ? 'bg-amber-100 text-amber-900 border border-amber-200' : 'bg-indigo-100 text-indigo-900 border border-indigo-200'}">
              ${isTeacher ? 'Teacher' : 'Student'}
            </span>
            ${m.senderBatch && !isTeacher ? `<span class="text-[10px] text-slate-400">(${m.senderBatch})</span>` : ''}
          </div>
        ` : (m.subject ? `
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-1">
            Subject: ${m.subject}
          </span>
        ` : '')}
        
        <div class="max-w-[85%] sm:max-w-[70%] p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${isMe ? 'chat-bubble-me shadow-sm' : 'chat-bubble-other border border-slate-200 dark:border-slate-800'}">
          ${m.content ? `<p class="whitespace-pre-wrap">${m.content}</p>` : ''}
          
          <!-- PHOTO OR PDF ATTACHMENT RENDERING -->
          ${m.attachmentUrl ? `
            <div class="mt-2.5 pt-2 border-t ${isMe ? 'border-white/20' : 'border-slate-200 dark:border-slate-700'}">
              ${m.attachmentType === 'image' ? `
                <div class="rounded-xl overflow-hidden border border-black/10 bg-black/5 max-w-sm shadow-xs">
                  <img src="${m.attachmentUrl}" alt="${m.attachmentName || 'Photo Attachment'}" 
                    onclick="Messaging.previewImageModal('${m.attachmentUrl}', '${(m.attachmentName || 'Photo Attachment').replace(/'/g, "\\'")}')"
                    class="max-h-60 w-full object-cover cursor-pointer hover:opacity-95 transition">
                  <div class="p-2 flex items-center justify-between text-[11px] ${isMe ? 'text-white/90' : 'text-slate-700 dark:text-slate-300'}">
                    <span class="truncate font-medium flex items-center gap-1">
                      <span>📸</span>
                      <span class="truncate">${m.attachmentName || 'Photo'}</span>
                    </span>
                    <a href="${m.attachmentUrl}" download="${m.attachmentName || 'Photo'}" class="p-1 hover:underline flex items-center gap-1 font-bold" title="Save Photo">
                      <i data-lucide="download" class="w-3.5 h-3.5"></i>
                      <span>Save</span>
                    </a>
                  </div>
                </div>
              ` : `
                <a href="${m.attachmentUrl}" target="_blank" download="${m.attachmentName || 'Document.pdf'}" 
                  class="flex items-center gap-3 p-2.5 rounded-xl ${isMe ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200'} transition border border-black/5 shadow-xs">
                  <div class="w-9 h-9 rounded-lg bg-rose-600 text-white flex items-center justify-center flex-shrink-0 font-bold text-xs shadow-xs">
                    <i data-lucide="file-text" class="w-5 h-5"></i>
                  </div>
                  <div class="flex-1 min-w-0 text-left">
                    <span class="text-xs font-bold block truncate">${m.attachmentName || 'PDF Document'}</span>
                    <span class="text-[10px] opacity-80">${m.attachmentSize || 'PDF Document • Click to Download'}</span>
                  </div>
                  <i data-lucide="download" class="w-4 h-4 flex-shrink-0"></i>
                </a>
              `}
            </div>
          ` : ''}
        </div>

        <span class="text-[10px] text-slate-400 mt-1 px-1">
          ${new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    `;
  },

  renderGroupMessagesListInnerHtml(messages, currentUser) {
    if (messages.length === 0) {
      return `
        <div class="text-center py-2 mb-2">
          <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-900 dark:text-indigo-300 text-[11px] font-semibold border border-indigo-200 dark:border-indigo-800">
            <span>🔒 Official Section Discussion Group</span>
            <span>•</span>
            <span>Only teacher and enrolled students can view or chat</span>
          </div>
        </div>
        <div class="text-center py-16 text-slate-400 text-xs">
          <div class="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-2 text-xl">
            💬
          </div>
          <p class="font-bold text-slate-700 dark:text-slate-200 text-sm">No group messages yet</p>
          <p class="text-slate-400 text-xs mt-1">Start the discussion, ask homework questions, or share photos/notes with everyone in this section.</p>
        </div>
      `;
    }

    return `
      <div class="text-center py-2 mb-2">
        <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-900 dark:text-indigo-300 text-[11px] font-semibold border border-indigo-200 dark:border-indigo-800">
          <span>🔒 Official Section Discussion Group</span>
          <span>•</span>
          <span>Only teacher and enrolled students can view or chat</span>
        </div>
      </div>
      ${messages.map(m => this.renderMessageBubble(m, currentUser, true)).join('')}
    `;
  },

  renderDirectMessagesListInnerHtml(messages, currentUser, partner) {
    if (messages.length === 0) {
      return `
        <div class="text-center py-16 text-slate-400 text-xs">
          <div class="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-2">
            <i data-lucide="message-square" class="w-6 h-6"></i>
          </div>
          <p class="font-bold text-slate-600 dark:text-slate-300">No previous direct messages with ${partner.name}.</p>
          <p class="text-slate-400 text-[11px] mt-1">Type your inquiry, ask a problem, or share a photo/PDF below.</p>
        </div>
      `;
    }

    return messages.map(m => this.renderMessageBubble(m, currentUser, false)).join('');
  },

  // 1. SECTION GROUP CHAT (Teacher + All Enrolled Students)
  async loadGroupMessages(classId, isInitialLoad = false) {
    const chatContainer = document.getElementById('active-chat-container');
    if (!chatContainer) return;
    const currentUser = API.getCurrentUser();
    const viewKey = `group_${classId}`;

    try {
      const { group, messages } = await API.getSectionGroupMessages(classId);
      this.activeGroupData = group;

      const currentMsgCount = messages.length;
      const lastMsg = messages.length > 0 ? messages[messages.length - 1] : null;
      const lastMsgId = lastMsg ? (lastMsg.id || lastMsg.createdAt) : null;

      // Smart Polling Update: If already mounted, only update message history list.
      // This PREVENTS resetting user's typed long message, textarea focus, or attached photo!
      const scrollEl = document.getElementById('messages-list-scroll');
      const isAlreadyRendered = (this.currentViewKey === viewKey && scrollEl);

      if (isAlreadyRendered && !isInitialLoad) {
        if (this.lastGroupMsgCount !== currentMsgCount || this.lastGroupLastId !== lastMsgId) {
          this.lastGroupMsgCount = currentMsgCount;
          this.lastGroupLastId = lastMsgId;
          const wasAtBottom = (scrollEl.scrollHeight - scrollEl.scrollTop - scrollEl.clientHeight < 80);
          scrollEl.innerHTML = this.renderGroupMessagesListInnerHtml(messages, currentUser);
          if (window.lucide) window.lucide.createIcons();
          if (wasAtBottom) {
            scrollEl.scrollTop = scrollEl.scrollHeight;
          }
        }
        return;
      }

      // Full View Render
      this.currentViewKey = viewKey;
      this.lastGroupMsgCount = currentMsgCount;
      this.lastGroupLastId = lastMsgId;

      chatContainer.innerHTML = `
        <!-- Active Group Chat Header -->
        <div class="p-3.5 sm:p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 z-10 shadow-xs">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-700 to-indigo-950 text-white flex items-center justify-center text-lg shadow-xs flex-shrink-0">
              👥
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <h4 class="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">${group.code} - ${group.title}</h4>
                <span class="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-900 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  Section: ${group.section || 'Regular'}
                </span>
              </div>
              <p class="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                👨‍🏫 ${group.teacherName} (${group.teacherSubject || 'Faculty'}) • <span class="font-bold text-indigo-700 dark:text-indigo-400">${group.memberCount} Members</span>
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2 flex-shrink-0">
            <button onclick="Messaging.openGroupMembersModal('${group.classId}')" 
              class="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 dark:hover:bg-indigo-900 text-indigo-900 dark:text-indigo-200 text-xs font-bold transition flex items-center gap-1.5 border border-indigo-200 dark:border-indigo-800 shadow-xs">
              <i data-lucide="users" class="w-3.5 h-3.5"></i>
              <span class="hidden sm:inline">Group</span> Members (${group.memberCount})
            </button>
          </div>
        </div>

        <!-- Section Group Message History List -->
        <div id="messages-list-scroll" class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/60 dark:bg-slate-950/40">
          ${this.renderGroupMessagesListInnerHtml(messages, currentUser)}
        </div>

        <!-- Rich Attachment / Photo Preview Bar -->
        <div id="attachment-preview-bar" class="hidden px-4 py-2.5 bg-indigo-50/90 dark:bg-indigo-950/80 border-t border-indigo-100 dark:border-indigo-800 flex items-center justify-between text-xs text-indigo-900 dark:text-indigo-200">
          <div class="flex items-center gap-3 min-w-0">
            <div id="attachment-preview-thumb-box" class="hidden w-11 h-11 rounded-lg overflow-hidden border border-indigo-200 dark:border-indigo-700 bg-white dark:bg-slate-800 flex-shrink-0 shadow-xs">
              <img id="attachment-preview-thumb" src="" alt="Photo Preview" class="w-full h-full object-cover">
            </div>
            <div id="attachment-preview-file-icon" class="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 flex items-center justify-center flex-shrink-0">
              <i data-lucide="paperclip" class="w-5 h-5"></i>
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-1.5">
                <span id="attachment-type-badge" class="px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase bg-emerald-100 text-emerald-900 border border-emerald-200">
                  Photo
                </span>
                <span class="font-bold truncate text-xs" id="attachment-preview-name">file_name.jpg</span>
              </div>
              <span class="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block" id="attachment-preview-size">120 KB</span>
            </div>
          </div>
          <button type="button" onclick="Messaging.clearAttachment()" class="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition" title="Remove attachment">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>

        <!-- Message Input Box with Multi-Line Textarea & Photo Share Option -->
        <div class="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <form onsubmit="Messaging.submitGroupMessage(event, '${classId}')" class="flex flex-col gap-2">
            <!-- Hidden File Inputs -->
            <input type="file" id="chat-photo-input" accept="image/*" class="hidden" onchange="Messaging.handleAttachmentSelect(this, 'image')">
            <input type="file" id="chat-file-input" accept=".pdf,image/*" class="hidden" onchange="Messaging.handleAttachmentSelect(this, 'file')">
            
            <div class="flex items-end gap-2">
              <!-- Dedicated Photo Share Button -->
              <button type="button" onclick="Messaging.openPhotoPicker()" 
                class="px-3 py-2.5 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/70 rounded-xl transition border border-indigo-200 dark:border-indigo-800 flex items-center gap-1.5 text-xs font-bold flex-shrink-0 bg-white dark:bg-slate-800 shadow-xs" 
                title="Share Photo / Image (ছবি বা স্ক্রিনশট শেয়ার করুন)">
                <i data-lucide="image" class="w-4 h-4 text-indigo-600 dark:text-indigo-400"></i>
                <span class="hidden sm:inline">Photo</span>
              </button>

              <!-- Document / File Button -->
              <button type="button" onclick="Messaging.openFilePicker()" 
                class="p-2.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition border border-slate-200 dark:border-slate-700 flex-shrink-0 bg-white dark:bg-slate-800" 
                title="Attach PDF or Document (ডকুমেন্ট যুক্ত করুন)">
                <i data-lucide="paperclip" class="w-4 h-4"></i>
              </button>

              <!-- Multi-line Auto-expanding Textarea for Long Messages -->
              <div class="flex-1 relative">
                <textarea id="chat-input-field" rows="1"
                  placeholder="Message ${group.code} (${group.section}) section group... (Shift+Enter for newline)"
                  autocomplete="off"
                  oninput="Messaging.autoExpandTextarea(this)"
                  onkeydown="Messaging.handleChatKeydown(event, 'group', '${classId}')"
                  onpaste="Messaging.handlePaste(event)"
                  class="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-indigo-600 focus:outline-none bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 resize-none max-h-36 min-h-[42px] leading-relaxed"></textarea>
              </div>

              <!-- Send Button -->
              <button type="submit" id="btn-chat-send" class="px-5 py-2.5 bg-indigo-900 hover:bg-indigo-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm flex-shrink-0 self-end">
                <span>Send</span>
                <i data-lucide="send" class="w-3.5 h-3.5"></i>
              </button>
            </div>

            <!-- Helpful Typing & Photo Shortcut Tip -->
            <div class="flex items-center justify-between text-[10px] text-slate-400 px-1 pt-0.5">
              <span>💡 <strong>Enter</strong> to send • <strong>Shift + Enter</strong> for newline • <strong>Ctrl + V</strong> to paste photo</span>
              <span class="text-indigo-600 dark:text-indigo-400 font-semibold">🔒 Enrolled Only</span>
            </div>
          </form>
        </div>
      `;

      if (window.lucide) window.lucide.createIcons();

      const scrollElNew = document.getElementById('messages-list-scroll');
      if (scrollElNew) scrollElNew.scrollTop = scrollElNew.scrollHeight;

      const chatInput = document.getElementById('chat-input-field');
      if (chatInput) chatInput.focus();
    } catch (err) {
      if (err.message && (err.message.includes('not enrolled') || err.message.includes('Access denied') || err.message.includes('403'))) {
        await this.loadSectionGroups();
        this.updateSidebarList();
        chatContainer.innerHTML = `
          <div class="p-8 text-center text-rose-600 dark:text-rose-400 text-sm">
            <div class="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/70 text-rose-600 flex items-center justify-center mx-auto mb-3 text-2xl">
              🚫
            </div>
            <p class="font-bold text-base">You are no longer in this course section group</p>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              (আপনাকে এই কোর্স সেকশন থেকে রিমুভ করা হয়েছে। আপনি আর এই সেকশন গ্রুপে কোনো মেসেজ দেখতে বা পাঠাতে পারবেন না।)
            </p>
          </div>
        `;
        if (this.activeGroupId === classId) {
          this.activeGroupId = this.sectionGroups.length > 0 ? this.sectionGroups[0].id : null;
        }
        return;
      }

      chatContainer.innerHTML = `
        <div class="p-8 text-center text-rose-600 text-sm">
          <p class="font-bold">Failed to load section group discussion:</p>
          <p class="text-xs text-slate-500 mt-1">${err.message}</p>
        </div>
      `;
    }
  },

  async submitGroupMessage(event, classId) {
    if (event && event.preventDefault) event.preventDefault();
    const input = document.getElementById('chat-input-field');
    const content = input ? input.value.trim() : '';
    const file = this.selectedAttachmentFile;

    if (!content && !file) {
      showToast('Please type a message or select a photo/file to attach', 'error');
      return;
    }

    const sendBtn = document.getElementById('btn-chat-send');
    if (sendBtn) {
      sendBtn.disabled = true;
      sendBtn.innerHTML = 'Sending...';
    }

    try {
      await API.sendSectionGroupMessage(classId, content, file);
      if (input) {
        input.value = '';
        input.style.height = '42px';
      }
      this.clearAttachment();
      await this.loadGroupMessages(classId, true);
      await this.loadSectionGroups();
      this.updateSidebarList();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      if (sendBtn) {
        sendBtn.disabled = false;
        sendBtn.innerHTML = `<span>Send</span> <i data-lucide="send" class="w-3.5 h-3.5"></i>`;
        if (window.lucide) window.lucide.createIcons();
      }
    }
  },

  // 2. DIRECT MESSAGING (1-on-1 Student <-> Teacher / Classmate)
  async loadMessages(partnerId, classId = null, isInitialLoad = false) {
    const chatContainer = document.getElementById('active-chat-container');
    if (!chatContainer) return;
    const currentUser = API.getCurrentUser();
    const viewKey = `direct_${partnerId}_${classId || ''}`;

    try {
      const { partner, messages } = await API.getMessages(partnerId, classId);
      this.activePartnerData = partner;

      const currentMsgCount = messages.length;
      const lastMsg = messages.length > 0 ? messages[messages.length - 1] : null;
      const lastMsgId = lastMsg ? (lastMsg.id || lastMsg.createdAt) : null;

      // Smart Polling Update: If already mounted, only update message history list.
      // This PREVENTS resetting user's typed long message, textarea focus, or attached photo!
      const scrollEl = document.getElementById('messages-list-scroll');
      const isAlreadyRendered = (this.currentViewKey === viewKey && scrollEl);

      if (isAlreadyRendered && !isInitialLoad) {
        if (this.lastDirectMsgCount !== currentMsgCount || this.lastDirectLastId !== lastMsgId) {
          this.lastDirectMsgCount = currentMsgCount;
          this.lastDirectLastId = lastMsgId;
          const wasAtBottom = (scrollEl.scrollHeight - scrollEl.scrollTop - scrollEl.clientHeight < 80);
          scrollEl.innerHTML = this.renderDirectMessagesListInnerHtml(messages, currentUser, partner);
          if (window.lucide) window.lucide.createIcons();
          if (wasAtBottom) {
            scrollEl.scrollTop = scrollEl.scrollHeight;
          }
        }
        return;
      }

      // Full View Render
      this.currentViewKey = viewKey;
      this.lastDirectMsgCount = currentMsgCount;
      this.lastDirectLastId = lastMsgId;

      chatContainer.innerHTML = `
        <!-- Active Chat Header -->
        <div class="p-3.5 sm:p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 z-10 shadow-xs">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 border border-indigo-100 dark:border-indigo-800 flex items-center justify-center text-xl shadow-xs">
              ${partner.avatar || '👤'}
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h4 class="text-sm font-bold text-slate-800 dark:text-slate-100">${partner.name}</h4>
                <span class="text-[9px] font-bold px-2 py-0.5 rounded uppercase ${partner.role === 'teacher' ? 'badge-role-teacher' : partner.role === 'student' ? 'badge-role-student' : 'badge-role-admin'}">
                  ${partner.role}
                </span>
              </div>
              <p class="text-xs text-slate-400">${partner.subject ? `${partner.subject} Faculty` : (partner.designation || partner.batch || partner.email)}</p>
            </div>
          </div>

          <div class="text-right flex items-center gap-2">
            <span class="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-lg flex items-center gap-1">
              <span>📸</span>
              <span>Photo & PDF Sharing</span>
            </span>
          </div>
        </div>

        <!-- Message History List -->
        <div id="messages-list-scroll" class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/60 dark:bg-slate-950/40">
          ${this.renderDirectMessagesListInnerHtml(messages, currentUser, partner)}
        </div>

        <!-- Rich Attachment / Photo Preview Bar -->
        <div id="attachment-preview-bar" class="hidden px-4 py-2.5 bg-indigo-50/90 dark:bg-indigo-950/80 border-t border-indigo-100 dark:border-indigo-800 flex items-center justify-between text-xs text-indigo-900 dark:text-indigo-200">
          <div class="flex items-center gap-3 min-w-0">
            <div id="attachment-preview-thumb-box" class="hidden w-11 h-11 rounded-lg overflow-hidden border border-indigo-200 dark:border-indigo-700 bg-white dark:bg-slate-800 flex-shrink-0 shadow-xs">
              <img id="attachment-preview-thumb" src="" alt="Photo Preview" class="w-full h-full object-cover">
            </div>
            <div id="attachment-preview-file-icon" class="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 flex items-center justify-center flex-shrink-0">
              <i data-lucide="paperclip" class="w-5 h-5"></i>
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-1.5">
                <span id="attachment-type-badge" class="px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase bg-emerald-100 text-emerald-900 border border-emerald-200">
                  Photo
                </span>
                <span class="font-bold truncate text-xs" id="attachment-preview-name">file_name.jpg</span>
              </div>
              <span class="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block" id="attachment-preview-size">120 KB</span>
            </div>
          </div>
          <button type="button" onclick="Messaging.clearAttachment()" class="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition" title="Remove attachment">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>

        <!-- Message Input Box with Multi-Line Textarea & Photo Share Option -->
        <div class="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <form onsubmit="Messaging.submitMessage(event, '${partner.id}', '${classId || ''}')" class="flex flex-col gap-2">
            <!-- Hidden File Inputs -->
            <input type="file" id="chat-photo-input" accept="image/*" class="hidden" onchange="Messaging.handleAttachmentSelect(this, 'image')">
            <input type="file" id="chat-file-input" accept=".pdf,image/*" class="hidden" onchange="Messaging.handleAttachmentSelect(this, 'file')">
            
            <div class="flex items-end gap-2">
              <!-- Dedicated Photo Share Button -->
              <button type="button" onclick="Messaging.openPhotoPicker()" 
                class="px-3 py-2.5 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/70 rounded-xl transition border border-indigo-200 dark:border-indigo-800 flex items-center gap-1.5 text-xs font-bold flex-shrink-0 bg-white dark:bg-slate-800 shadow-xs" 
                title="Share Photo / Image (ছবি বা স্ক্রিনশট শেয়ার করুন)">
                <i data-lucide="image" class="w-4 h-4 text-indigo-600 dark:text-indigo-400"></i>
                <span class="hidden sm:inline">Photo</span>
              </button>

              <!-- Document / File Button -->
              <button type="button" onclick="Messaging.openFilePicker()" 
                class="p-2.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition border border-slate-200 dark:border-slate-700 flex-shrink-0 bg-white dark:bg-slate-800" 
                title="Attach PDF or Document (ডকুমেন্ট যুক্ত করুন)">
                <i data-lucide="paperclip" class="w-4 h-4"></i>
              </button>

              <!-- Multi-line Auto-expanding Textarea for Long Messages -->
              <div class="flex-1 relative">
                <textarea id="chat-input-field" rows="1"
                  placeholder="Type your message to ${partner.name}... (Shift+Enter for newline)"
                  autocomplete="off"
                  oninput="Messaging.autoExpandTextarea(this)"
                  onkeydown="Messaging.handleChatKeydown(event, 'direct', '${partner.id}')"
                  onpaste="Messaging.handlePaste(event)"
                  class="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-indigo-600 focus:outline-none bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 resize-none max-h-36 min-h-[42px] leading-relaxed"></textarea>
              </div>

              <!-- Send Button -->
              <button type="submit" id="btn-chat-send" class="px-5 py-2.5 bg-indigo-900 hover:bg-indigo-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm flex-shrink-0 self-end">
                <span>Send</span>
                <i data-lucide="send" class="w-3.5 h-3.5"></i>
              </button>
            </div>

            <!-- Helpful Typing & Photo Shortcut Tip -->
            <div class="flex items-center justify-between text-[10px] text-slate-400 px-1 pt-0.5">
              <span>💡 <strong>Enter</strong> to send • <strong>Shift + Enter</strong> for newline • <strong>Ctrl + V</strong> to paste photo</span>
              <span class="text-indigo-600 dark:text-indigo-400 font-semibold">🔒 End-to-End Private</span>
            </div>
          </form>
        </div>
      `;

      if (window.lucide) window.lucide.createIcons();

      const scrollElNew = document.getElementById('messages-list-scroll');
      if (scrollElNew) scrollElNew.scrollTop = scrollElNew.scrollHeight;

      const chatInput = document.getElementById('chat-input-field');
      if (chatInput) chatInput.focus();
    } catch (err) {
      chatContainer.innerHTML = `
        <div class="p-8 text-center text-rose-600 text-sm">
          <p class="font-bold">Failed to load message thread:</p>
          <p class="text-xs text-slate-500 mt-1">${err.message}</p>
        </div>
      `;
    }
  },

  // Keyboard shortcut handler for multi-line textarea
  handleChatKeydown(event, type, targetId) {
    if (event.key === 'Enter') {
      if (event.shiftKey) {
        // Shift + Enter: Allow natural newline and auto-expand height
        setTimeout(() => this.autoExpandTextarea(event.target), 10);
      } else {
        // Enter without Shift: Submit message immediately
        event.preventDefault();
        if (type === 'group') {
          this.submitGroupMessage(event, targetId);
        } else {
          this.submitMessage(event, targetId, this.activeClassId);
        }
      }
    }
  },

  // Auto-expand textarea height as user types long messages
  autoExpandTextarea(el) {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 140) + 'px';
  },

  // Clipboard Paste (Ctrl+V) handler for instant photo sharing
  handlePaste(event) {
    const items = (event.clipboardData || window.clipboardData)?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          event.preventDefault();
          this.setAttachmentFile(file, 'image');
          showToast('📸 Photo attached from clipboard! (ক্লিপবোর্ড থেকে ছবি যুক্ত করা হয়েছে)', 'success');
          break;
        }
      }
    }
  },

  openPhotoPicker() {
    const input = document.getElementById('chat-photo-input');
    if (input) {
      input.value = '';
      input.click();
    }
  },

  openFilePicker() {
    const input = document.getElementById('chat-file-input');
    if (input) {
      input.value = '';
      input.click();
    }
  },

  handleAttachmentSelect(input, forcedType = null) {
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    const isImage = file.type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].some(ext => file.name.toLowerCase().endsWith('.' + ext));
    this.setAttachmentFile(file, forcedType || (isImage ? 'image' : 'file'));
  },

  setAttachmentFile(file, type = 'file') {
    if (!file) return;
    this.selectedAttachmentFile = file;
    const isImage = file.type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].some(ext => file.name.toLowerCase().endsWith('.' + ext));
    this.selectedAttachmentType = isImage ? 'image' : 'file';

    const previewBar = document.getElementById('attachment-preview-bar');
    const nameEl = document.getElementById('attachment-preview-name');
    const sizeEl = document.getElementById('attachment-preview-size');
    const badgeEl = document.getElementById('attachment-type-badge');
    const thumbBox = document.getElementById('attachment-preview-thumb-box');
    const thumbImg = document.getElementById('attachment-preview-thumb');
    const fileIcon = document.getElementById('attachment-preview-file-icon');

    if (previewBar) {
      if (nameEl) nameEl.innerText = file.name;
      const bytes = file.size;
      const sizeStr = bytes >= 1024 * 1024 
        ? `${(bytes / (1024 * 1024)).toFixed(2)} MB` 
        : `${Math.round(bytes / 1024)} KB`;
      if (sizeEl) sizeEl.innerText = sizeStr;

      if (badgeEl) {
        badgeEl.innerText = isImage ? '📸 Photo' : '📄 File';
        badgeEl.className = isImage 
          ? 'px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase bg-emerald-100 text-emerald-900 border border-emerald-200' 
          : 'px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase bg-indigo-100 text-indigo-900 border border-indigo-200';
      }

      if (isImage && thumbBox && thumbImg) {
        const reader = new FileReader();
        reader.onload = (e) => {
          thumbImg.src = e.target.result;
          thumbBox.classList.remove('hidden');
          if (fileIcon) fileIcon.classList.add('hidden');
        };
        reader.readAsDataURL(file);
      } else {
        if (thumbBox) thumbBox.classList.add('hidden');
        if (fileIcon) fileIcon.classList.remove('hidden');
      }

      previewBar.classList.remove('hidden');
    }
    if (window.lucide) window.lucide.createIcons();
  },

  clearAttachment() {
    this.selectedAttachmentFile = null;
    this.selectedAttachmentType = null;
    const photoInput = document.getElementById('chat-photo-input');
    if (photoInput) photoInput.value = '';
    const fileInput = document.getElementById('chat-file-input');
    if (fileInput) fileInput.value = '';
    const previewBar = document.getElementById('attachment-preview-bar');
    if (previewBar) previewBar.classList.add('hidden');
    const thumbBox = document.getElementById('attachment-preview-thumb-box');
    if (thumbBox) thumbBox.classList.add('hidden');
  },

  async submitMessage(event, receiverId, classId) {
    if (event && event.preventDefault) event.preventDefault();
    const input = document.getElementById('chat-input-field');
    const content = input ? input.value.trim() : '';
    const file = this.selectedAttachmentFile;

    if (!content && !file) {
      showToast('Please type a message or select a photo/file to attach', 'error');
      return;
    }

    const sendBtn = document.getElementById('btn-chat-send');
    if (sendBtn) {
      sendBtn.disabled = true;
      sendBtn.innerHTML = 'Sending...';
    }

    try {
      await API.sendMessage(receiverId, content, '', classId || null, file);
      if (input) {
        input.value = '';
        input.style.height = '42px';
      }
      this.clearAttachment();
      await this.loadMessages(receiverId, classId, true);
      await this.loadConversations();
      this.updateSidebarList();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      if (sendBtn) {
        sendBtn.disabled = false;
        sendBtn.innerHTML = `<span>Send</span> <i data-lucide="send" class="w-3.5 h-3.5"></i>`;
        if (window.lucide) window.lucide.createIcons();
      }
    }
  },

  // Modal: View Group Members (Teacher & Students)
  openGroupMembersModal(classId) {
    const group = this.activeGroupData;
    if (!group) return;

    App.showModal(`
      <div class="p-6">
        <div class="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
          <div class="flex items-center gap-2.5">
            <div class="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-900 dark:text-indigo-300 flex items-center justify-center font-bold text-xl">
              👥
            </div>
            <div>
              <h3 class="text-lg font-bold text-slate-900 dark:text-slate-100">${group.code} (${group.section || 'Regular'}) Members</h3>
              <p class="text-xs text-slate-500 dark:text-slate-400">${group.memberCount} Total Enrolled Members (Teacher & Students)</p>
            </div>
          </div>
          <button onclick="App.closeModal()" class="text-slate-400 hover:text-slate-600">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <div class="space-y-3 max-h-[380px] overflow-y-auto pr-1">
          ${group.members.map(m => `
            <div class="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-3">
              <div class="flex items-center gap-3 min-w-0">
                <span class="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-lg flex-shrink-0">
                  ${m.avatar || (m.role === 'teacher' ? '👨‍🏫' : '👨‍🎓')}
                </span>
                <div class="min-w-0">
                  <div class="flex items-center gap-1.5">
                    <strong class="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">${m.name}</strong>
                    <span class="px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase ${m.role === 'teacher' ? 'bg-amber-100 text-amber-900' : 'bg-indigo-100 text-indigo-900'}">
                      ${m.role}
                    </span>
                  </div>
                  <span class="text-[11px] text-slate-400 block truncate">${m.id} • ${m.info || ''}</span>
                </div>
              </div>

              ${m.id !== API.getCurrentUser().id ? `
                <button onclick="App.closeModal(); Messaging.openChat('${m.id}', '${group.classId}')" 
                  class="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 text-slate-600 dark:text-slate-300 hover:text-indigo-900 text-xs font-bold transition flex items-center gap-1 border border-slate-200 dark:border-slate-700 flex-shrink-0">
                  <i data-lucide="message-square" class="w-3.5 h-3.5"></i>
                  <span>Direct Chat</span>
                </button>
              ` : `
                <span class="text-[11px] font-bold text-emerald-600">You</span>
              `}
            </div>
          `).join('')}
        </div>
      </div>
    `);
    if (window.lucide) window.lucide.createIcons();
  },

  // Modal: Start New Direct Message or Group Broadcast
  openNewMessageModal() {
    const user = API.getCurrentUser();
    const isTeacher = user.role === 'teacher';
    const isStudent = user.role === 'student';

    let optionsHtml = '';

    if (isTeacher) {
      // 1. Group Broadcast option for teacher
      if (this.sectionGroups && this.sectionGroups.length > 0) {
        optionsHtml += `
          <optgroup label="📢 Section Broadcast (কোর্স সেকশনের সকল শিক্ষার্থী)">
            ${this.sectionGroups.map(g => `
              <option value="GROUP:${g.id}">📢 [${g.code} - ${g.section}] Broadcast to All ${g.memberCount} Members</option>
            `).join('')}
          </optgroup>
        `;
      }

      // 2. Enrolled Students
      const enrolledStudents = (this.contacts || []).filter(c => c.role === 'student');
      if (enrolledStudents.length > 0) {
        optionsHtml += `
          <optgroup label="👨‍🎓 Enrolled Students (আপনার এনরোল্ড সকল শিক্ষার্থী - ${enrolledStudents.length} জন)">
            ${enrolledStudents.map(s => {
              const classStr = (s.classes && s.classes.length > 0) ? ` • [${s.classes.map(c => `${c.code} ${c.section || ''}`).join(', ')}]` : '';
              return `
                <option value="${s.id}">
                  👨‍🎓 ${s.name} (${s.id})${classStr}
                </option>
              `;
            }).join('')}
          </optgroup>
        `;
      }

      // 3. Fellow Teachers & Admins
      const others = (this.contacts || []).filter(c => c.role !== 'student');
      if (others.length > 0) {
        optionsHtml += `
          <optgroup label="👨‍🏫 Faculty Colleagues & Administration">
            ${others.map(c => `
              <option value="${c.id}">
                ${c.role === 'teacher' ? '👨‍🏫' : '🛡️'} ${c.name} (${c.role.toUpperCase()}${c.subject ? ' - ' + c.subject : ''})
              </option>
            `).join('')}
          </optgroup>
        `;
      }
    } else if (isStudent) {
      // 1. Enrolled Teachers
      const teachers = (this.contacts || []).filter(c => c.role === 'teacher');
      if (teachers.length > 0) {
        optionsHtml += `
          <optgroup label="👨‍🏫 Enrolled Course Teachers (আপনার কোর্সের শিক্ষকবৃন্দ - ${teachers.length} জন)">
            ${teachers.map(t => {
              const classStr = (t.classes && t.classes.length > 0) ? ` • [${t.classes.map(c => c.code).join(', ')}]` : '';
              return `
                <option value="${t.id}">
                  👨‍🏫 ${t.name} (${t.subject || 'Faculty Lead'})${classStr}
                </option>
              `;
            }).join('')}
          </optgroup>
        `;
      }

      // 2. Section Groups
      if (this.sectionGroups && this.sectionGroups.length > 0) {
        optionsHtml += `
          <optgroup label="👥 Section Discussion Groups (কোর্স সেকশন গ্রুপ)">
            ${this.sectionGroups.map(g => `
              <option value="GROUP:${g.id}">👥 [${g.code} - ${g.section}] ${g.title} (${g.memberCount} Members)</option>
            `).join('')}
          </optgroup>
        `;
      }

      // 3. Classmates
      const classmates = (this.contacts || []).filter(c => c.role === 'student');
      if (classmates.length > 0) {
        optionsHtml += `
          <optgroup label="👨‍🎓 Enrolled Classmates (সহপাঠীগণ - ${classmates.length} জন)">
            ${classmates.map(s => {
              const classStr = (s.classes && s.classes.length > 0) ? ` • [${s.classes.map(c => c.code).join(', ')}]` : '';
              return `
                <option value="${s.id}">
                  👨‍🎓 ${s.name} (${s.id})${classStr}
                </option>
              `;
            }).join('')}
          </optgroup>
        `;
      }

      // 4. Admins
      const admins = (this.contacts || []).filter(c => c.role === 'admin');
      if (admins.length > 0) {
        optionsHtml += `
          <optgroup label="🛡️ Academy Administration">
            ${admins.map(a => `
              <option value="${a.id}">🛡️ ${a.name} (Support)</option>
            `).join('')}
          </optgroup>
        `;
      }
    } else {
      // Admin
      optionsHtml = (this.contacts || []).map(c => `
        <option value="${c.id}">
          ${c.name} (${(c.role || '').toUpperCase()})
        </option>
      `).join('');
    }

    App.showModal(`
      <div class="p-6">
        <div class="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
          <div>
            <h3 class="text-lg font-bold text-slate-900 dark:text-slate-100">Start Message / Announcement</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400">
              ${isStudent ? 'Choose an enrolled course teacher or enrolled classmate (শুধুমাত্র এনরোল্ড শিক্ষক বা সহপাঠী)' : 'Send direct message to any enrolled student or broadcast to section group'}
            </p>
          </div>
          <button onclick="App.closeModal()" class="text-slate-400 hover:text-slate-600">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <form id="new-msg-form" onsubmit="Messaging.submitNewConversation(event)" class="space-y-4">
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">Recipient / Audience</label>
            <select name="receiverId" required class="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-indigo-600 focus:outline-none bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">
              <option value="" disabled selected>-- Choose recipient or group --</option>
              ${optionsHtml || '<option value="" disabled>No recipients available</option>'}
            </select>
          </div>

          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">Subject / Topic (Optional)</label>
            <input type="text" name="subject" placeholder="e.g. Physics Formula Query, Doubt in CT 1, Exam Announcement..."
              class="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-indigo-600 focus:outline-none bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">
          </div>

          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">Message Content</label>
            <textarea name="content" rows="3" placeholder="Write your message or question here... (Shift+Enter for newline)"
              class="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-indigo-600 focus:outline-none bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 leading-relaxed"></textarea>
          </div>

          <!-- Attach Photo or Document -->
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Attach Photo or PDF Document (ছবি বা ফাইল)</span>
              <span class="text-[10px] text-emerald-600 font-bold">📸 Photo Enabled</span>
            </label>
            <input type="file" name="attachment" id="modal-attachment-input" accept="image/*,.pdf" onchange="Messaging.handleModalAttachmentPreview(this)"
              class="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-900 hover:file:bg-indigo-100 cursor-pointer border border-slate-200 dark:border-slate-700 rounded-xl p-2 bg-slate-50 dark:bg-slate-800">
            
            <!-- Live Preview in Modal -->
            <div id="modal-attachment-preview-box" class="hidden mt-2 p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800 flex items-center gap-2.5 text-xs text-indigo-900 dark:text-indigo-200">
              <img id="modal-attachment-preview-thumb" src="" alt="Preview" class="w-10 h-10 object-cover rounded-lg border border-indigo-200 dark:border-indigo-700 hidden">
              <div class="flex-1 min-w-0">
                <span id="modal-attachment-preview-name" class="font-bold block truncate">file_name</span>
                <span id="modal-attachment-preview-size" class="text-[10px] text-slate-500 dark:text-slate-400">120 KB</span>
              </div>
            </div>

            <span class="text-[11px] text-slate-400 mt-1 block">Supports problem photos, math solution screenshots, or homework PDF files.</span>
          </div>

          <div class="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <button type="button" onclick="App.closeModal()" class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition">Cancel</button>
            <button type="submit" id="btn-new-msg-submit" class="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-900 hover:bg-indigo-800 text-white transition shadow-sm">
              Send Message
            </button>
          </div>
        </form>
      </div>
    `);
    if (window.lucide) window.lucide.createIcons();
  },

  handleModalAttachmentPreview(input) {
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    const previewBox = document.getElementById('modal-attachment-preview-box');
    const thumbImg = document.getElementById('modal-attachment-preview-thumb');
    const nameEl = document.getElementById('modal-attachment-preview-name');
    const sizeEl = document.getElementById('modal-attachment-preview-size');

    if (previewBox && nameEl) {
      nameEl.innerText = file.name;
      const bytes = file.size;
      const sizeStr = bytes >= 1024 * 1024 
        ? `${(bytes / (1024 * 1024)).toFixed(2)} MB` 
        : `${Math.round(bytes / 1024)} KB`;
      if (sizeEl) sizeEl.innerText = sizeStr;

      const isImage = file.type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].some(ext => file.name.toLowerCase().endsWith('.' + ext));
      if (isImage && thumbImg) {
        const reader = new FileReader();
        reader.onload = (e) => {
          thumbImg.src = e.target.result;
          thumbImg.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
      } else if (thumbImg) {
        thumbImg.classList.add('hidden');
      }

      previewBox.classList.remove('hidden');
    }
  },

  async submitNewConversation(event) {
    event.preventDefault();
    const form = event.target;
    const receiverId = form.receiverId.value;
    const subject = form.subject.value;
    const content = form.content.value;
    const file = form.attachment.files ? form.attachment.files[0] : null;

    if (!content.trim() && !file) {
      showToast('Please enter a message or select a photo/file to attach', 'error');
      return;
    }

    const submitBtn = document.getElementById('btn-new-msg-submit');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = 'Sending...';
    }

    try {
      if (receiverId.startsWith('GROUP:')) {
        const classId = receiverId.replace('GROUP:', '');
        await API.sendSectionGroupMessage(classId, content, file);
        showToast('Group message sent to all enrolled students!', 'success');
        App.closeModal();
        await this.openGroupChat(classId);
      } else {
        await API.sendMessage(receiverId, content, subject, null, file);
        showToast('Direct message sent successfully!', 'success');
        App.closeModal();
        await this.openChat(receiverId);
      }
    } catch (err) {
      showToast(err.message, 'error');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Send Message';
      }
    }
  },

  // Lightbox Modal for full-size image preview
  previewImageModal(url, title) {
    App.showModal(`
      <div class="p-4 max-w-3xl w-full">
        <div class="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
          <h4 class="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">${title}</h4>
          <button onclick="App.closeModal()" class="text-slate-400 hover:text-slate-600">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>
        <div class="max-h-[70vh] overflow-auto flex items-center justify-center bg-black/5 dark:bg-black/30 rounded-2xl p-2">
          <img src="${url}" alt="${title}" class="max-h-[65vh] w-auto rounded-xl object-contain shadow-md">
        </div>
        <div class="mt-3 flex items-center justify-end gap-2">
          <a href="${url}" download="${title}" class="px-4 py-2 bg-indigo-900 text-white text-xs font-bold rounded-xl hover:bg-indigo-800 transition flex items-center gap-1.5 shadow-sm">
            <i data-lucide="download" class="w-3.5 h-3.5"></i>
            <span>Download High-Res Photo</span>
          </a>
        </div>
      </div>
    `);
    if (window.lucide) window.lucide.createIcons();
  }
};
