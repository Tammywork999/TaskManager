// ============================================
// CORE DATA MANAGEMENT - app.js
// ============================================

const KEY = "ph_build12";
const PROJECTS_KEY = "ph_projects";
const BACKUP_DATE_KEY = "ph_backup_date";
const COLUMN_WIDTHS_KEY = "columnWidths";

const DEFAULT_PROJECTS = [];
const RECURRENCE_LABELS = {
  none: "Does not repeat",
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly"
};
const FOLLOW_UP_ICON = "🚩";
const RECURRING_ICON = "🔄";

// Initialize data storage
let tasks = normalizeTasks(JSON.parse(localStorage.getItem(KEY) || "[]"));
let projects = normalizeProjects(JSON.parse(localStorage.getItem(PROJECTS_KEY) || "[]"));
let currentSort = { field: null, ascending: true };
let columnWidths = {};

saveTasks();
saveProjects();

// ============================================
// UTILITY FUNCTIONS
// ============================================

function getTodayDate() {
  let today = new Date();
  let year = today.getFullYear();
  let month = String(today.getMonth() + 1).padStart(2, "0");
  let day = String(today.getDate()).padStart(2, "0");
  return year + "-" + month + "-" + day;
}

function fmtShort(d) {
  if (!d) return "";
  let x = new Date(d + "T00:00:00");
  let months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  let day = x.getDate();
  let month = months[x.getMonth()];
  let year = x.getFullYear();
  return day + " " + month + " " + year;
}

function formatDateDisplay(dateStr) {
  if (!dateStr) return "-";
  return fmtShort(dateStr);
}

function escapeHtml(text) {
  if (!text) return "";
  let div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function renderNotesWithLinks(text) {
  if (!text) return "-";
  let escaped = escapeHtml(text);
  let linked = escaped.replace(/((https?:\/\/|www\.)[^\s<]+)/gi, (match) => {
    let href = match.startsWith("http") ? match : `https://${match}`;
    return `<a href="${href}" target="_blank" rel="noopener noreferrer">${match}</a>`;
  });
  return linked.replace(/\n/g, "<br>");
}

function firstLine(text, maxLength = 100) {
  if (!text) return "";
  let line = text.split("\n")[0];
  return line.length > maxLength ? `${line.slice(0, maxLength)}...` : line;
}

function getTaskAreaLabel(task) {
  return task.area || "Unassigned";
}

function getFollowUpIcon(task) {
  return task.followUpDate ? FOLLOW_UP_ICON : "";
}

function getRecurringIcon(task) {
  return isRecurringTask(task) ? RECURRING_ICON : "";
}

function getRecurringLabel(task) {
  if (!isRecurringTask(task)) return "-";
  let label = RECURRENCE_LABELS[task.recurrenceType] || "Recurring";
  return task.recurrenceEndDate ? `${label} until ${formatDateDisplay(task.recurrenceEndDate)}` : label;
}

function compareDateStrings(a, b) {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  return new Date(`${a}T00:00:00`).getTime() - new Date(`${b}T00:00:00`).getTime();
}

function asDate(dateString) {
  let date = new Date(`${dateString}T00:00:00`);
  date.setHours(0, 0, 0, 0);
  return date;
}

function todayDateObject() {
  let today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function addDays(dateString, days) {
  let date = asDate(dateString);
  date.setDate(date.getDate() + days);
  return toDateInputValue(date);
}

function addMonths(dateString, months) {
  let date = asDate(dateString);
  let originalDay = date.getDate();
  date.setDate(1);
  date.setMonth(date.getMonth() + months);
  let lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  date.setDate(Math.min(originalDay, lastDay));
  return toDateInputValue(date);
}

function addYears(dateString, years) {
  let date = asDate(dateString);
  date.setFullYear(date.getFullYear() + years);
  return toDateInputValue(date);
}

function toDateInputValue(date) {
  let year = date.getFullYear();
  let month = String(date.getMonth() + 1).padStart(2, "0");
  let day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function sameDate(dateA, dateB) {
  return dateA.getFullYear() === dateB.getFullYear()
    && dateA.getMonth() === dateB.getMonth()
    && dateA.getDate() === dateB.getDate();
}

function isRecurringTask(task) {
  return !!(task && task.recurrenceType && task.recurrenceType !== "none" && task.seriesId);
}

function getNextRecurringDueDate(task) {
  if (!task || !task.dueDate) return "";
  if (task.recurrenceType === "daily") return addDays(task.dueDate, 1);
  if (task.recurrenceType === "weekly") {
    let targetDow = task.recurrenceDayOfWeek != null ? task.recurrenceDayOfWeek : null;
    if (targetDow != null) {
      let base = asDate(task.dueDate);
      base.setDate(base.getDate() + 1);
      while (base.getDay() !== targetDow) base.setDate(base.getDate() + 1);
      return toDateInputValue(base);
    }
    return addDays(task.dueDate, 7);
  }
  if (task.recurrenceType === "monthly") return addMonths(task.dueDate, 1);
  if (task.recurrenceType === "yearly") return addYears(task.dueDate, 1);
  return "";
}

function isWithinRecurrenceEndDate(task, dueDate) {
  if (!dueDate) return false;
  if (!task.recurrenceEndDate) return true;
  return compareDateStrings(dueDate, task.recurrenceEndDate) <= 0;
}

function getRecurringSeriesTasks(seriesId) {
  return tasks
    .filter(task => task.seriesId === seriesId)
    .sort((a, b) => compareDateStrings(a.dueDate, b.dueDate));
}

function ensureRecurringVisibility(seriesId) {
  let seriesTasks = getRecurringSeriesTasks(seriesId);
  if (seriesTasks.length === 0) return;
  let template = seriesTasks[0];
  let visibleCount = seriesTasks.filter(task => task.status !== "Completed").length;
  let latestTask = seriesTasks[seriesTasks.length - 1];

  while (visibleCount < 2) {
    let nextDueDate = getNextRecurringDueDate(latestTask);
    if (!nextDueDate || !isWithinRecurrenceEndDate(template, nextDueDate)) break;
    let nextTask = buildRecurringOccurrence(template, latestTask, nextDueDate);
    tasks.push(nextTask);
    latestTask = nextTask;
    visibleCount += 1;
  }
}

function buildRecurringOccurrence(templateTask, sourceTask, dueDate) {
  return {
    ...templateTask,
    id: Date.now() + Math.floor(Math.random() * 100000),
    dueDate,
    followUpDate: "",
    status: "Not Started",
    completedAt: null,
    createdAt: new Date().toISOString(),
    recurrenceParentId: sourceTask.id,
    recurrenceOverride: false
  };
}

function normalizeProjects(projectList) {
  let normalized = Array.isArray(projectList) ? projectList : [];
  let mapped = normalized
    .map(project => typeof project === "string"
      ? { name: project, hidden: false }
      : { name: project?.name || "", hidden: !!project?.hidden })
    .filter(project => project.name);

  mapped.sort((a, b) => a.name.localeCompare(b.name));
  return mapped;
}

function normalizeTask(task) {
  let normalized = { ...task };
  if (!Object.prototype.hasOwnProperty.call(normalized, "followUpDate")) {
    normalized.followUpDate = normalized.nextAction || "";
  }
  delete normalized.nextAction;

  normalized.createdAt = normalized.createdAt || new Date().toISOString();
  normalized.completedAt = normalized.completedAt || null;
  normalized.area = Object.prototype.hasOwnProperty.call(normalized, "area") ? normalized.area : "Work";
  normalized.priority = normalized.priority || "Low";
  normalized.status = normalized.status || "Not Started";
  normalized.project = normalized.project || "";
  normalized.notes = normalized.notes || "";
  normalized.focus = !!normalized.focus;
  normalized.pin = !!normalized.pin;
  normalized.recurrenceType = normalized.recurrenceType || "none";
  normalized.recurrenceEndDate = normalized.recurrenceEndDate || "";
  normalized.recurrenceDaysOfWeek = normalized.recurrenceDaysOfWeek || [];
  normalized.recurrenceDayOfWeek = normalized.recurrenceDayOfWeek != null ? normalized.recurrenceDayOfWeek : null;
  normalized.seriesId = normalized.seriesId || (normalized.recurrenceType !== "none" ? normalized.id : null);
  normalized.recurrenceParentId = normalized.recurrenceParentId || null;
  normalized.recurrenceOverride = !!normalized.recurrenceOverride;
  return normalized;
}

function normalizeTasks(taskList) {
  let normalized = Array.isArray(taskList) ? taskList.map(normalizeTask) : [];
  normalized.forEach(task => {
    if (isRecurringTask(task)) ensureRecurringVisibility(task.seriesId);
  });
  return normalized;
}

// ============================================
// KEYBOARD SHORTCUTS
// ============================================

function addDueDateShortcut(inputElement) {
  if (!inputElement) return;
  if (inputElement.__dueDateShortcutHandler) {
    inputElement.removeEventListener("keydown", inputElement.__dueDateShortcutHandler);
  }
  const handler = function (e) {
    if (e.ctrlKey && e.altKey && e.key.toLowerCase() === "t") {
      e.preventDefault();
      this.value = getTodayDate();
    }
  };
  inputElement.__dueDateShortcutHandler = handler;
  inputElement.addEventListener("keydown", handler);
}

function addNotesShortcut(textareaElement) {
  if (!textareaElement) return;
  if (textareaElement.__notesShortcutHandler) {
    textareaElement.removeEventListener("keydown", textareaElement.__notesShortcutHandler);
  }
  const handler = function (e) {
    if (e.ctrlKey && e.altKey && e.key === "d") {
      e.preventDefault();
      let now = new Date();
      let day = String(now.getDate()).padStart(2, "0");
      let month = String(now.getMonth() + 1).padStart(2, "0");
      let year = now.getFullYear();
      let timestamp = day + "/" + month + "/" + year + " - ";
      let currentText = this.value;
      this.value = timestamp + "\n" + currentText;
      let cursorPos = timestamp.length;
      this.selectionStart = cursorPos;
      this.selectionEnd = cursorPos;
      this.focus();
    }
  };
  textareaElement.__notesShortcutHandler = handler;
  textareaElement.addEventListener("keydown", handler);
}

// ============================================
// PROJECT MANAGEMENT
// ============================================

function addProject(projectName) {
  let trimmed = (projectName || "").trim();
  if (!trimmed) return;
  if (projects.some(project => project.name === trimmed)) return;
  projects.push({ name: trimmed, hidden: false });
  projects.sort((a, b) => a.name.localeCompare(b.name));
  saveProjects();
}

function updateProjectVisibility(projectName, hidden) {
  let project = projects.find(item => item.name === projectName);
  if (!project) return;
  project.hidden = !!hidden;
  saveProjects();
}

function getVisibleProjects() {
  return projects.filter(project => !project.hidden).sort((a, b) => a.name.localeCompare(b.name));
}

function saveProjects() {
  projects = normalizeProjects(projects);
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

// ============================================
// TASKS MANAGEMENT
// ============================================

function createTask(taskData) {
  let hasAreaField = Object.prototype.hasOwnProperty.call(taskData, "area");
  let recurrenceType = taskData.recurrenceType || "none";
  let task = normalizeTask({
    id: Date.now(),
    name: taskData.name || "",
    area: hasAreaField ? taskData.area : "Work",
    priority: taskData.priority || "Low",
    status: taskData.status || "Not Started",
    dueDate: taskData.dueDate || "",
    project: taskData.project || "",
    followUpDate: taskData.followUpDate || "",
    notes: taskData.notes || "",
    focus: taskData.focus || false,
    pin: taskData.pin || false,
    createdAt: new Date().toISOString(),
    completedAt: taskData.status === "Completed" ? new Date().toISOString() : null,
    recurrenceType,
    recurrenceEndDate: taskData.recurrenceEndDate || "",
    recurrenceDaysOfWeek: taskData.recurrenceDaysOfWeek || [],
    recurrenceDayOfWeek: taskData.recurrenceDayOfWeek != null ? taskData.recurrenceDayOfWeek : (recurrenceType === "weekly" && taskData.dueDate ? asDate(taskData.dueDate).getDay() : null),
    seriesId: recurrenceType !== "none" ? Date.now() + Math.floor(Math.random() * 1000) : null,
    recurrenceParentId: null,
    recurrenceOverride: false
  });
  tasks.push(task);
  if (isRecurringTask(task)) {
    ensureRecurringVisibility(task.seriesId);
  }
  saveTasks();
  return task;
}

function updateTask(taskId, taskData) {
  let taskIndex = tasks.findIndex(t => t.id === taskId);
  if (taskIndex === -1) return null;

  let existingTask = tasks[taskIndex];
  let wasCompleted = existingTask.status === "Completed";
  let mergedTask = normalizeTask({ ...existingTask, ...taskData });

  if (taskData.status === "Completed" && !existingTask.completedAt) {
    mergedTask.completedAt = new Date().toISOString();
  }
  if (taskData.status && taskData.status !== "Completed" && wasCompleted) {
    mergedTask.completedAt = null;
  }
  if (taskData.dueDate && existingTask.dueDate && taskData.dueDate !== existingTask.dueDate && isRecurringTask(existingTask)) {
    mergedTask.recurrenceOverride = true;
    if (existingTask.recurrenceType === "weekly" && existingTask.recurrenceDayOfWeek != null) {
      mergedTask.recurrenceDayOfWeek = existingTask.recurrenceDayOfWeek;
    }
  }

  tasks[taskIndex] = mergedTask;

  if (!wasCompleted && mergedTask.status === "Completed" && isRecurringTask(mergedTask)) {
    ensureRecurringVisibility(mergedTask.seriesId);
  }
  if (isRecurringTask(mergedTask)) {
    ensureRecurringVisibility(mergedTask.seriesId);
  }

  saveTasks();
  return tasks[taskIndex];
}

function deleteTask(taskId) {
  let taskIndex = tasks.findIndex(t => t.id === taskId);
  if (taskIndex !== -1) {
    let [deletedTask] = tasks.splice(taskIndex, 1);
    if (deletedTask && isRecurringTask(deletedTask)) {
      ensureRecurringVisibility(deletedTask.seriesId);
    }
    saveTasks();
    return true;
  }
  return false;
}

function getTaskById(taskId) {
  return tasks.find(t => t.id === taskId);
}

function saveTasks() {
  tasks = tasks.map(normalizeTask);
  localStorage.setItem(KEY, JSON.stringify(tasks));
}

// ============================================
// SORTING AND FILTERING
// ============================================

function getFilteredTasks() {
  let displayTasks = tasks.slice();
  let showCompleted = document.getElementById("showCompleted")?.checked ?? false;
  let showFairas = document.getElementById("showFairas")?.checked ?? true;
  let filterWork = document.getElementById("filterWork")?.checked ?? true;
  let filterPersonal = document.getElementById("filterPersonal")?.checked ?? true;
  let filterUnassigned = document.getElementById("filterUnassigned")?.checked ?? true;

  if (!showCompleted) {
    displayTasks = displayTasks.filter((t) => t.status !== "Completed");
  }

  if (!showFairas) {
    displayTasks = displayTasks.filter((t) => t.project !== "FAIRA");
  }

  let areaFilter = [];
  if (filterWork) areaFilter.push("Work");
  if (filterPersonal) areaFilter.push("Personal");
  if (filterUnassigned) areaFilter.push("");

  if (areaFilter.length > 0) {
    displayTasks = displayTasks.filter((t) => areaFilter.includes(t.area || ""));
  }

  if (currentSort.field) {
    displayTasks.sort((a, b) => {
      let aVal = a[currentSort.field];
      let bVal = b[currentSort.field];

      if (["dueDate", "followUpDate", "recurrenceEndDate"].includes(currentSort.field)) {
        return currentSort.ascending ? compareDateStrings(aVal, bVal) : compareDateStrings(bVal, aVal);
      }
      if (currentSort.field === "priority") {
        let priorityOrder = { Low: 1, Medium: 2, High: 3, Critical: 4 };
        aVal = priorityOrder[aVal] || 0;
        bVal = priorityOrder[bVal] || 0;
      } else if (currentSort.field === "status") {
        let statusOrder = {
          "Not Started": 1,
          "In Progress": 2,
          "Waiting on Someone Else": 3,
          Deferred: 4,
          Completed: 5
        };
        aVal = statusOrder[aVal] || 0;
        bVal = statusOrder[bVal] || 0;
      } else if (currentSort.field === "recurrenceType") {
        aVal = RECURRENCE_LABELS[aVal] || "";
        bVal = RECURRENCE_LABELS[bVal] || "";
      } else {
        aVal = (aVal || "").toString().toLowerCase();
        bVal = (bVal || "").toString().toLowerCase();
      }

      if (aVal < bVal) return currentSort.ascending ? -1 : 1;
      if (aVal > bVal) return currentSort.ascending ? 1 : -1;
      return 0;
    });
  }

  return displayTasks;
}

// ============================================
// INITIALIZATION
// ============================================

function initializeApp() {
  let dueDateInput = document.getElementById("dueDate");
  if (dueDateInput) addDueDateShortcut(dueDateInput);
  let notesInput = document.getElementById("notes");
  if (notesInput) addNotesShortcut(notesInput);
}

document.addEventListener("DOMContentLoaded", initializeApp);
