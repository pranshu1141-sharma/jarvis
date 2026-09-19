# Tools connected on this computer

The earlier Claude backend discovered three external tool servers with 46 tool
entry points. JARVIS now uses Codex by default, which loads tools from your
Codex configuration. These Claude MCP entries are not automatically imported
into Codex.

When Codex is unavailable, JARVIS answers general
questions with the installed `gemma3:4b` model through local Ollama. This
fallback needs Ollama running and does not have access to JARVIS's live tools;
desktop and browser actions need corresponding tools configured for Codex.

| Connection | Tools | Purpose |
| --- | ---: | --- |
| `jarvis-windows` | 20 | Inspect the desktop, work with application windows, mouse and keyboard, files, clipboard, processes, and Windows settings. |
| `jarvis-playwright` | 24 | Work with Chrome pages, tabs, forms, page content, screenshots, and browser diagnostics. |
| `jarvis-codex` | 2 | Start and continue a Codex session using the installed Codex CLI and its own configuration. |

The Windows integration provides general desktop automation. It is not a
separate native integration for each installed application. Detected applications
include Office, Chrome, Edge, Firefox, VS Code, GitHub Desktop, Notion, Discord,
FL Studio, FreeCAD, Arduino IDE, Acrobat, VLC, and Ollama. Individual workflows
inside those applications have not been tested.

## Current operating mode

The Codex backend starts in read-only mode. Desktop
snapshots, display information, waiting, and selected browser inspection tools
are permitted. Browser tools that explicitly save files require action mode.

Application control, typing, file changes, browser navigation/actions, and Codex
delegation require JARVIS action mode. To use that mode, stop
the running JARVIS instance first, then run:

```powershell
npm start -- --writes
```

This enables Codex's workspace-write sandbox. JARVIS runs Codex without
interactive approval prompts, so keep read-only mode for ordinary questions.

## Codex connection limits

The installed Codex plugin inventory includes Gmail, Canva, GitHub, Figma,
Firebase, documents, spreadsheets, presentations, PDF, browser tools, and other
skills. The Codex connection is delegation to Codex, not a direct export of all
those individual tools into Claude.

Tool discovery for the Codex server passed. An actual model turn and individual
account-connected tools have not been tested through JARVIS. Availability still
depends on Codex's session support, login, and permissions. Codex desktop task
management and other app-only capabilities are not copied into JARVIS.

The Playwright connection uses its own Chrome profile; it does not copy existing
browser cookies. Account websites may require signing in there. JARVIS's
original Claude Chrome-extension integration remains a separate connection.

## Installation and verification

- Windows MCP 0.8.5 and dependencies: `C:/Users/HP/.jarvis/tools/desktop`.
- Playwright MCP and its lockfile: `C:/Users/HP/.jarvis/tools/browser`.
- Connection definitions: the `mcpServers` section in `C:/Users/HP/.claude.json`.
  JARVIS already reads this file, so these entries are also visible to Claude
  Code. The prior file was backed up under `C:/Users/HP/.jarvis` before editing.
- Tool names and descriptions: `C:/Users/HP/.jarvis/tool-inventory.json`.
- Windows server usage telemetry is disabled in this connection's environment.

Verified: discovery of all 46 tools; a Windows display-inventory call; Chrome
navigation to the JARVIS page; JARVIS health and its WebSocket announcement of
all three connections; Python dependency consistency; five permission regression
tests. Lint completes with the repository's two existing unused-variable warnings.

Run the permission tests with:

```powershell
node --test bridge/tool-policy.test.mjs
```

Integration references: [Windows MCP](https://github.com/CursorTouch/Windows-MCP),
[Playwright MCP](https://github.com/microsoft/playwright-mcp), and
[Codex plugins](https://learn.chatgpt.com/docs/plugins).
