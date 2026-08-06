// ============================================
// MY DAY SCREEN - js/screens/myDay.js
// ============================================

const MY_DAY_AREA_FILTER_KEY = "myDayAreaFilter";

const myDayScreen = {
  render() {
    let content = document.getElementById("myDayContent");
    if (!content) return;

    let areaFilter = this.getAreaFilter();
    let selectedAreas = areaFilter === "All" ? ["Work", "Personal", "Unassigned"] : [areaFilter];
    let selectedTasks = this.getDisplayTasks(selectedAreas);
    let grouped = this.groupByArea(selectedTasks, selectedAreas);
    let unassignedTasks = this.getUnassignedTasks();

    content.innerHTML = `
      <div class="dashboard-stack">
        <div class="myday-top-grid">
          <div class="card myday-filter-card">${this.renderAreaToggle(areaFilter)}</div>
          <div class="card myday-quick-add-card">
            <div class="dashboard-kicker">Quick Add</div>
            <h3>Add Task</h3>
            <p class="dashboard-subtitle">Task name only. Unassigned by default. Leave dates blank.</p>
            <div class="dashboard-quick-add">
              <input id="myDayQuickAddInput" placeholder="Type task and press Enter">
              <button onclick="myDayScreen.quickAddTask(); return false;">Add</button>
            </div>
            <div id="myDayQuickAddFeedback" class="dashboard-feedback"></div>
          </div>
        </div>
        <div class="card myday-section-card">
          <div class="myday-section-header">
            <div>
              <h3>My Day</h3>
              <p class="dashboard-subtitle">Due today, follow up today, recurring, pinned, focus, and overdue tasks grouped by area.</p>
            </div>
          </div>
          ${this.renderAreaGroup("Work", grouped.Work)}
          ${this.renderAreaGroup("Personal", grouped.Personal)}
          ${this.renderAreaGroup("Unassigned", grouped.Unassigned)}
        </div>
        ${unassignedTasks.length > 0 ? `
          <div class="card myday-section-card">
            <div class="myday-section-header">
              <div>
                <h3>Unassigned Tasks</h3>
                <p class="dashboard-subtitle">All active unassigned tasks without due dates.</p>
              </div>
            </div>
            ${this.renderUnassignedTable(unassignedTasks)}
          </div>
        ` : ""}
      </div>
    `;
  },

  getDisplayTasks(selectedAreas) {
    let today = todayDateObject();
    let activeTasks = tasks.filter(task => task.status !== "Completed");
    let filtered = activeTasks.filter(task => selectedAreas.includes(getTaskAreaLabel(task)));
    return filtered.filter(task => this.isRelevantTask(task, today)).sort((a, b) => this.sortTasks(a, b));
  },

  getUnassignedTasks() {
    let activeTasks = tasks.filter(task => task.status !== "Completed" && !task.area);
    return activeTasks.filter(task => !task.dueDate).sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  },

  isRelevantTask(task, today) {
    if (task.dueDate && asDate(task.dueDate) < today) return true;
    if (task.dueDate && sameDate(asDate(task.dueDate), today)) return true;
    if (task.followUpDate && sameDate(asDate(task.followUpDate), today)) return true;
    if (task.pin || task.focus || isRecurringTask(task)) return true;
    return false;
  },

  sortTasks(taskA, taskB) {
    let dueCompare = compareDateStrings(taskA.dueDate, taskB.dueDate);
    if (dueCompare !== 0) return dueCompare;
    return (taskA.name || "").localeCompare(taskB.name || "");
  },

  renderAreaToggle(selected) {
    return `<div class="myday-toggle-wrap"><div><div class="dashboard-kicker">Area Filter</div><h3>Show</h3></div><div class="myday-toggle-group">${["All", "Work", "Personal", "Unassigned"].map(value => this.renderAreaToggleButton(value, selected)).join("")}</div></div>`;
  },

  renderAreaToggleButton(value, selected) {
    return `<button class="myday-toggle-btn ${selected === value ? "myday-toggle-btn-active" : ""}" onclick="myDayScreen.setAreaFilter('${value}'); return false;">${value}</button>`;
  },

  renderAreaGroup(areaName, areaTasks) {
    if (!areaTasks) return "";
    return `
      <div class="myday-area-block">
        <h4>${areaName} (${areaTasks.length})</h4>
        ${areaTasks.length === 0 ? `<p class="dashboard-empty-state">No ${areaName.toLowerCase()} tasks.</p>` : `
          <table class="myday-task-table">
            <tr>
              <th onclick="myDayScreen.sortColumn('name')">Task ↕</th>
              <th onclick="myDayScreen.sortColumn('notes')">Notes ↕</th>
              <th onclick="myDayScreen.sortColumn('dueDate')">Due Date ↕</th>
              <th onclick="myDayScreen.sortColumn('followUpDate')">Follow Up ↕</th>
              <th onclick="myDayScreen.sortColumn('recurrenceType')">Recurring ↕</th>
              <th onclick="myDayScreen.sortColumn('priority')">Priority ↕</th>
              <th onclick="myDayScreen.sortColumn('status')">Status ↕</th>
              <th onclick="myDayScreen.sortColumn('project')">Project ↕</th>
              <th class="small">Focus</th>
              <th class="small">My Day</th>
              <th class="small">Edit</th>
            </tr>
            ${areaTasks.map(task => this.renderTaskRow(task)).join("")}
          </table>`}
      </div>`;
  },

  renderUnassignedTable(unassignedTasks) {
    return `
      <table class="myday-task-table">
        <tr>
          <th onclick="myDayScreen.sortColumn('name')">Task ↕</th>
          <th onclick="myDayScreen.sortColumn('notes')">Notes ↕</th>
          <th onclick="myDayScreen.sortColumn('dueDate')">Due Date ↕</th>
          <th onclick="myDayScreen.sortColumn('followUpDate')">Follow Up ↕</th>
          <th onclick="myDayScreen.sortColumn('recurrenceType')">Recurring ↕</th>
          <th onclick="myDayScreen.sortColumn('priority')">Priority ↕</th>
          <th onclick="myDayScreen.sortColumn('status')">Status ↕</th>
          <th onclick="myDayScreen.sortColumn('project')">Project ↕</th>
          <th class="small">Focus</th>
          <th class="small">My Day</th>
          <th class="small">Edit</th>
        </tr>
        ${unassignedTasks.map(task => this.renderTaskRow(task)).join("")}
      </table>`;
  },

  renderTaskRow(task) {
    let overdueClass = this.isOverdue(task) ? "dashboard-task-text-alert" : "";
    return `<tr class="${overdueClass}">
      <td>${escapeHtml(task.name)}</td>
      <td>${escapeHtml(firstLine(task.notes)) || "-"}</td>
      <td>${formatDateDisplay(task.dueDate)}</td>
      <td title="${task.followUpDate ? formatDateDisplay(task.followUpDate) : "No follow up"}" style="text-align:center">${task.followUpDate ? `${FOLLOW_UP_ICON}` : "-"}</td>
      <td title="${escapeHtml(getRecurringLabel(task))}" style="text-align:center">${getRecurringIcon(task) || "-"}</td>
      <td>${escapeHtml(task.priority)}</td>
      <td>${escapeHtml(task.status)}</td>
      <td>${escapeHtml(task.project || "-")}</td>
      <td style="text-align:center">${task.focus ? "⭐" : ""}</td>
      <td style="text-align:center">${task.pin ? "📌" : ""}</td>
      <td style="text-align:center"><button onclick="myDayScreen.openEdit(${task.id}); return false;">Edit</button></td>
    </tr>`;
  },

  groupByArea(sectionTasks, selectedAreas) {
    let grouped = { Work: null, Personal: null, Unassigned: null };
    if (selectedAreas.includes("Work")) grouped.Work = sectionTasks.filter(task => getTaskAreaLabel(task) === "Work");
    if (selectedAreas.includes("Personal")) grouped.Personal = sectionTasks.filter(task => getTaskAreaLabel(task) === "Personal");
    if (selectedAreas.includes("Unassigned")) grouped.Unassigned = sectionTasks.filter(task => getTaskAreaLabel(task) === "Unassigned");
    return grouped;
  },

  setAreaFilter(value) {
    localStorage.setItem(MY_DAY_AREA_FILTER_KEY, value);
    this.render();
  },

  getAreaFilter() {
    let stored = localStorage.getItem(MY_DAY_AREA_FILTER_KEY);
    if (["Work", "Personal", "Unassigned", "All"].includes(stored)) return stored;
    return "All";
  },

  sortColumn(field) {
    if (currentSort.field === field) {
      currentSort.ascending = !currentSort.ascending;
    } else {
      currentSort.field = field;
      currentSort.ascending = true;
    }
    this.render();
  },

  quickAddTask() {
    let input = document.getElementById("myDayQuickAddInput");
    if (!input) return;
    let taskName = input.value.trim();
    if (!taskName) return;
    createTask({ 
      name: taskName, 
      area: "", 
      project: "", 
      priority: "Low", 
      status: "Not Started", 
      dueDate: "", 
      followUpDate: "", 
      notes: "", 
      focus: false, 
      pin: false, 
      recurrenceType: "none", 
      recurrenceEndDate: "" 
    });
    input.value = "";
    this.render();
    let refreshedInput = document.getElementById("myDayQuickAddInput");
    if (refreshedInput) refreshedInput.focus();
    this.showQuickAddFeedback("✓ Task added");
  },

  showQuickAddFeedback(message) {
    let feedback = document.getElementById("myDayQuickAddFeedback");
    if (!feedback) return;
    feedback.textContent = message;
    setTimeout(() => {
      if (feedback.textContent === message) feedback.textContent = "";
    }, 2000);
  },

  isOverdue(task) {
    return !!(task.dueDate && asDate(task.dueDate) < todayDateObject());
  },

  openEdit(taskId) { 
    editTaskScreen.show(taskId, "myDay"); 
  }
};

document.addEventListener("DOMContentLoaded", () => {
  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && document.activeElement?.id === "myDayQuickAddInput") {
      e.preventDefault();
      myDayScreen.quickAddTask();
    }
  });
  if (screenManager.currentScreen === "myDay") myDayScreen.render();
});
