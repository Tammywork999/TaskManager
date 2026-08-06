// ============================================
// VIEW TASK SCREEN - js/screens/viewTask.js
// ============================================

const viewTaskScreen = {
  currentTaskId: null,
  returnScreen: "tasksList",

  show(taskId, returnScreen = "tasksList") {
    this.currentTaskId = taskId;
    this.returnScreen = returnScreen;
    let task = getTaskById(taskId);
    if (!task) {
      alert("Task not found");
      return;
    }

    document.getElementById("viewTaskContainer").innerHTML = `
      <div class="card">
        <h2>${escapeHtml(task.name)}</h2>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:15px;margin-top:15px">
          <div>
            <p><b>Area:</b> ${escapeHtml(getTaskAreaLabel(task))}</p>
            <p><b>Priority:</b> ${escapeHtml(task.priority)}</p>
            <p><b>Status:</b> ${escapeHtml(task.status)}</p>
            <p><b>Recurring:</b> ${escapeHtml(getRecurringLabel(task))}</p>
          </div>
          <div>
            <p><b>Due Date:</b> ${formatDateDisplay(task.dueDate)}</p>
            <p><b>Follow Up:</b> ${task.followUpDate ? `${FOLLOW_UP_ICON} ${formatDateDisplay(task.followUpDate)}` : "-"}</p>
            <p><b>Project:</b> ${escapeHtml(task.project || "-")}</p>
            <p><b>Focus:</b> ${task.focus ? "⭐ Yes" : "No"}</p>
            <p><b>Add To My Day:</b> ${task.pin ? "📌 Yes" : "No"}</p>
          </div>
        </div>
        <div style="margin-top:20px">
          <p><b>Notes:</b></p>
          <p style="white-space:pre-wrap;background:#f5f5f5;padding:10px;border-radius:4px">${renderNotesWithLinks(task.notes)}</p>
        </div>
        <div class="task-meta-label" style="margin-top:20px">
          <p>Date Created: ${new Date(task.createdAt).toLocaleString()}</p>
          ${task.completedAt ? `<p>Completed: ${new Date(task.completedAt).toLocaleString()}</p>` : ""}
        </div>
        <button onclick="editTaskScreen.show(${taskId}, '${this.returnScreen}')">Edit</button>
        <button onclick="viewTaskScreen.reopenTask()" style="background-color:#28a745">Reopen</button>
        <button onclick="viewTaskScreen.close()" style="background-color:#6c757d">Close</button>
      </div>
    `;
    screenManager.navigateTo("viewTask");
  },

  reopenTask() {
    updateTask(this.currentTaskId, { status: "Not Started" });
    screenManager.navigateTo(this.returnScreen);
  },

  close() {
    screenManager.navigateTo(this.returnScreen);
  }
};
