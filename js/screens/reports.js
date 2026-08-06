// ============================================
// REPORTS SCREEN - js/screens/reports.js
// ============================================

const reportsScreen = {
  render() {
    let content = document.getElementById("reportsContent");
    if (!content) return;
    let dueThisWeek = tasks.filter(task => task.area === "Work" && task.status !== "Completed" && this.isThisWeek(task.dueDate));
    let completedLastWeek = tasks.filter(task => task.area === "Work" && task.status === "Completed" && task.completedAt && this.isLastWeek(new Date(task.completedAt)));
    content.innerHTML = `
      <div class="card">
        <h3>Tasks Due This Week</h3>
        ${this.renderTable(dueThisWeek, 'reports')}
      </div>
      <div class="card" style="margin-top:20px">
        <h3>Completed Last Week</h3>
        ${this.renderTable(completedLastWeek, 'reports')}
      </div>
    `;
  },

  renderTable(items, returnScreen) {
    if (items.length === 0) {
      return `<p style="text-align:center;padding:20px">No tasks found</p>`;
    }
    return `
      <table class="dashboard-task-table">
        ${typeof tasksListScreen !== 'undefined' ? tasksListScreen.tableHeader(false) : `<tr><th>Task</th><th>Notes</th><th>Due Date</th><th>Follow Up</th><th>Recurring</th><th>Priority</th><th>Status</th><th>Project</th><th class="small">Focus</th><th class="small">My Day</th><th class="small">Actions</th></tr>`}
        ${items.map(task => (typeof tasksListScreen !== 'undefined' ? tasksListScreen.rowHtml(task, false) : this.renderRow(task, returnScreen))).join('')}
      </table>
    `;
  },

  renderRow(task, returnScreen) {
    let actionBtn = task.status === "Completed" ? `<button onclick="viewTaskScreen.show(${task.id}, '${returnScreen}'); return false;">View</button>` : `<button onclick="editTaskScreen.show(${task.id}, '${returnScreen}'); return false;">Edit</button>`;
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

  sortTable(field) {
    if (currentSort.field === field) {
      currentSort.ascending = !currentSort.ascending;
    } else {
      currentSort.field = field;
      currentSort.ascending = true;
    }
    this.render();
  },

  startOfWeek(date) {
    let result = new Date(date);
    let day = result.getDay();
    let diff = result.getDate() - day + (day === 0 ? -6 : 1);
    result.setDate(diff);
    result.setHours(0, 0, 0, 0);
    return result;
  },

  endOfWeek(date) {
    let result = this.startOfWeek(date);
    result.setDate(result.getDate() + 6);
    result.setHours(23, 59, 59, 999);
    return result;
  },

  isThisWeek(dateString) {
    if (!dateString) return false;
    let current = new Date();
    let start = this.startOfWeek(current);
    let end = this.endOfWeek(current);
    let date = asDate(dateString);
    return date >= start && date <= end;
  },

  isLastWeek(date) {
    let current = new Date();
    let start = this.startOfWeek(current);
    let lastWeekStart = new Date(start);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    let lastWeekEnd = new Date(start);
    lastWeekEnd.setMilliseconds(-1);
    return date >= lastWeekStart && date <= lastWeekEnd;
  }
};

document.addEventListener("DOMContentLoaded", () => {
  if (screenManager.currentScreen === "reports") reportsScreen.render();
});
