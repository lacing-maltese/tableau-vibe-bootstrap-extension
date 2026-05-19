Scaffold a working Tableau dashboard extension from scratch. Generate all required files and wire up the Tableau Extensions API correctly based on field-tested patterns.

## Step 0 — Ground-truth against official samples before scaffolding

Before generating any files, fetch real working samples from the official repo to verify that this skill's patterns match what Tableau actually ships. Changelog scans miss structural errors that have been wrong for a long time — only a working sample can catch those.

**0a. Fetch a canonical sample manifest to verify manifest structure:**
```
https://raw.githubusercontent.com/tableau/extensions-api/main/Samples/Dashboard/UINamespace/UINamespace.trex
```
Compare against the manifest template in this skill. Check: which `xmlns` namespace is used, whether `<dashboard-extension>` wrapper is present, the required child elements and their order, whether `<name>` is plain text or has a `<text>` child, where `<min-api-version>` sits. If the sample differs from this skill's template, use the sample as ground truth and note the discrepancy.

**0b. Fetch a canonical sample JS to verify event patterns:**
```
https://raw.githubusercontent.com/tableau/extensions-api/main/Samples/Dashboard/UINamespace/UINamespace.js
```
Check: how event listeners are registered, what the exact string or enum used for mark selection is, whether `tableau.TableauEventType.*` enum references or string literals are used. If the sample differs from this skill's patterns, use the sample as ground truth and note the discrepancy.

**0c. Check release notes for changes since 1.16.0:**
```
https://github.com/tableau/extensions-api/releases
```
Look specifically for: changes to manifest format, `initializeAsync`/`initializeDialogAsync`/`displayDialogAsync`, `getSelectedMarksAsync`, data table structure, environment properties, settings, events, or filter APIs.

If any fetch is unreachable, proceed with this skill's patterns and note that the check was skipped.

---

## What to produce

1. `manifest.trex` — extension manifest
2. `index.html` — extension panel (what renders inside the dashboard zone)
3. `config.html` — configuration dialog (authors only)
4. `js/main.js` — panel logic
5. `js/config.js` — config dialog logic
6. `css/styles.css` — shared styles
7. A self-hosted copy of the Tableau Extensions API JS at `js/tableau.extensions.1.latest.min.js` — fetch from `https://raw.githubusercontent.com/tableau/extensions-api/main/lib/tableau.extensions.1.latest.min.js`

Ask the user for: extension name, what it does, the GitHub Pages URL it will be hosted at (or a placeholder). Do not ask for anything else — fill in sensible defaults.

---

## Official references

- Docs: https://tableau.github.io/extensions-api/docs/
- GitHub + samples: https://github.com/tableau/extensions-api (see `Samples-Typescript/Dashboard/` for feature-scoped examples)
- API reference: https://tableau.github.io/extensions-api/docs/api_ref.html
- Free developer sandbox (Tableau Cloud site for testing): https://www.tableau.com/developer/get-site
- TypeScript types package: `@tableau/extensions-api-types`

---

## Dashboard Extensions vs. Viz Extensions

This skill scaffolds **dashboard extensions** — they run in a zone on a dashboard and interact with the dashboard and its worksheets.

**Viz extensions** are a different type: they render custom visualizations inside a worksheet (replacing the native viz). They require API version 1.11+, Tableau 2024.2+, use `<worksheet-extension>` in the manifest instead of `<dashboard-extension>`, and use a completely different API surface (`worksheetContent` namespace, encoding definitions, `selectTuplesAsync`, etc.). Do not mix the two. If the user wants a viz extension, flag this and research separately.

---

## Hard-won constraints — follow every one of these

### Manifest (`manifest.trex`)

- Namespace: `xmlns="http://www.tableau.com/xml/extension_manifest"` — the older `addin_manifest` namespace is rejected by Tableau Cloud
- `<dashboard-extension id="com.your-org.your-extension" extension-version="1.0.0">` wraps all content — the `id` must be unique (reverse-domain style)
- Required child elements **in this order**: `<default-locale>`, `<name>`, `<description>`, `<author>`, `<min-api-version>`, `<source-location>`, `<icon>`, `<permissions>`
- `<name>` is **plain text** — **never** `<name><text>My Extension</text></name>`. That syntax belongs to the old `addin_manifest` format and will fail on Tableau Cloud with `no declaration found for element 'text'`. Correct: `<name>My Extension</name>`
- `<min-api-version>` is a **sibling of** `<source-location>`, not nested inside it
- `<author>` is required — include `name`, `email`, `organization`, `website` attributes
- `<source-location>` must use a valid HTTPS URL — Tableau Cloud rejects anything else
- `<icon>` is required — use this base64 PNG placeholder if you have no icon:
  `iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==`
- `<permissions>` must include `<permission>full data</permission>` for mark/data access

Correct structure (verified against official Tableau samples):
```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest manifest-version="0.1" xmlns="http://www.tableau.com/xml/extension_manifest">
  <dashboard-extension id="com.your-org.your-extension-name" extension-version="1.0.0">
    <default-locale>en_US</default-locale>
    <name>Extension Name</name>
    <description>What it does.</description>
    <author name="Your Name" email="you@example.com" organization="Your Org" website="https://your-site.com"/>
    <min-api-version>1.4</min-api-version>
    <source-location>
      <url>https://your-pages-url/index.html</url>
    </source-location>
    <icon>iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==</icon>
    <permissions>
      <permission>full data</permission>
    </permissions>
  </dashboard-extension>
</manifest>
```

---

### Self-hosting the Extensions API JS

Never use a CDN URL for the Tableau Extensions API JS — CDN URLs fail on Tableau Cloud with `ERR_NAME_NOT_RESOLVED` inside the extension iframe. Always include `js/tableau.extensions.1.latest.min.js` as a local file in the repo and load it with a relative path.

---

### Config dialog URL — must be hardcoded

`window.location` inside a Tableau Cloud iframe returns the Tableau Cloud path, not the extension URL. This means `window.location.origin + '/config.html'` will produce a broken URL.

Always hardcode the config dialog URL as a string literal:

```javascript
function openConfig() {
  const url = 'https://your-pages-url/config.html'; // hardcoded — window.location doesn't work in Tableau Cloud iframe
  tableau.extensions.ui.displayDialogAsync(url, '', { height: 720, width: 520 })
    .then(closePayload => {
      // closePayload is whatever the dialog passed to initializeDialogAsync's close
      const cfg = loadConfig();
      if (cfg) applyConfig(cfg);
    })
    .catch(err => {
      if (err.errorCode !== tableau.ErrorCodes.DialogClosedByUser) {
        console.error('Config dialog error:', err);
      }
    });
}
```

---

### Config dialog must be triggered by user gesture

`displayDialogAsync` cannot be called on page load — Tableau blocks it. It must be triggered by a button click. Do not auto-open the config dialog.

---

### Config dialog initialization

The config dialog page must call `initializeDialogAsync()` (not `initializeAsync()`) to initialize:

```javascript
// In config.html's script
tableau.extensions.initializeDialogAsync().then(() => {
  // load current settings, populate form
  const raw = tableau.extensions.settings.get('myConfigKey');
  // ...
});

// To close the dialog and return a value to the parent:
tableau.extensions.ui.closeDialog('optional-return-payload');
```

---

### Author vs. viewer mode

Check `tableau.extensions.environment.mode === 'authoring'` to distinguish dashboard authors from published viewers. The Configure button and all configuration UI must only appear to authors. Viewers in published dashboards should see only the extension's functional UI.

```javascript
const isAuthor = tableau.extensions.environment.mode === 'authoring';
if (isAuthor) {
  document.getElementById('configure-btn').addEventListener('click', openConfig);
} else {
  document.getElementById('configure-btn').style.display = 'none';
}
```

---

### Initialization pattern

Always call `tableau.extensions.initializeAsync()` before accessing any API. Pass `{ configure: openConfig }` to wire up the right-click configure menu item for authors.

```javascript
tableau.extensions.initializeAsync({ configure: openConfig })
  .then(() => {
    // safe to access tableau.extensions.* here
  })
  .catch(err => console.error('Init failed:', err));
```

---

### Persisting configuration

Use `tableau.extensions.settings` to store and retrieve config. Settings travel with the workbook — no external storage needed for configuration.

**`settings.saveAsync()` only works in authoring mode.** Calling it in viewing mode will fail. Always check mode before saving.

```javascript
// Save — authoring mode only
if (tableau.extensions.environment.mode === 'authoring') {
  tableau.extensions.settings.set('myConfigKey', JSON.stringify(configObj));
  await tableau.extensions.settings.saveAsync();
}

// Load (works in any mode)
const raw = tableau.extensions.settings.get('myConfigKey');
const config = raw ? JSON.parse(raw) : null;

// Listen for settings changes (e.g., after config dialog closes)
tableau.extensions.settings.addEventListener(
  'settings-changed',
  () => { const updated = loadConfig(); if (updated) applyConfig(updated); }
);
```

There is no documented size limit for settings, but keep them small — store field names and config, not data.

---

### Getting selected marks

```javascript
const dashboard = tableau.extensions.dashboardContent.dashboard;
const ws = dashboard.worksheets.find(w => w.name === worksheetName);
const marksData = await ws.getSelectedMarksAsync();
const dataTable = marksData.data[0];

if (!dataTable || dataTable.data.length === 0) {
  // Empty selection — handle gracefully, do not throw
  return;
}

const columns = dataTable.columns;
const rows = dataTable.data.map(row => ({
  pairs: columns.map((col, i) => ({
    fieldName: col.fieldName,
    value: row[i].formattedValue, // always a formatted string e.g. "12,873" not 12873
  }))
}));
```

Values are always formatted strings — type coercion must happen downstream.

**10,000 row limit:** `getSelectedMarksAsync()` and `getSummaryDataAsync()` return at most 10,000 rows. When truncated, `dataTable.isTotalRowCountLimited` is `true`. For large datasets use `DataTableReader` with `getPageAsync()` for paginated access (up to 4,000,000 rows total).

---

### Event system

Listen to worksheet and dashboard events with `addEventListener`. Always store the handler reference so you can remove it and avoid duplicate triggers.

**Use string literals for event names, not `tableau.TableauEventType.*` enum references.** The enum is populated lazily inside the API bundle and can be `undefined` at call time, causing a silent `unsupported-event-name` error. The string values are stable and safe to use directly.

```javascript
// Mark selection changes
const onMarksSelected = async (event) => {
  const marks = await event.getMarksAsync();
  // process marks
};
ws.addEventListener('mark-selection-changed', onMarksSelected);

// Filter changes
ws.addEventListener('filter-changed', async (event) => {
  const filter = await event.getFilterAsync();
  console.log('Filter changed:', filter.fieldName);
});

// Parameter changes
const params = await dashboard.getParametersAsync();
params[0].addEventListener('parameter-changed', (event) => {
  console.log('Parameter changed:', event);
});

// Settings changes
tableau.extensions.settings.addEventListener('settings-changed', () => {
  const updated = loadConfig();
  if (updated) applyConfig(updated);
});

// Cleanup (prevent memory leaks and duplicate triggers)
ws.removeEventListener('mark-selection-changed', onMarksSelected);
```

Event string reference:

| Event | String literal |
|-------|---------------|
| Mark selection | `'mark-selection-changed'` |
| Filter changed | `'filter-changed'` |
| Parameter changed | `'parameter-changed'` |
| Settings changed | `'settings-changed'` |
| Summary data changed | `'summary-data-changed'` |
| Dashboard layout changed | `'dashboard-layout-changed'` |
| Worksheet formatting changed | `'worksheet-formatting-changed'` |

---

### Filters and Parameters

```javascript
// Get all filters on a worksheet
const filters = await ws.getFiltersAsync();

// Apply a categorical filter
await ws.applyFilterAsync('Region', ['East', 'West'], tableau.FilterUpdateType.Replace);

// Get all parameters on the dashboard
const params = await dashboard.getParametersAsync();
const param = params.find(p => p.name === 'MyParameter');

// Change a parameter value
await param.changeValueAsync('NewValue');
```

Known issue (GitHub #447): `appliedValues` from `CategoricalFilter` can fall out of sync when using context filters — a documented bug with no workaround.

---

### Getting the current user

`triggered_by` is always `"unknown"` on Tableau Cloud — the Extensions API does not expose user identity in cloud deployments. It is populated on Tableau Server (on-premise). On Tableau 2023.2+, `environment.uniqueUserId` provides a deployment-unique identifier (not a human-readable username).

```javascript
function getCurrentUser() {
  try {
    const u = tableau.extensions.environment.currentUser;
    return u.displayName || u.username || 'unknown';
  } catch {
    return 'unknown';
  }
}
```

---

### Environment properties

```javascript
const env = tableau.extensions.environment;
env.apiVersion      // e.g. "1.16.0"
env.context         // "Desktop" or "Server" (Cloud reports "Server")
env.mode            // "authoring" or "viewing"
env.language        // ISO 639 code
env.locale          // RFC 5646 format
env.tableauVersion  // Tableau version string
env.operatingSystem // OS name
// Tableau 2023.2+ only:
env.uniqueUserId    // deployment-unique user identifier (not a username)
// Tableau 2022.2+ only:
env.country         // ISO 3166 country code
```

---

### Outbound HTTP from the extension

Browser security requires one of two approaches:

**Direct mode** — works with any endpoint but you can't confirm success:
```javascript
fetch(url, {
  method: 'POST',
  mode: 'no-cors',
  headers: { 'Content-Type': 'text/plain' }, // must be text/plain to avoid CORS preflight
  body: JSON.stringify(payload),
});
// Response is always opaque in no-cors mode — you cannot check status
```

**Proxy mode** — use when you need to confirm delivery, hide credentials, or sign requests:
```javascript
fetch(proxyUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});
// Full response available — check response.ok
```

For platforms like MuleSoft that require CORS headers, proxy mode is required. Sandboxed extensions (Tableau Cloud) cannot make any external HTTP calls — proxy mode running on your own domain, or using the Tableau Cloud allowlist, is required in that environment.

---

### Error handling

All `tableau.extensions.*Async()` methods return promises that can reject. Unhandled rejections fail silently. Always add `.catch()`:

```javascript
tableau.extensions.initializeAsync({ configure: openConfig })
  .then(() => { /* ... */ })
  .catch(err => console.error('Init failed:', err));

// For parallel fetches:
const [marks, filters, params] = await Promise.all([
  ws.getSelectedMarksAsync(),
  ws.getFiltersAsync(),
  dashboard.getParametersAsync(),
]);
```

---

### TypeScript support

The Extensions API has TypeScript definitions via `@tableau/extensions-api-types`. Add it as a dev dependency and configure `tsconfig.json` with `typeRoots` pointing to `./node_modules/@tableau` alongside `./node_modules/@types`. Import types from `@tableau/extensions-api-types` directly. At runtime, use `tableau.EnumName` rather than importing enum values as types.

---

### Tableau Cloud deployment checklist

Before testing on Tableau Cloud:

1. Extension must be hosted at an HTTPS URL
2. The URL must be allowlisted: **Tableau Cloud → Settings → Extensions → Add Extension by URL**
3. Enable **Allow to run with network access** on the allowlist entry
4. The manifest `<url>` must exactly match the allowlisted URL
5. Tableau Cloud caches extensions aggressively — use incognito + remove/re-add the extension zone when debugging caching issues
6. If hosting on GitHub Pages: the repo must be public, or Pages must be explicitly enabled
7. Sandboxed extensions (Tableau Cloud) cannot make external HTTP calls — all external requests must go through a server-side proxy
8. To simulate the Cloud sandbox environment locally, use `npm run start-sandbox` from the extensions-api repo

---

## Steps

1. Ask the user for the extension name, what it does, and the hosting URL (or use a placeholder).
2. Create the directory structure.
3. Fetch and save the Tableau Extensions API JS to `js/tableau.extensions.1.latest.min.js`.
4. Generate `manifest.trex` using the exact structure above.
5. Generate `index.html`, `config.html`, `js/main.js`, `js/config.js`, `css/styles.css` tailored to what the extension does — use the constraints above throughout.
6. Remind the user to:
   - Push to GitHub and enable GitHub Pages (or their hosting of choice)
   - Update the hardcoded config dialog URL in `js/main.js` once they have the real URL
   - Allowlist the extension URL on Tableau Cloud with network access enabled
   - Download `manifest.trex` and add it to their dashboard in edit mode
   - Get a free Tableau Cloud developer site at https://www.tableau.com/developer/get-site for testing
