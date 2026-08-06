// Backup import helper for TaskManager
(function () {
  const APP_KEY = "ph_build12";
  const PROJECTS_KEY = "ph_projects";
  const BACKUP_DATE_KEY = "ph_backup_date";

  function safeParse(json) {
    try {
      return JSON.parse(json);
    } catch (e) {
      return null;
    }
  }

  function chooseBackupTaskKey(localStorageObj) {
    if (Object.prototype.hasOwnProperty.call(localStorageObj, APP_KEY)) return APP_KEY;
    // find highest ph_buildN
    let best = null;
    let bestN = -1;
    Object.keys(localStorageObj || {}).forEach(k => {
      let m = k.match(/^ph_build(\d+)$/);
      if (m) {
        let n = parseInt(m[1], 10);
        if (n > bestN) {
          bestN = n; best = k;
        }
      }
    });
    if (best) return best;
    // fallback: any key that looks like tasks
    for (let k of Object.keys(localStorageObj || {})) {
      if (localStorageObj[k].startsWith("[")) return k;
    }
    return null;
  }

  function signatureOfTask(t) {
    if (!t) return JSON.stringify(t);
    let parts = [t.id || "", t.name || "", t.createdAt || "", t.notes || "", t.dueDate || ""];
    return parts.join("|");
  }

  function mergeTasksIntoApp(existingStr, incomingStr) {
    let existing = safeParse(existingStr) || [];
    let incoming = safeParse(incomingStr) || [];
    let sigs = new Set(existing.map(signatureOfTask));
    let added = 0;
    incoming.forEach(item => {
      let sig = signatureOfTask(item);
      if (!sigs.has(sig)) {
        existing.push(item);
        sigs.add(sig);
        added++;
      }
    });
    return { merged: existing, added };
  }

  function createHiddenFileInput() {
    let input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.id = 'backupImportFile';
    input.style.display = 'none';
    document.body.appendChild(input);
    return input;
  }

  function humanNow() { return new Date().toISOString().replace(/[:.]/g, '-'); }

  function handleFileContentText(text) {
    let payload = safeParse(text);
    if (!payload || typeof payload !== 'object' || !payload.localStorage) {
      alert('Invalid backup file: missing localStorage object');
      return;
    }

    let keys = Object.keys(payload.localStorage || {});
    if (keys.length === 0) {
      alert('Backup file contains no localStorage entries.');
      return;
    }

    let chosenKey = chooseBackupTaskKey(payload.localStorage);
    if (!chosenKey) {
      chosenKey = keys[0];
    }

    let backupTasksStr = payload.localStorage[chosenKey];
    if (!backupTasksStr) {
      alert('Backup does not contain a recognized tasks key.');
      return;
    }

    // Ask user: Replace or Merge. Default = Merge (Cancel)
    let replace = confirm('Import backup: OK = Replace all app data with backup, Cancel = Merge backup tasks into existing tasks (recommended).');

    if (replace) {
      // Double confirmation
      if (!confirm('REPLACE will overwrite your local application data. A backup of current localStorage will be saved. Click OK to continue.')) return;

      try {
        // create a full snapshot of current localStorage
        let snapshot = {};
        for (let i = 0; i < localStorage.length; i++) {
          let k = localStorage.key(i);
          snapshot[k] = localStorage.getItem(k);
        }
        localStorage.setItem('ph_localStorage_backup_before_import_' + humanNow(), JSON.stringify(snapshot));

        // clear current localStorage
        localStorage.clear();

        // restore keys from backup payload
        Object.keys(payload.localStorage).forEach(k => {
          try {
            localStorage.setItem(k, payload.localStorage[k]);
          } catch (e) {
            console.warn('Failed to set key', k, e);
          }
        });

        // set backup date
        localStorage.setItem(BACKUP_DATE_KEY, new Date().toISOString());

        alert('Backup restored (replace). The page will reload now.');
        location.reload();
      } catch (e) {
        console.error(e);
        alert('Import failed: ' + e.message);
      }

    } else {
      // Merge path - merge tasks into APP_KEY and merge projects if provided
      try {
        let existingStr = localStorage.getItem(APP_KEY) || '[]';
        let mergeResult = mergeTasksIntoApp(existingStr, backupTasksStr);
        localStorage.setItem(APP_KEY, JSON.stringify(mergeResult.merged));

        // Merge projects if present
        if (payload.localStorage[PROJECTS_KEY]) {
          try {
            let existingProj = safeParse(localStorage.getItem(PROJECTS_KEY)) || [];
            let incomingProj = safeParse(payload.localStorage[PROJECTS_KEY]) || [];
            // simple merge by name
            let names = new Set(existingProj.map(p => p.name));
            incomingProj.forEach(p => { if (!names.has(p.name)) existingProj.push(p); });
            localStorage.setItem(PROJECTS_KEY, JSON.stringify(existingProj));
          } catch (e) {
            console.warn('Failed to merge projects', e);
          }
        }

        localStorage.setItem(BACKUP_DATE_KEY, new Date().toISOString());
        alert('Backup merged. ' + mergeResult.added + ' new task(s) added. The page will reload now.');
        location.reload();
      } catch (e) {
        console.error(e);
        alert('Merge failed: ' + e.message);
      }
    }
  }

  function wireImportUI() {
    // create hidden file input
    let input = document.getElementById('backupImportFile') || createHiddenFileInput();
    input.addEventListener('change', (ev) => {
      let file = ev.target.files && ev.target.files[0];
      if (!file) return;
      let reader = new FileReader();
      reader.addEventListener('load', () => {
        handleFileContentText(reader.result);
        // reset input
        input.value = '';
      });
      reader.addEventListener('error', () => alert('Failed to read file'));
      reader.readAsText(file);
    });

    // try to add a visible Import button near the dashboard banner
    setTimeout(() => {
      let banners = document.getElementsByClassName('dashboard-banner');
      if (banners && banners.length) {
        let banner = banners[0];
        // avoid adding multiple times
        if (!document.getElementById('btnImportBackup')) {
          let btn = document.createElement('button');
          btn.id = 'btnImportBackup';
          btn.textContent = 'Import Backup';
          btn.style.marginLeft = '10px';
          btn.addEventListener('click', () => {
            input.click();
          });
          // try to find an existing button area - append to banner
          try { banner.appendChild(btn); } catch (e) { document.body.appendChild(btn); }
        }
      }
    }, 400);
  }

  document.addEventListener('DOMContentLoaded', wireImportUI);
})();
