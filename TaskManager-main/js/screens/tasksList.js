// ============================================
// TASKS LIST SCREEN - js/screens/tasksList.js
// ============================================

const tasksListScreen = {
  render() {
    let displayTasks = getFilteredTasks();
    let activeCount = displayTasks.length;
    let countDisplay = document.getElementById("tasksListActiveCount");
    if (countDisplay) {
      countDisplay.textContent = `${activeCount} active task${activeCount === 1 ? "" : "s"}`;
    }

    let taskRows = displayTasks.length === 0
      ? `<tr><td colspan="13" style="text-align:center;padding:30px">No tasks found</td></tr>`
      : displayTasks.map(task => this.renderRow(task)).join("");

    document.getElementById("taskTable").innerHTML = `
      <tr>
        <th onclick="tasksListScreen.sortTable('area')">Area ↕</th>
        <th onclick="tasksListScreen.sortTable('name')">Task ↕</th>
        <th onclick="tasksListScreen.sortTable('notes')">Notes ↕</th>
        <th onclick="tasksListScreen.sortTable('dueDate')">Due Date ↕</th>
        <th onclick="tasksListScreen.sortTable('priority')">Priority ↕</th>
        <th onclick="tasksListScreen.sortTable('status')">Status ↕</th>
        <th onclick="tasksListScreen.sortTable('project')">Project ↕</th>
        <th onclick="tasksListScreen.sortTable('followUpDate')">Follow Up ↕</th>
        <th onclick="tasksListScreen.sortTable('recurrenceType')">Recurring ↕</th>
        <th class="small">Focus</th>
        <th class="small">My Day</th>
        <th class="small">Actions</th>
      </tr>${taskRows}`;
  },

  renderRow(task) {
    let actionBtn = task.status === "Completed"
      ? `<button onclick="viewTaskScreen.show(${task.id}); return false;">View</button>`
      : `<button onclick="editTaskScreen.show(${task.id}); return false;">Edit</button>`;
    return `<tr>
      <td>${escapeHtml(getTaskAreaLabel(task))}</td>
      <td>${escapeHtml(task.name)}</td>
      <td>${escapeHtml(firstLine(task.notes)) || "-"}</td>
      <td>${formatDateDisplay(task.dueDate)}</td>
      <td>${escapeHtml(task.priority)}</td>
      <td>${escapeHtml(task.status)}</td>
      <td>${escapeHtml(task.project || "-")}</td>
      <td title="${task.followUpDate ? formatDateDisplay(task.followUpDate) : "No follow up"}" style="text-align:center">${task.followUpDate ? `${FOLLOW_UP_ICON} ${formatDateDisplay(task.followUpDate)}` : "-"}</td>
      <td title="${escapeHtml(getRecurringLabel(task))}" style="text-align:center">${getRecurringIcon(task) || "-"}</td>
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
  }
};

document.addEventListener("DOMContentLoaded", () => {
  ["showCompleted", "showFairas", "filterWork", "filterPersonal", "filterUnassigned"].forEach(id => {
    let element = document.getElementById(id);
    if (element) element.addEventListener("change", () => tasksListScreen.render());
  });
  if (screenManager.currentScreen === "tasksList") tasksListScreen.render();
});
