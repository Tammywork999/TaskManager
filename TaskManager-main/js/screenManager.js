// ============================================
// SCREEN MANAGER - screenManager.js
// ============================================

const screenManager = {
  currentScreen: "dashboard",
  previousScreen: "dashboard",
  pendingNavigation: null,
  hasUnsavedChanges: false,
  currentEditTaskId: null,

  // ============================================
  // NAVIGATION
  // ============================================

  navigateTo(screenName) {
    // Check for unsaved changes
    if (this.hasUnsavedChanges && screenName !== this.currentScreen) {
      this.pendingNavigation = screenName;
      this.showUnsavedChangesModal();
      return;
    }

    this._changeScreen(screenName);
  },

  _changeScreen(screenName) {
    // Hide all screens
    document.querySelectorAll(".screen").forEach(screen => {
      screen.classList.remove("active");
    });

    // Show new screen
    let newScreen = document.getElementById(`screen-${screenName}`);
    if (newScreen) {
      newScreen.classList.add("active");
    }

    // Update sidebar active state
    document.querySelectorAll(".nav-item").forEach(item => {
      item.classList.remove("active");
    });
    let activeNav = document.querySelector(`.nav-item[data-screen="${screenName}"]`);
    if (activeNav) {
      activeNav.classList.add("active");
    }

    this.previousScreen = this.currentScreen;
    this.currentScreen = screenName;
    this.hasUnsavedChanges = false;

    // Initialize screen-specific functionality
    this._initializeScreen(screenName);
  },

  _initializeScreen(screenName) {
    if (screenName === "dashboard") {
      setTimeout(() => {
        dashboardScreen.render();
      }, 0);
    } else if (screenName === "myDay") {
      setTimeout(() => {
        myDayScreen.render();
      }, 0);
    } else if (screenName === "tasksList") {
      setTimeout(() => {
        tasksListScreen.render();
      }, 0);
    } else if (screenName === "faira") {
      setTimeout(() => {
        fairaScreen.render();
      }, 0);
    } else if (screenName === "reports") {
      setTimeout(() => {
        reportsScreen.render();
      }, 0);
    } else if (screenName === "settings") {
      setTimeout(() => {
        settingsScreen.render();
      }, 0);
    } else if (screenName === "createTask") {
      // Setup shortcuts when navigating to create task
      setTimeout(() => {
        createTaskScreen.initializeProjectList();
        let dueDateInput = document.getElementById("dueDate");
        if (dueDateInput) addDueDateShortcut(dueDateInput);
        let notesInput = document.getElementById("notes");
        if (notesInput) addNotesShortcut(notesInput);
      }, 0);
    }
  },

  showHome() {
    this.navigateTo("dashboard");
  },

  // ============================================
  // UNSAVED CHANGES DETECTION
  // ============================================

  markUnsavedChanges() {
    this.hasUnsavedChanges = true;
  },

  clearUnsavedChanges() {
    this.hasUnsavedChanges = false;
  },

  showUnsavedChangesModal() {
    document.getElementById("unsavedChangesModal").classList.add("active");
  },

  hideUnsavedChangesModal() {
    document.getElementById("unsavedChangesModal").classList.remove("active");
  },

  saveAndNavigate() {
    // Call the appropriate save function based on current screen
    if (this.currentScreen === "editTask") {
      editTaskScreen.saveTask();
    } else if (this.currentScreen === "createTask") {
      createTaskScreen.saveTask();
    }

    this.hideUnsavedChangesModal();
    
    // Navigate after save
    if (this.pendingNavigation) {
      let nextScreen = this.pendingNavigation;
      this.pendingNavigation = null;
      this._changeScreen(nextScreen);
    }
  },

  discardChanges() {
    this.clearUnsavedChanges();
    this.hideUnsavedChangesModal();

    if (this.pendingNavigation) {
      let nextScreen = this.pendingNavigation;
      this.pendingNavigation = null;
      this._changeScreen(nextScreen);
    }
  },

  cancelNavigation() {
    this.pendingNavigation = null;
    this.hideUnsavedChangesModal();
  }
};

// ============================================
// KEYBOARD NAVIGATION
// ============================================

document.addEventListener("keydown", (e) => {
  // Alt + 1 = Dashboard
  if (e.altKey && e.key === "1") {
    e.preventDefault();
    screenManager.navigateTo("dashboard");
  }
  // Alt + 2 = My Day
  if (e.altKey && e.key === "2") {
    e.preventDefault();
    screenManager.navigateTo("myDay");
  }
  // Alt + 3 = Create Task
  if (e.altKey && e.key === "3") {
    e.preventDefault();
    screenManager.navigateTo("createTask");
  }
  // Alt + 4 = View All Tasks
  if (e.altKey && e.key === "4") {
    e.preventDefault();
    screenManager.navigateTo("tasksList");
  }
});
