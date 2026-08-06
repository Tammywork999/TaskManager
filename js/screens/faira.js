// ============================================
// FAIRA SCREEN - js/screens/faira.js
// ============================================

const fairaScreen = {
  filter: "active",

  render() {
    let content = document.getElementById("fairaContent");
    if (!content) return;
    let filtered = tasks.filter(task => task.project === "FAIRA").filter(task => this.matchesStatus(task));
    content.innerHTML = `
      <div class="card">
        <div class="filter-section">
          <label><input type="checkbox" ${this.filter === "active" ? "checked" : ""} onchange="fairaScreen.setFilter('active', this.checked)"> Active</label>
          <label><input type="checkbox" ${this.filter === "completed" ? "checked" : ""} onchange="fairaScreen.setFilter('completed', this.checked)"> Completed</label>
          <label><input type="checkbox" ${this.filter === "both" ? "checked" : ""} onchange="fairaScreen.setFilter('both', this.checked)"> Both</label>
        </div>
      </div>
      <table class="dashboard-task-table">
        ${typeof tasksListScreen !== 'undefined' ? tasksListScreen.tableHeader(false) : `<tr><th>Task</th><th>Notes</th><th>Due Date</th><th>Follow Up</th><th>Recurring</th><th>Priority</th><th>Status</th><th>Project</th><th class="small">Focus</th><th class="small">My Day</th><th class="small">Actions</th></tr>`}
        ${filtered.length === 0 ? `<tr><td colspan="11" style="text-align:center;padding:30px">No tasks found</td></tr>` : filtered.map(task => (typeof tasksListScreen !== 'undefined' ? tasksListScreen.rowHtml(task, false) : this.renderRow(task))).join("")}
      </table>
    `;
  },

  renderRow(task) {
    let actionBtn = task.status === "Completed" ? `<button onclick="viewTaskScreen.show(${task.id}, 'faira'); return false;">View</button>` : `<button onclick="editTaskScreen.show(${task.id}, 'faira'); return false;">Edit</button>`;
    return `<tr>
      <td>${escapeHtml(task.name)}</td>
      <td>${escapeHtml(firstLine(task.notes)) || "-"}</td>
      <td>${formatDateDisplay(task.dueDate)}</td>
      <td title="${task.followUpDate ? formatDateDisplay(task.followUpDate) : "No follow up"}" style="text-align:center">${task.followUpDate ? `${FOLLOW_UP_ICON} ${formatDateDisplay(task.followUpDate)}` : "-"}</td>
      <td title="${escapeHtml(getRecurringLabel(task))}" style="text-align:center">${getRecurringIcon(task) || "-"}</td>
      <td>${escapeHtml(task.priority || "-")}</td>
      <td>${escapeHtml(task.status)}</td>
      <td>${escapeHtml(task.project || "-")}</td>
      <td style="text-align:center">${task.focus ? "⭐" : ""}</td>
      <td style="text-align:center">${task.pin ? "📌" : ""}</td>
      <td style="text-align:center">${actionBtn}</td>
    </tr>`;
  },

  matchesStatus(task) {
    if (this.filter === "both") return true;
    if (this.filter === "completed") return task.status === "Completed";
    return task.status !== "Completed";
  },

  setFilter(value, checked) {
    if (value === "both") {
      this.filter = checked ? "both" : "active";
    } else if (value === "completed") {
      this.filter = checked ? "completed" : "active";
    } else {
      this.filter = checked ? "active" : "completed";
    }
    this.render();
  },

  sortTable(field) {
    if (currentSort.field === field) {
      currentSort.ascending = !currentSort.ascending;
    } else {
      currentSort.field = field;
      currentSort.ascending = true;
    }
    this.render();
  }
};

document.addEventListener("DOMContentLoaded", () => {
  if (screenManager.currentScreen === "faira") fairaScreen.render();
});
