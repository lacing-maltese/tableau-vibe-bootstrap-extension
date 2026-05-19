# Tableau Vibe Bootstrap Extension

A starter kit for building Tableau dashboard extensions with AI assistance (Claude Code or similar). Includes a deployable template, a scaffolding prompt for any AI coding assistant, and hard-won lessons from production deployments on Tableau Cloud.

## What's here

```
template/               Fork-and-deploy starting point for any dashboard extension
  manifest.trex         Extension manifest (update URL before deploying)
  index.html            Extension panel — renders inside the dashboard zone
  config.html           Configuration dialog — authors only
  js/main.js            Panel logic: init, auth/viewer mode, mark selection, action
  js/config.js          Config dialog: worksheet picker, settings save/load
  css/styles.css        Shared styles (Tableau color palette)
  js/tableau.extensions.1.latest.min.js   (add this — see Setup below)

prompts/
  tableau-extension.md  AI scaffolding prompt — paste into any AI coding assistant

.claude/skills/
  tableau-extension/    Same prompt as a Claude Code skill (invokable as /tableau-extension)
```

## Who this is for

Dashboard developers who want to build custom Tableau extensions and are using Claude Code (or another AI coding assistant) to accelerate the work. The template gives you a working, deployable shell in minutes. The skill gives Claude the context it needs to build the right thing without rediscovering common pitfalls.

## Quick start

If you're starting a new extension project, use this as your opening prompt with your AI assistant of choice:

> I want to build a Tableau dashboard extension called "[your extension name]". [Describe what it does in one or two sentences.]
>
> Use this repo as your reference: https://github.com/bhartSF/tableau-vibe-bootstrap-extension — it includes a template and a scaffolding prompt for building Tableau extensions. Read the README and scaffolding prompt to understand the constraints, then scaffold the extension into a new directory I can host myself.

Replace the bracketed parts with your extension name and description. The AI will read the README, orient itself on the template and constraints, and scaffold the extension from there.

---

## Deploying the template

### 1. Get the Extensions API JS

The Tableau Extensions API JS file is not included in this repo (it's large and versioned separately). Download it and place it at `template/js/tableau.extensions.1.latest.min.js`:

```
https://github.com/tableau/extensions-api/raw/main/lib/tableau.extensions.1.latest.min.js
```

Do not use a CDN URL in your HTML — CDN URLs fail inside the Tableau Cloud iframe.

### 2. Copy and deploy

1. Copy the `template/` directory into your own repo
2. Push to your host of choice — GitHub Pages works well for this:
   - Enable GitHub Pages: **Settings → Pages → Deploy from branch → main**
   - Your Pages URL will be: `https://your-username.github.io/your-repo-name/`

### 3. Update the two hardcoded URLs

In `manifest.trex`:
```xml
<url>https://your-username.github.io/your-repo-name/index.html</url>
```

In `js/main.js`:
```javascript
const CONFIG_DIALOG_URL = 'https://your-username.github.io/your-repo-name/config.html';
```

These must be hardcoded — `window.location` does not work inside the Tableau Cloud extension iframe.

### 4. Allowlist on Tableau Cloud

**Settings → Extensions → Add Extension by URL**

Paste your Pages URL (`index.html`). Enable **Allow to run with network access**.

### 5. Add to a dashboard

In a dashboard (edit mode), drag an **Extension** object onto the canvas. Select **My Extensions**, choose `manifest.trex`, and accept the prompt.

## Using the scaffolding prompt

`prompts/tableau-extension.md` contains everything an AI assistant needs to scaffold a new extension correctly — all the Tableau Cloud-specific constraints, field-tested patterns, and a step-by-step process. How you load it depends on which tool you're using.

### Claude Code

The `.claude/skills/tableau-extension/` directory registers the prompt as a slash command. From a Claude Code session in this repo:

```
/tableau-extension I want an extension that sends selected marks to a Slack channel
```

Claude will check for API changes, then generate all files tailored to what you described.

### Cursor

Add the prompt as a Project Rule so it applies automatically:

1. Open the Command Palette → **Cursor: Open Project Rules**
2. Create a new rule, paste in the contents of `prompts/tableau-extension.md`
3. Set the rule to apply to this project

Then describe what you want in chat:

```
Scaffold a new Tableau extension that sends selected marks to a Slack channel
```

### Windsurf

Add the prompt as a global or workspace rule:

1. Open Settings → **Cascade Rules**
2. Create a new rule, paste in the contents of `prompts/tableau-extension.md`

Then describe what you want in chat.

### Any other tool (Copilot, ChatGPT, etc.)

Paste the contents of `prompts/tableau-extension.md` directly into the conversation, then follow it with your request:

```
[paste prompts/tableau-extension.md]

Build me an extension that sends selected marks to a Slack channel.
```

## Template structure

The template implements the standard shell for any dashboard extension:

- **Three states**: loading → not-configured (authors see Configure button, viewers see a message) → ready (action button + status)
- **Author vs. viewer mode**: Configure button only shown in authoring mode; settings only saved in authoring mode
- **Mark selection**: `getSelectedMarksAsync()` wired to the action button — replace the `TODO` in `main.js` with your logic
- **Config dialog**: Worksheet picker + settings save/load; add your own fields in the `TODO` sections
- **Settings persistence**: Config travels with the workbook via `tableau.extensions.settings`

## Examples built on this template

- **[Dashboard Relay](../tableau-extension-dashboard-relay/)** — sends selected mark data as JSON to any automation platform (Zapier, Make, Power Automate, n8n, MuleSoft). Adds: field mapping UI, proxy with HMAC signing, agent instructions for AI workflows.

## Resources

- [Tableau Extensions API docs](https://tableau.github.io/extensions-api/docs/)
- [Extensions API GitHub + samples](https://github.com/tableau/extensions-api)
- [Free Tableau Cloud developer site](https://www.tableau.com/developer/get-site) — for testing without a paid subscription
- [Tableau Developer Community](https://trailhead.salesforce.com/trailblazer-community/neighborhoods/tableau)
