// ============================================
// DASHBOARD SCREEN - js/screens/dashboard.js
// ============================================

const dashboardScreen = {
  overlayContext: null,

  render() {
    let content = document.getElementById("dashboardContent");
    if (!content) return;

    let workTasks = tasks.filter(t => t.area === "Work");
    let personalTasks = tasks.filter(t => t.area === "Personal");
    let backupInfo = this.getBackupInfo();

    content.innerHTML = `
      <div class="dashboard-stack">
        <div class="card dashboard-banner dashboard-feature-card dashboard-banner-compact">${this.renderBackupBanner(backupInfo)}</div>
        <div class="dashboard-top-grid">
          ${this.renderQuickAdd()}
        </div>
        <div class="dashboard-area-sections">
          ${this.renderAreaSection("Work", workTasks)}
          ${this.renderAreaSection("Personal", personalTasks)}
        </div>
      </div>
    `;
  },

  renderBackupBanner(backupInfo) {
    return `<div><div class="dashboard-kicker">Backup Reminder</div><p><b>Last backup:</b> ${backupInfo.daysText}</p><p class="${backupInfo.statusClass}">${backupInfo.message}</p></div><button onclick="dashboardScreen.exportBackup(); return false;">Export Backup</button>`;
  },

  renderQuickAdd() {
    return `<div class="card dashboard-feature-card"><div class="dashboard-kicker">Quick Add</div><h3>Quick Add (Unassigned)</h3><p class="dashboard-subtitle">Capture a task now and assign its area later.</p><div class="dashboard-quick-add"><input id="dashboardQuickAddInput" placeholder="Type task and press Enter"><button onclick="dashboardScreen.quickAddTask(); return false;">Add</button></div><div id="dashboardQuickAddFeedback" class="dashboard-feedback"></div></div>`;
  },

  renderAreaSection(areaName, areaTasks) {
    let stats = this.getAreaStats(areaTasks);
    let totalCount = areaTasks.length;
    let completedCount = areaTasks.filter(task => task.status === "Completed").length;
    let activeCount = areaTasks.filter(task => task.status !== "Completed").length;
    let activeAreaTasks = this.getActiveAreaTasks(areaTasks);
    let areaClass = areaName === "Work" ? "dashboard-area-work" : "dashboard-area-personal";
    return `
      <div class="card dashboard-area-card ${areaClass}">
        <div class="dashboard-section-header">
          <div><div class="dashboard-kicker">${areaName} Area</div><h3>${areaName} Tasks</h3><p class="dashboard-subtitle">${activeCount} active • ${totalCount} total • ${completedCount} completed</p></div>
          <div class="dashboard-header-actions"><span class="dashboard-pill">${activeCount} Active</span><span class="dashboard-pill">${totalCount} Total</span></div>
        </div>
        <div class="dashboard-grid">
          ${this.renderStatCard(areaName, "critical", "Critical Tasks", stats.critical)}
          ${this.renderStatCard(areaName, "overdue", "Overdue", stats.overdue)}
          ${this.renderStatCard(areaName, "dueToday", "Due Today", stats.dueToday)}
          ${this.renderStatCard(areaName, "dueThisWeek", "Due This Week", stats.dueThisWeek)}
          ${this.renderStatCard(areaName, "waiting", "Waiting on Others", stats.waiting)}
          ${this.renderStatCard(areaName, "focus", "Focus Tasks", stats.focus)}
          ${this.renderStatCard(areaName, "completedWeek", "Completed This Week", stats.completedWeek)}
        </div>
        <div class="dashboard-subsection">
          <h4>Upcoming</h4>
          <div class="dashboard-grid">
            ${this.renderStatCard(areaName, "upcomingToday", "Due Today", stats.upcomingToday)}
            ${this.renderStatCard(areaName, "upcomingTomorrow", "Due Tomorrow", stats.upcomingTomorrow)}
            ${this.renderStatCard(areaName, "upcomingWeek", "Due This Week", stats.upcomingWeek)}
          </div>
        </div>
        <div class="dashboard-subsection">
          <div class="dashboard-section-header dashboard-section-header-compact"><div><h4>All Tasks</h4><p class="dashboard-subtitle">All active ${areaName.toLowerCase()} tasks. Click a row to open the full table.</p></div><div class="dashboard-header-actions"><span class="dashboard-pill">${activeAreaTasks.length}</span></div></div>
          ${this.renderAllTasksTable(areaName, activeAreaTasks)}
        </div>
      </div>`;
  },

  renderUnassignedSection(unassignedTasks) {
    let tasksPreview = unassignedTasks.length ? `<ul class="dashboard-preview-list">${unassignedTasks.slice(0, 8).map(task => this.renderPreviewItem(task)).join("")}</ul>` : `<p class="dashboard-empty-state">No unassigned tasks.</p>`;
    return `<div class="card dashboard-unassigned-card"><div class="dashboard-section-header"><div><div class="dashboard-kicker">Needs Triage</div><h3><span class="warning-icon">⚠</span> Unassigned Tasks</h3><p class="dashboard-subtitle">Tasks waiting to be placed into Work or Personal.</p></div><div class="dashboard-header-actions"><span class="dashboard-pill dashboard-pill-warning">${unassignedTasks.length}</span><button onclick="dashboardScreen.openOverlayByType('unassigned')">View</button></div></div>${tasksPreview}</div>`;
  },

  renderStatCard(areaName, categoryKey, label, count) {
    let alertClass = categoryKey === "critical" || categoryKey === "overdue" ? "dashboard-count-card-alert" : "dashboard-count-card-default";
    return `<button class="dashboard-count-card ${alertClass} ${count === 0 ? "dashboard-count-card-empty" : ""}" onclick="dashboardScreen.openOverlayByCategory('${areaName}', '${categoryKey}')"><div class="label">${label}</div><div class="count">${count}</div></button>`;
  },

  renderPreviewItem(task) {
    let toneClass = this.getTaskTextClass(task);
    return `<li class="dashboard-preview-item ${toneClass}"><span class="dashboard-preview-name">${escapeHtml(task.name)}</span><span class="dashboard-preview-meta">${getTaskAreaLabel(task)}${task.dueDate ? ` • ${formatDateDisplay(task.dueDate)}` : ""}</span></li>`;
  },

  renderAllTasksTable(areaName, areaTasks) {
    if (areaTasks.length === 0) return `<p class="dashboard-empty-state">No active ${areaName.toLowerCase()} tasks.</p>`;
    return `<table class="dashboard-task-table"><tr><th>Task Name</th><th>Notes</th><th>Due Date</th><th>Follow Up</th><th>Recurring</th><th>Priority</th><th>Status</th><th>Project</th><th class="small">Edit</th></tr>${areaTasks.map(task => this.renderAllTasksRow(task)).join("")}</table>`;
  },

  renderAllTasksRow(task) {
    let toneClass = this.getTaskTextClass(task);
    return `<tr class="dashboard-task-row ${toneClass}" onclick="dashboardScreen.openOverlayByCategory('${task.area}', 'allTasks')"><td>${escapeHtml(task.name)}</td><td>${escapeHtml(firstLine(task.notes)) || "-"}</td><td>${formatDateDisplay(task.dueDate)}</td><td>${task.followUpDate ? `${FOLLOW_UP_ICON} ${formatDateDisplay(task.followUpDate)}` : "-"}</td><td style="text-align:center">${getRecurringIcon(task) || "-"}</td><td>${escapeHtml(task.priority || "-")}</td><td>${escapeHtml(task.status || "-")}</td><td>${escapeHtml(task.project || "-")}</td><td style="text-align:center"><button onclick="event.stopPropagation(); dashboardScreen.editAreaTask(${task.id}); return false;">Edit</button></td></tr>`;
  },

  quickAddTask() {
    let input = document.getElementById("dashboardQuickAddInput");
    if (!input) return;
    let taskName = input.value.trim();
    if (!taskName) return;
    createTask({ name: taskName, area: "", project: "", priority: "Low", status: "Not Started", dueDate: "", followUpDate: "", notes: "", focus: false, pin: false, recurrenceType: "none", recurrenceEndDate: "" });
    this.render();
    let refreshedInput = document.getElementById("dashboardQuickAddInput");
    if (refreshedInput) refreshedInput.focus();
    this.showQuickAddFeedback("✓ Unassigned task created");
  },

  showQuickAddFeedback(message) {
    let feedback = document.getElementById("dashboardQuickAddFeedback");
    if (!feedback) return;
    feedback.textContent = message;
    setTimeout(() => { if (feedback.textContent === message) feedback.textContent = ""; }, 2000);
  },

  getAreaStats(areaTasks) {
    return {
      critical: areaTasks.filter(t => t.priority === "Critical" && t.status !== "Completed").length,
      overdue: areaTasks.filter(t => this.isOverdue(t)).length,
      dueToday: areaTasks.filter(t => this.isDueTodayOrPinnedFocused(t)).length,
      dueThisWeek: areaTasks.filter(t => this.isDueThisWeek(t) && t.status !== "Completed").length,
      waiting: areaTasks.filter(t => this.isWaitingStatus(t.status) && t.status !== "Completed").length,
      focus: areaTasks.filter(t => t.focus && t.status !== "Completed").length,
      completedWeek: areaTasks.filter(t => this.isCompletedThisWeek(t)).length,
      upcomingToday: areaTasks.filter(t => this.isDueTodayOrPinnedFocused(t)).length,
      upcomingTomorrow: areaTasks.filter(t => this.isDueTomorrow(t) && t.status !== "Completed").length,
      upcomingWeek: areaTasks.filter(t => this.isDueThisWeek(t) && t.status !== "Completed").length
    };
  },

  getUnassignedTasks() {
    return tasks.filter(t => !t.area && t.status !== "Completed");
  },

  getActiveAreaTasks(areaTasks) {
    return areaTasks
      .filter(task => task.status !== "Completed")
      .sort((a, b) => this.sortByDueDate(a, b));
  },

  isOverdue(task) {
    if (!task.dueDate || task.status === "Completed") return false;
    return this.asDate(task.dueDate) < this.today();
  },

  isDueTodayOrPinnedFocused(task) {
    if (task.status === "Completed") return false;
    if (task.pin || task.focus) return true;
    return this.isDueToday(task);
  },

  isDueToday(task) {
    if (!task.dueDate) return false;
    return this.sameDate(this.asDate(task.dueDate), this.today());
  },

  isDueTomorrow(task) {
    if (!task.dueDate) return false;
    let tomorrow = this.today();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return this.sameDate(this.asDate(task.dueDate), tomorrow);
  },

  isDueThisWeek(task) {
    if (!task.dueDate) return false;
    let dueDate = this.asDate(task.dueDate);
    let today = this.today();
    let sunday = this.endOfWeek(today);
    return dueDate >= today && dueDate <= sunday;
  },

  isCompletedThisWeek(task) {
    if (task.status !== "Completed" || !task.completedAt) return false;
    let completedDate = new Date(task.completedAt);
    let sevenDaysAgo = new Date();
    sevenDaysAgo.setHours(0, 0, 0, 0);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return completedDate >= sevenDaysAgo;
  },

  isWaitingStatus(status) {
    let normalized = (status || "").toLowerCase().trim();
    return normalized === "waiting on others" || normalized === "waiting on someone else";
  },

  today() {
    let today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  },

  asDate(dateString) {
    let date = new Date(`${dateString}T00:00:00`);
    date.setHours(0, 0, 0, 0);
    return date;
  },

  sameDate(dateA, dateB) {
    return dateA.getTime() === dateB.getTime();
  },

  endOfWeek(today) {
    let sunday = new Date(today);
    sunday.setDate(sunday.getDate() + ((7 - sunday.getDay()) % 7));
    return sunday;
  },

  getBackupInfo() {
    let raw = localStorage.getItem(BACKUP_DATE_KEY);
    if (!raw) return { daysText: "never", message: "No backup found. Export a backup now.", statusClass: "dashboard-status-alert" };
    let lastBackup = new Date(raw);
    let daysAgo = Math.floor((Date.now() - lastBackup.getTime()) / 86400000);
    if (Number.isNaN(daysAgo)) return { daysText: "unknown", message: "Backup date is invalid. Export a new backup.", statusClass: "dashboard-status-alert" };
    if (daysAgo <= 1) return { daysText: `${daysAgo} day${daysAgo === 1 ? "" : "s"} ago`, message: "Backup is up to date.", statusClass: "dashboard-status-good" };
    if (daysAgo <= 7) return { daysText: `${daysAgo} days ago`, message: "Backup is recent.", statusClass: "dashboard-status-warning" };
    return { daysText: `${daysAgo} days ago`, message: "Backup is outdated. Please export a new backup.", statusClass: "dashboard-status-alert" };
  },

  exportBackup() {
    let localStorageDump = {};
    for (let i = 0; i < localStorage.length; i++) {
      let key = localStorage.key(i);
      localStorageDump[key] = localStorage.getItem(key);
    }
    let payload = { exportedAt: new Date().toISOString(), localStorage: localStorageDump };
    let blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    let link = document.createElement("a");
    let dateStamp = new Date().toISOString().split("T")[0];
    link.href = URL.createObjectURL(blob);
    link.download = `taskmanager-backup-${dateStamp}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
    localStorage.setItem(BACKUP_DATE_KEY, new Date().toISOString());
    this.render();
  },

  openOverlayByCategory(areaName, categoryKey) { this.overlayContext = { type: "category", areaName, categoryKey }; this.renderOverlay(); },
  openOverlayByType(type) { this.overlayContext = { type }; this.renderOverlay(); },

  getOverlayTasks() {
    if (!this.overlayContext) return [];
    if (this.overlayContext.type === "unassigned") return this.getUnassignedTasks();
    let areaTasks = tasks.filter(t => t.area === this.overlayContext.areaName);
    let key = this.overlayContext.categoryKey;
    if (key === "allTasks") return this.getActiveAreaTasks(areaTasks);
    if (key === "critical") return areaTasks.filter(t => t.priority === "Critical" && t.status !== "Completed");
    if (key === "overdue") return areaTasks.filter(t => this.isOverdue(t));
    if (key === "dueToday") return areaTasks.filter(t => this.isDueTodayOrPinnedFocused(t));
    if (key === "dueThisWeek") return areaTasks.filter(t => this.isDueThisWeek(t) && t.status !== "Completed");
    if (key === "waiting") return areaTasks.filter(t => this.isWaitingStatus(t.status) && t.status !== "Completed");
    if (key === "focus") return areaTasks.filter(t => t.focus && t.status !== "Completed");
    if (key === "completedWeek") return areaTasks.filter(t => this.isCompletedThisWeek(t));
    if (key === "upcomingToday") return areaTasks.filter(t => this.isDueTodayOrPinnedFocused(t));
    if (key === "upcomingTomorrow") return areaTasks.filter(t => this.isDueTomorrow(t) && t.status !== "Completed");
    if (key === "upcomingWeek") return areaTasks.filter(t => this.isDueThisWeek(t) && t.status !== "Completed");
    return [];
  },

  getOverlayTitle() {
    if (!this.overlayContext) return "Tasks";
    if (this.overlayContext.type === "unassigned") return "Unassigned Tasks";
    let labels = { critical: "Critical Tasks", overdue: "Overdue Tasks", dueToday: "Due Today", dueThisWeek: "Due This Week", waiting: "Waiting on Others", focus: "Focus Tasks", allTasks: "All Tasks", completedWeek: "Completed This Week", upcomingToday: "Upcoming - Due Today", upcomingTomorrow: "Upcoming - Due Tomorrow", upcomingWeek: "Upcoming - Due This Week" };
    return `${this.overlayContext.areaName}: ${labels[this.overlayContext.categoryKey] || "Tasks"}`;
  },

  renderOverlay() {
    let modal = document.getElementById("dashboardOverlayModal");
    let body = document.getElementById("dashboardOverlayBody");
    let title = document.getElementById("dashboardOverlayTitle");
    if (!modal || !body || !title) return;
    let selectedTasks = this.getOverlayTasks();
    title.textContent = this.getOverlayTitle();
    if (selectedTasks.length === 0) {
      body.innerHTML = `<p>No tasks in this category.</p>`;
      modal.classList.add("active");
      return;
    }
    body.innerHTML = `<div class="dashboard-overlay-summary">${selectedTasks.length} task${selectedTasks.length === 1 ? "" : "s"}</div>${this.renderOverlayTable(selectedTasks)}`;
    modal.classList.add("active");
  },

  renderOverlayTable(selectedTasks) {
    return `<table class="dashboard-overlay-table"><tr><th>Area</th><th>Task</th><th>Project</th><th>Due Date</th><th>Follow Up</th><th>Recurring</th><th>Priority</th><th>Status</th><th>Actions</th></tr>${selectedTasks.map(task => this.renderOverlayRow(task)).join("")}</table>`;
  },

  renderOverlayRow(task) {
    let toneClass = this.getTaskTextClass(task);
    let action = task.status === "Completed"
      ? `<button onclick="dashboardScreen.viewOverlayTask(${task.id}); return false;">View</button>`
      : `<button onclick="dashboardScreen.editOverlayTask(${task.id}); return false;">Edit</button>`;
    return `<tr class="${toneClass}"><td>${escapeHtml(getTaskAreaLabel(task))}</td><td>${escapeHtml(task.name)}</td><td>${escapeHtml(task.project || "-")}</td><td>${formatDateDisplay(task.dueDate)}</td><td>${task.followUpDate ? `${FOLLOW_UP_ICON} ${formatDateDisplay(task.followUpDate)}` : "-"}</td><td style="text-align:center">${getRecurringIcon(task) || "-"}</td><td>${task.priority || "-"}</td><td>${task.status || "-"}</td><td style="text-align:center">${action}</td></tr>`;
  },

  editAreaTask(taskId) { editTaskScreen.show(taskId, "dashboard"); },
  editOverlayTask(taskId) { this.closeOverlay(); editTaskScreen.show(taskId, "dashboard"); },
  viewOverlayTask(taskId) { this.closeOverlay(); viewTaskScreen.show(taskId, "dashboard"); },
  closeOverlay() { let modal = document.getElementById("dashboardOverlayModal"); if (modal) modal.classList.remove("active"); },
  getTaskTextClass(task) { if (task.priority === "Critical" || this.isOverdue(task)) return "dashboard-task-text-alert"; if (this.isDueToday(task)) return "dashboard-task-text-good"; return ""; },
  sortByDueDate(taskA, taskB) { if (taskA.dueDate && taskB.dueDate) { let dueDateCompare = asDate(taskA.dueDate).getTime() - asDate(taskB.dueDate).getTime(); if (dueDateCompare !== 0) return dueDateCompare; } else if (taskA.dueDate) { return -1; } else if (taskB.dueDate) { return 1; } return (taskA.name || "").localeCompare(taskB.name || ""); }
};

document.addEventListener("DOMContentLoaded", () => {
  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && document.activeElement?.id === "dashboardQuickAddInput") {
      e.preventDefault();
      dashboardScreen.quickAddTask();
    }
  });
  let overlay = document.getElementById("dashboardOverlayModal");
  if (overlay) overlay.addEventListener("click", (e) => { if (e.target === overlay) dashboardScreen.closeOverlay(); });
  if (screenManager.currentScreen === "dashboard") dashboardScreen.render();
});
