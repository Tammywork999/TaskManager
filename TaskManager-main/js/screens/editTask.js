// ============================================
// EDIT TASK SCREEN - js/screens/editTask.js
// ============================================

const editTaskScreen = {
  currentTaskId: null,
  returnScreen: "tasksList",
  overlayContext: null,

  show(taskId, returnScreen = "tasksList", overlayContext = null) {
    this.currentTaskId = taskId;
    this.returnScreen = returnScreen;
    this.overlayContext = overlayContext;
    let task = getTaskById(taskId);
    if (!task) {
      alert("Task not found");
      return;
    }

    let projectOptions = ['<option value="">-</option>']
      .concat(getVisibleProjects().map(project => `<option value="${escapeHtml(project.name)}" ${project.name === task.project ? 'selected' : ''}>${escapeHtml(project.name)}</option>`));

    let recurringDayOfWeekHTML = '';
    if (task.recurrenceType === "weekly") {
      recurringDayOfWeekHTML = `
        <div id="e_recurringDowContainer" style="display:block">
          <label>Days of Week</label>
          <div class="recurrence-dow-group">
            <label class="dow-label"><input type="checkbox" class="e_dow-check" value="1" ${task.recurrenceDaysOfWeek && task.recurrenceDaysOfWeek.includes(1) ? 'checked' : ''}> Mon</label>
            <label class="dow-label"><input type="checkbox" class="e_dow-check" value="2" ${task.recurrenceDaysOfWeek && task.recurrenceDaysOfWeek.includes(2) ? 'checked' : ''}> Tue</label>
            <label class="dow-label"><input type="checkbox" class="e_dow-check" value="3" ${task.recurrenceDaysOfWeek && task.recurrenceDaysOfWeek.includes(3) ? 'checked' : ''}> Wed</label>
            <label class="dow-label"><input type="checkbox" class="e_dow-check" value="4" ${task.recurrenceDaysOfWeek && task.recurrenceDaysOfWeek.includes(4) ? 'checked' : ''}> Thu</label>
            <label class="dow-label"><input type="checkbox" class="e_dow-check" value="5" ${task.recurrenceDaysOfWeek && task.recurrenceDaysOfWeek.includes(5) ? 'checked' : ''}> Fri</label>
            <label class="dow-label"><input type="checkbox" class="e_dow-check" value="6" ${task.recurrenceDaysOfWeek && task.recurrenceDaysOfWeek.includes(6) ? 'checked' : ''}> Sat</label>
            <label class="dow-label"><input type="checkbox" class="e_dow-check" value="0" ${task.recurrenceDaysOfWeek && task.recurrenceDaysOfWeek.includes(0) ? 'checked' : ''}> Sun</label>
            <button type="button" onclick="editTaskScreen.selectAllWeekdays(); return false;" style="padding:4px 10px;font-size:12px;margin:0">All Weekdays</button>
          </div>
        </div>
      `;
    } else {
      recurringDayOfWeekHTML = `<div id="e_recurringDowContainer" style="display:none"></div>`;
    }

    document.getElementById("editTaskContainer").innerHTML = `
      <div class="card">
        <div class="grid">
          <div class="full">
            <label>Task Name</label>
            <input id="e_taskName" value="${escapeHtml(task.name)}">
          </div>
          <div>
            <label>Area</label>
            <select id="e_area">
              <option ${task.area === "Work" ? "selected" : ""}>Work</option>
              <option ${task.area === "Personal" ? "selected" : ""}>Personal</option>
              <option ${!task.area ? "selected" : ""} value="">Unassigned</option>
            </select>
          </div>
          <div>
            <label>Project</label>
            <select id="e_projectInput">${projectOptions.join("")}</select>
          </div>
          <div>
            <label>Priority</label>
            <select id="e_priority">
              <option ${task.priority === "Low" ? "selected" : ""}>Low</option>
              <option ${task.priority === "Medium" ? "selected" : ""}>Medium</option>
              <option ${task.priority === "High" ? "selected" : ""}>High</option>
              <option ${task.priority === "Critical" ? "selected" : ""}>Critical</option>
            </select>
          </div>
          <div>
            <label>Status</label>
            <select id="e_status">
              <option ${task.status === "Not Started" ? "selected" : ""}>Not Started</option>
              <option ${task.status === "In Progress" ? "selected" : ""}>In Progress</option>
              <option ${task.status === "Waiting on Someone Else" ? "selected" : ""}>Waiting on Someone Else</option>
              <option ${task.status === "Deferred" ? "selected" : ""}>Deferred</option>
              <option ${task.status === "Completed" ? "selected" : ""}>Completed</option>
            </select>
          </div>
          <div>
            <label>Due Date (Ctrl+Alt+T for today)</label>
            <input id="e_dueDate" type="date" value="${task.dueDate || ""}">
          </div>
          <div>
            <label>Follow Up Date</label>
            <input id="e_followUpDate" type="date" value="${task.followUpDate || ""}">
          </div>
          <div>
            <label>Recurring</label>
            <select id="e_recurrenceType" onchange="editTaskScreen.onRecurrenceChange()">
              <option value="none" ${task.recurrenceType === "none" ? "selected" : ""}>Does not repeat</option>
              <option value="daily" ${task.recurrenceType === "daily" ? "selected" : ""}>Daily</option>
              <option value="weekly" ${task.recurrenceType === "weekly" ? "selected" : ""}>Weekly</option>
              <option value="monthly" ${task.recurrenceType === "monthly" ? "selected" : ""}>Monthly</option>
              <option value="yearly" ${task.recurrenceType === "yearly" ? "selected" : ""}>Yearly</option>
            </select>
          </div>
          ${recurringDayOfWeekHTML}
          <div>
            <label>Recurring End Date</label>
            <input id="e_recurrenceEndDate" type="date" value="${task.recurrenceEndDate || ""}">
          </div>
          <div>
            <label><input type="checkbox" id="e_focus" ${task.focus ? "checked" : ""}> Focus</label>
          </div>
          <div>
            <label><input type="checkbox" id="e_pin" ${task.pin ? "checked" : ""}> Add To My Day</label>
          </div>
          <div class="full">
            <label>Notes (Ctrl+Alt+D for date)</label>
            <textarea id="e_notes" rows="8">${escapeHtml(task.notes)}</textarea>
          </div>
        </div>
        <div class="task-meta-label">Date Created: ${new Date(task.createdAt).toLocaleString()}</div>
        <button onclick="editTaskScreen.saveTask(); return false;">Save</button>
        <button onclick="editTaskScreen.completeTask(); return false;" style="background-color:#28a745">Complete</button>
        <button onclick="editTaskScreen.deleteTask(); return false;" style="background-color:#dc3545">Delete</button>
        <button onclick="editTaskScreen.cancelEdit(); return false;" style="background-color:#6c757d">Cancel</button>
      </div>
    `;

    screenManager.navigateTo("editTask");
    setTimeout(() => {
      let dueDateInput = document.getElementById("e_dueDate");
      if (dueDateInput) addDueDateShortcut(dueDateInput);
      let notesInput = document.getElementById("e_notes");
      if (notesInput) addNotesShortcut(notesInput);
      this.setupChangeTracking();
    }, 0);
  },

  onRecurrenceChange() {
    let recurrenceType = document.getElementById("e_recurrenceType").value;
    let dowContainer = document.getElementById("e_recurringDowContainer");
    if (dowContainer) {
      dowContainer.style.display = recurrenceType === "weekly" ? "block" : "none";
    }
  },

  selectAllWeekdays() {
    let checkboxes = document.querySelectorAll(".e_dow-check");
    checkboxes.forEach(cb => {
      cb.checked = [1, 2, 3, 4, 5].includes(parseInt(cb.value));
    });
  },

  setupChangeTracking() {
    document.querySelectorAll("#editTaskContainer input, #editTaskContainer select, #editTaskContainer textarea")
      .forEach(input => {
        input.addEventListener("change", () => screenManager.markUnsavedChanges());
        input.addEventListener("input", () => screenManager.markUnsavedChanges());
      });
  },

  saveTask() {
    let recurrenceDaysOfWeek = [];
    let recurrenceDayOfWeek = null;
    let recurrenceType = document.getElementById("e_recurrenceType").value;
    
    if (recurrenceType === "weekly") {
      let checkboxes = document.querySelectorAll(".e_dow-check:checked");
      recurrenceDaysOfWeek = Array.from(checkboxes).map(cb => parseInt(cb.value));
      if (recurrenceDaysOfWeek.length > 0) {
        recurrenceDayOfWeek = recurrenceDaysOfWeek[0];
      }
    }

    updateTask(this.currentTaskId, {
      name: document.getElementById("e_taskName").value,
      area: document.getElementById("e_area").value,
      priority: document.getElementById("e_priority").value,
      status: document.getElementById("e_status").value,
      dueDate: document.getElementById("e_dueDate").value,
      project: document.getElementById("e_projectInput").value,
      followUpDate: document.getElementById("e_followUpDate").value,
      notes: document.getElementById("e_notes").value,
      focus: document.getElementById("e_focus").checked,
      pin: document.getElementById("e_pin").checked,
      recurrenceType: recurrenceType,
      recurrenceEndDate: document.getElementById("e_recurrenceEndDate").value,
      recurrenceDaysOfWeek: recurrenceDaysOfWeek,
      recurrenceDayOfWeek: recurrenceDayOfWeek
    });
    screenManager.clearUnsavedChanges();
    
    if (this.returnScreen === "dashboard" && this.overlayContext) {
      dashboardScreen.overlayContext = this.overlayContext;
      dashboardScreen.renderOverlay();
      screenManager.navigateTo(this.returnScreen);
    } else {
      screenManager.navigateTo(this.returnScreen);
    }
  },

  completeTask() {
    updateTask(this.currentTaskId, { status: "Completed" });
    screenManager.clearUnsavedChanges();
    
    if (this.returnScreen === "dashboard" && this.overlayContext) {
      dashboardScreen.overlayContext = this.overlayContext;
      dashboardScreen.renderOverlay();
      screenManager.navigateTo(this.returnScreen);
    } else {
      screenManager.navigateTo(this.returnScreen);
    }
  },

  deleteTask() {
    if (!confirm("Are you sure you want to delete this task?")) return;
    deleteTask(this.currentTaskId);
    screenManager.clearUnsavedChanges();
    
    if (this.returnScreen === "dashboard" && this.overlayContext) {
      dashboardScreen.overlayContext = this.overlayContext;
      dashboardScreen.renderOverlay();
      screenManager.navigateTo(this.returnScreen);
    } else {
      screenManager.navigateTo(this.returnScreen);
    }
  },

  cancelEdit() {
    screenManager.clearUnsavedChanges();
    
    if (this.returnScreen === "dashboard" && this.overlayContext) {
      dashboardScreen.overlayContext = this.overlayContext;
      dashboardScreen.renderOverlay();
      screenManager.navigateTo(this.returnScreen);
    } else {
      screenManager.navigateTo(this.returnScreen);
    }
  }
};
