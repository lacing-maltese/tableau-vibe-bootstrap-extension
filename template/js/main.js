(function () {
  const SETTINGS_KEY = 'extensionConfig';

  // Update this URL after deploying to GitHub Pages
  const CONFIG_DIALOG_URL = 'https://your-github-username.github.io/your-repo-name/config.html';

  let config = null;

  function showState(id) {
    ['not-configured', 'ready', 'loading'].forEach(s => {
      document.getElementById(s).classList.add('hidden');
    });
    document.getElementById(id).classList.remove('hidden');
  }

  function setStatus(msg, type) {
    const el = document.getElementById('status');
    el.textContent = msg;
    el.className = 'status ' + (type || '');
  }

  function loadConfig() {
    const raw = tableau.extensions.settings.get(SETTINGS_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  }

  function applyConfig(cfg) {
    config = cfg;
    document.getElementById('btn-label').textContent = cfg.buttonLabel || 'Run';
  }

  function openConfig() {
    tableau.extensions.ui.displayDialogAsync(CONFIG_DIALOG_URL, '', { height: 600, width: 480 })
      .then(() => {
        const cfg = loadConfig();
        if (cfg) {
          applyConfig(cfg);
          showState('ready');
          document.getElementById('action-btn').addEventListener('click', onActionClick);
        }
      })
      .catch(err => {
        if (err.errorCode !== tableau.ErrorCodes.DialogClosedByUser) {
          console.error('Config dialog error:', err);
        }
      });
  }

  async function onActionClick() {
    const dashboard = tableau.extensions.dashboardContent.dashboard;
    const ws = dashboard.worksheets.find(w => w.name === config.worksheet);

    if (!ws) {
      setStatus('Worksheet not found.', 'error');
      return;
    }

    const marksData = await ws.getSelectedMarksAsync();
    const dataTable = marksData.data[0];

    if (!dataTable || dataTable.data.length === 0) {
      return; // empty selection — ignore silently
    }

    const columns = dataTable.columns;
    const rows = dataTable.data.map(row => ({
      pairs: columns.map((col, i) => ({
        fieldName: col.fieldName,
        value: row[i].formattedValue,
      }))
    }));

    // TODO: replace this with your extension's action
    console.log('Selected rows:', rows);
    setStatus(`${rows.length} mark${rows.length !== 1 ? 's' : ''} selected`, 'success');
  }

  tableau.extensions.initializeAsync({ configure: openConfig }).then(() => {
    const cfg = loadConfig();
    const isAuthor = tableau.extensions.environment.mode === 'authoring';

    if (!cfg || !cfg.worksheet) {
      showState('not-configured');
      if (isAuthor) {
        document.getElementById('configure-btn').addEventListener('click', openConfig);
      } else {
        document.getElementById('configure-btn').style.display = 'none';
        document.querySelector('#not-configured .hint').textContent =
          'This extension has not been configured. Contact the dashboard author.';
      }
      return;
    }

    applyConfig(cfg);
    showState('ready');
    document.getElementById('action-btn').addEventListener('click', onActionClick);

    tableau.extensions.settings.addEventListener(
      'settings-changed',
      () => { const updated = loadConfig(); if (updated) applyConfig(updated); }
    );
  }).catch(err => console.error('Init failed:', err));

})();
