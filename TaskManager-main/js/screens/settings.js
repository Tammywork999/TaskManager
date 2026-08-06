// ============================================
// SETTINGS SCREEN - js/screens/settings.js
// ============================================

const settingsScreen = {
  selectedProjectOverlay: null,

  render() {
    let content = document.getElementById("settingsContent");
    if (!content) return;
    content.innerHTML = `
      <div class="card">
        <div class="dashboard-section-header">
          <div>
            <div class="dashboard-kicker">Project Management</div>
            <h3>Projects</h3>
            <p class="dashboard-subtitle">Create projects here and hide them from task dropdowns when closed.</p>
          </div>
        </div>
        <div class="dashboard-quick-add" style="margin-bottom:16px">
          <input id="settingsProjectName" placeholder="New project name">
          <button onclick="settingsScreen.addProject(); return false;">Add Project</button>
        </div>
        <table class="dashboard-task-table">
          <tr>
            <th>Project</th>
            <th>Active</th>
            <th>Completed</th>
            <th>Status</th>
            <th class="small">Actions</th>
          </tr>
          ${projects.length === 0 ? `<tr><td colspan="5" style="text-align:center;padding:20px">No projects configured.</td></tr>` : projects.map(project => this.renderRow(project)).join("")}
        </table>
      </div>
    `;
  },

  renderRow(project) {
    let activeTasks = tasks.filter(t => t.project === project.name && t.status !== "Completed").length;
    let completedTasks = tasks.filter(t => t.project === project.name && t.status === "Completed").length;
    let canDelete = activeTasks === 0 && completedTasks === 0;
    let deleteBtn = canDelete 
      ? `<button onclick="settingsScreen.deleteProject('${escapeHtml(project.name)}'); return false;" style="background-color:#dc3545">Delete</button>`
      : `<button disabled style="background-color:#ccc;cursor:not-allowed" title="Cannot delete project with tasks">Delete</button>`;
    
    return `<tr>
      <td><button onclick="settingsScreen.openProjectOverlay('${escapeHtml(project.name)}'); return false;" style="background:none;border:none;color:#0066cc;cursor:pointer;text-decoration:underline;padding:0">${escapeHtml(project.name)}</button></td>
      <td>${activeTasks}</td>
      <td>${completedTasks}</td>
      <td>${project.hidden ? "Hidden" : "Visible"}</td>
      <td style="text-align:center">
        <button onclick="settingsScreen.toggleProject('${escapeHtml(project.name)}'); return false;">${project.hidden ? "Show" : "Hide"}</button>
        ${deleteBtn}
      </td>
    </tr>`;
  },

  addProject() {
    let input = document.getElementById("settingsProjectName");
    if (!input) return;
    let name = input.value.trim();
    if (!name) return;
    addProject(name);
    input.value = "";
    createTaskScreen.updateProjectOptions();
    this.render();
  },

  toggleProject(projectName) {
    let project = projects.find(item => item.name === projectName);
    if (!project) return;
    updateProjectVisibility(projectName, !project.hidden);
    createTaskScreen.updateProjectOptions();
    this.render();
  },

  deleteProject(projectName) {
    let activeTasks = tasks.filter(t => t.project === projectName && t.status !== "Completed").length;
    let completedTasks = tasks.filter(t => t.project === projectName && t.status === "Completed").length;
    if (activeTasks > 0 || completedTasks > 0) {
      alert("Cannot delete project with assigned tasks");
      return;
    }
    if (!confirm(`Delete project "${projectName}"?`)) return;
    projects = projects.filter(p => p.name !== projectName);
    saveProjects();
    createTaskScreen.updateProjectOptions();
    this.render();
  },

  openProjectOverlay(projectName) {
    this.selectedProjectOverlay = projectName;
    this.renderProjectOverlay();
  },

  closeProjectOverlay() {
    let modal = document.getElementById("dashboardOverlayModal");
    if (modal) modal.classList.remove("active");
    this.selectedProjectOverlay = null;
  },

  renderProjectOverlay() {
    let modal = document.getElementById("dashboardOverlayModal");
    let body = document.getElementById("dashboardOverlayBody");
    let title = document.getElementById("dashboardOverlayTitle");
    if (!modal || !body || !title) return;

    let projectTasks = tasks.filter(t => t.project === this.selectedProjectOverlay);
    title.textContent = `${this.selectedProjectOverlay} - Tasks`;

    if (projectTasks.length === 0) {
      body.innerHTML = `<p>No tasks in this project.</p>`;
      modal.classList.add("active");
      return;
    }

    body.innerHTML = `
      <div class="dashboard-overlay-summary">${projectTasks.length} task${projectTasks.length === 1 ? "" : "s"}</div>
      <table class="dashboard-overlay-table">
        <tr>
          <th>Area</th>
          <th>Task</th>
          <th>Notes</th>
          <th>Due Date</th>
          <th>Priority</th>
          <th>Status</th>
          <th>Follow Up</th>
          <th class="small">Focus</th>
          <th class="small">My Day</th>
          <th class="small">Actions</th>
        </tr>
        ${projectTasks.map(task => this.renderProjectOverlayRow(task)).join("")}
      </table>
    `;
    modal.classList.add("active");
  },

  renderProjectOverlayRow(task) {
    let toneClass = task.priority === "Critical" || (task.dueDate && new Date(task.dueDate + "T00:00:00") < new Date().setHours(0, 0, 0, 0)) ? "dashboard-task-text-alert" : "";
    let action = task.status === "Completed"
      ? `<button onclick="settingsScreen.viewProjectTask(${task.id}); return false;">View</button>`
      : `<button onclick="settingsScreen.editProjectTask(${task.id}); return false;">Edit</button>`;
    return `<tr class="${toneClass}">
      <td>${escapeHtml(getTaskAreaLabel(task))}</td>
      <td>${escapeHtml(task.name)}</td>
      <td>${escapeHtml(firstLine(task.notes)) || "-"}</td>
      <td>${formatDateDisplay(task.dueDate)}</td>
      <td>${escapeHtml(task.priority || "-")}</td>
      <td>${escapeHtml(task.status)}</td>
      <td title="${task.followUpDate ? formatDateDisplay(task.followUpDate) : "No follow up"}" style="text-align:center">${task.followUpDate ? `${FOLLOW_UP_ICON}` : "-"}</td>
      <td style="text-align:center">${task.focus ? "⭐" : ""}</td>
      <td style="text-align:center">${task.pin ? "📌" : ""}</td>
      <td style="text-align:center">${action}</td>
    </tr>`;
  },

  editProjectTask(taskId) {
    editTaskScreen.show(taskId, "settings");
    this.closeProjectOverlay();
  },

  viewProjectTask(taskId) {
    viewTaskScreen.show(taskId, "settings");
    this.closeProjectOverlay();
  }
};

document.addEventListener("DOMContentLoaded", () => {
  let overlay = document.getElementById("dashboardOverlayModal");
  if (overlay) overlay.addEventListener("click", (e) => { 
    if (e.target === overlay) settingsScreen.closeProjectOverlay(); 
  });
  if (screenManager.currentScreen === "settings") settingsScreen.render();
});
