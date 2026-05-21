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
> Use this repo as your reference: https://github.com/lacing-maltese/tableau-vibe-bootstrap-extension — it includes a template and a scaffolding prompt for building Tableau extensions. Read the README and scaffolding prompt to understand the constraints, then scaffold the extension into a new directory I can host myself.

Replace the bracketed parts with your extension name and description. The AI will read the README, orient itself on the template and constraints, and scaffold the extension from there.

---

## What the AI will walk you through

When you use the scaffolding prompt, the AI takes you through the full process end to end:

1. **Build** — generates all extension files tailored to what you described
2. **Host** — pushes files to a public GitHub repo and enables GitHub Pages (or another HTTPS host of your choice)
3. **Allowlist** — adds the extension URL to your Tableau Cloud site so it's permitted to run
4. **Install** — drops the `.trex` manifest onto a dashboard in edit mode
5. **Configure** — if your extension has author settings, uses the Configure button to set them up
6. **Test** — verifies it works as a viewer, not just an author

You don't need to know how any of these steps work — the AI handles them. This list is just so you know what's coming.

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
- [Tableau Developer Community](https://trailhead.salesforce.com/trailblazer-community/neighborhoods/tableau)
