(function () {
  const SETTINGS_KEY = 'extensionConfig';

  tableau.extensions.initializeDialogAsync().then(() => {
    const dashboard = tableau.extensions.dashboardContent.dashboard;

    // Populate worksheet picker
    const select = document.getElementById('worksheet-select');
    dashboard.worksheets.forEach(ws => {
      const opt = document.createElement('option');
      opt.value = ws.name;
      opt.textContent = ws.name;
      select.appendChild(opt);
    });

    // Load existing config
    const raw = tableau.extensions.settings.get(SETTINGS_KEY);
    if (raw) {
      try {
        const cfg = JSON.parse(raw);
        if (cfg.worksheet) select.value = cfg.worksheet;
        // TODO: restore additional fields here
      } catch { /* ignore */ }
    }

    document.getElementById('save-btn').addEventListener('click', () => {
      const worksheet = select.value;
      if (!worksheet) {
        alert('Please select a worksheet.');
        return;
      }

      const config = {
        worksheet,
        buttonLabel: 'Run', // TODO: make this configurable if needed
        // TODO: add additional fields here
      };

      tableau.extensions.settings.set(SETTINGS_KEY, JSON.stringify(config));
      tableau.extensions.settings.saveAsync().then(() => {
        tableau.extensions.ui.closeDialog('saved');
      });
    });

    document.getElementById('cancel-btn').addEventListener('click', () => {
      tableau.extensions.ui.closeDialog('cancelled');
    });

  }).catch(err => console.error('Config init failed:', err));

})();
