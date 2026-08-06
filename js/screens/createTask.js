// ============================================
// CREATE TASK SCREEN - js/screens/createTask.js
// ============================================

const createTaskScreen = {
  initializeProjectList() {
    this.updateProjectOptions();
    this.updateDateCreatedLabel();
  },

  updateProjectOptions(selectedValue = "") {
    let select = document.getElementById("projectInput");
    if (!select) return;
    let options = ['<option value="">-</option>']
      .concat(getVisibleProjects().map(project => `<option value="${escapeHtml(project.name)}">${escapeHtml(project.name)}</option>`));
    select.innerHTML = options.join("");
    select.value = selectedValue;
  },

  updateDateCreatedLabel() {
    let label = document.getElementById("createDateCreated");
    if (label) {
      label.textContent = new Date().toLocaleString();
    }
  },

  onRecurrenceChange() {
    let recurrenceType = document.getElementById("recurrenceType").value;
    let dowContainer = document.getElementById("recurringDowContainer");
    if (dowContainer) {
      // Use flex so the recurrence day-of-week checkboxes render horizontally with the new CSS
      dowContainer.style.display = recurrenceType === "weekly" ? "flex" : "none";
    }
  },

  selectAllWeekdays() {
    let checkboxes = document.querySelectorAll(".dow-check");
    checkboxes.forEach(cb => {
      cb.checked = [1, 2, 3, 4, 5].includes(parseInt(cb.value));
    });
  },

  addTask() {
    let taskName = document.getElementById("taskName").value.trim();
    if (!taskName) {
      alert("Please enter a task name");
      return;
    }

    let recurrenceDaysOfWeek = [];
    let recurrenceDayOfWeek = null;
    let recurrenceType = document.getElementById("recurrenceType").value;
    
    if (recurrenceType === "weekly") {
      let checkboxes = document.querySelectorAll(".dow-check:checked");
      recurrenceDaysOfWeek = Array.from(checkboxes).map(cb => parseInt(cb.value));
      if (recurrenceDaysOfWeek.length > 0) {
        recurrenceDayOfWeek = recurrenceDaysOfWeek[0];
      }
    }

    let taskData = {
      name: taskName,
      area: document.getElementById("area").value,
      priority: document.getElementById("priority").value,
      status: document.getElementById("status").value,
      dueDate: document.getElementById("dueDate").value,
      project: document.getElementById("projectInput").value,
      followUpDate: document.getElementById("followUpDate").value,
      notes: document.getElementById("notes").value,
      focus: document.getElementById("focus").checked,
      pin: document.getElementById("addToMyDay").checked,
      recurrenceType: recurrenceType,
      recurrenceEndDate: document.getElementById("recurrenceEndDate").value,
      recurrenceDaysOfWeek: recurrenceDaysOfWeek,
      recurrenceDayOfWeek: recurrenceDayOfWeek
    };

    createTask(taskData);
    this.clearForm();
    screenManager.clearUnsavedChanges();
    this.showSuccessMessage();
  },

  clearForm() {
    document.getElementById("taskName").value = "";
    document.getElementById("area").value = "Work";
    document.getElementById("priority").value = "Low";
    document.getElementById("status").value = "Not Started";
    document.getElementById("dueDate").value = "";
    document.getElementById("projectInput").value = "";
    document.getElementById("followUpDate").value = "";
    document.getElementById("recurrenceType").value = "none";
    document.getElementById("recurrenceEndDate").value = "";
    document.getElementById("notes").value = "";
    document.getElementById("focus").checked = false;
    document.getElementById("addToMyDay").checked = false;
    let dowContainer = document.getElementById("recurringDowContainer");
    if (dowContainer) {
      dowContainer.style.display = "none";
      let checkboxes = document.querySelectorAll(".dow-check");
      checkboxes.forEach(cb => cb.checked = false);
    }
    this.updateDateCreatedLabel();
    document.getElementById("taskName").focus();
  },

  showSuccessMessage() {
    let feedback = document.createElement("div");
    feedback.style.cssText = "position:fixed;top:20px;right:20px;background:#28a745;color:white;padding:15px 20px;border-radius:4px;box-shadow:0 2px 8px rgba(0,0,0,0.2);z-index:2000;font-weight:bold";
    feedback.textContent = "✓ Task created successfully!";
    document.body.appendChild(feedback);
    setTimeout(() => feedback.remove(), 2500);
  },

  saveTask() {
    this.addTask();
  }
};

document.addEventListener("DOMContentLoaded", () => {
  createTaskScreen.initializeProjectList();
  let recurrenceSelect = document.getElementById("recurrenceType");
  if (recurrenceSelect) {
    recurrenceSelect.addEventListener("change", () => createTaskScreen.onRecurrenceChange());
  }
  let formInputs = ["taskName", "area", "projectInput", "priority", "status", "dueDate", "followUpDate", "recurrenceType", "recurrenceEndDate", "focus", "addToMyDay", "notes"];
  formInputs.forEach(id => {
    let element = document.getElementById(id);
    if (!element) return;
    element.addEventListener("change", () => {
      if (hasFormContent()) screenManager.markUnsavedChanges();
    });
    element.addEventListener("input", () => {
      if (hasFormContent()) screenManager.markUnsavedChanges();
    });
  });
  let dowCheckboxes = document.querySelectorAll(".dow-check");
  dowCheckboxes.forEach(cb => {
    cb.addEventListener("change", () => {
      if (hasFormContent()) screenManager.markUnsavedChanges();
    });
  });
});

function hasFormContent() {
  return ["taskName", "projectInput", "dueDate", "followUpDate", "recurrenceEndDate", "notes"]
    .some(id => document.getElementById(id)?.value.trim())
    || document.getElementById("focus")?.checked
    || document.getElementById("addToMyDay")?.checked
    || document.getElementById("recurrenceType")?.value !== "none"
    || Array.from(document.querySelectorAll(".dow-check:checked")).length > 0;
}
