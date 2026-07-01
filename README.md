<h1 align="center">
    <a href="https://github.com/pixel-agents-hq/pixel-agents/discussions">
        <img src="webview-ui/public/banner.png" alt="Pixel Agents">
    </a>
</h1>

<h2 align="center" style="padding-bottom: 20px;">
  The game interface where AI agents build real things
</h2>

<div align="center" style="margin-top: 25px;">

[![version](https://img.shields.io/endpoint?url=https%3A%2F%2Fgist.githubusercontent.com%2Fpablodelucca%2F3cd28398fa4a2c0a636e1d51d41aee39%2Fraw%2Fversion.json)](https://github.com/pixel-agents-hq/pixel-agents/releases)
[![marketplaces](https://img.shields.io/endpoint?url=https%3A%2F%2Fgist.githubusercontent.com%2Fpablodelucca%2F3cd28398fa4a2c0a636e1d51d41aee39%2Fraw%2Finstalls.json)](https://marketplace.visualstudio.com/items?itemName=pablodelucca.pixel-agents)
[![stars](https://img.shields.io/github/stars/pixel-agents-hq/pixel-agents?logo=github&color=0183ff&style=flat)](https://github.com/pixel-agents-hq/pixel-agents/stargazers)
[![license](https://img.shields.io/github/license/pixel-agents-hq/pixel-agents?color=0183ff&style=flat)](https://github.com/pixel-agents-hq/pixel-agents/blob/main/LICENSE)
[![good first issues](https://img.shields.io/github/issues/pixel-agents-hq/pixel-agents/good%20first%20issue?color=7057ff&label=good%20first%20issues)](https://github.com/pixel-agents-hq/pixel-agents/issues?q=is%3Aopen+is%3Aissue+label%3A%22good+first+issue%22)

</div>

<div align="center">
<a href="https://marketplace.visualstudio.com/items?itemName=pablodelucca.pixel-agents">🛒 VS Code Marketplace</a> • <a href="https://github.com/pixel-agents-hq/pixel-agents/discussions">💬 Discussions</a> • <a href="https://github.com/pixel-agents-hq/pixel-agents/issues">🐛 Issues</a> • <a href="CONTRIBUTING.md">🤝 Contributing</a> • <a href="CHANGELOG.md">📋 Changelog</a>
</div>

<br/>

Pixel Agents turns multi-agent AI systems into something you can actually see and manage. Each agent becomes a character in a pixel art office. They walk around, sit at their desk, and visually reflect what they are doing — typing when writing code, reading when searching files, waiting when it needs your attention.

It ships in **two flavors from the same source tree**:

- **VS Code extension** — `pablodelucca.pixel-agents` on the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=pablodelucca.pixel-agents) and [Open VSX](https://open-vsx.org/extension/pablodelucca/pixel-agents). Agents spawn into VS Code terminals; characters render in the panel area.
- **Standalone CLI** — `npx pixel-agents` runs a local Fastify server and serves the office as a browser SPA. Useful in tmux workflows, remote sessions, or any environment without a desktop VS Code.

Internally, the architecture is provider-agnostic and platform-agnostic: a typed `HookProvider` interface defines the integration boundary so adding or replacing an AI backend is isolated to a provider module. This fork runs agents through OpenRouter's OpenAI-compatible Chat Completions API and does not require Claude CLI.

![Pixel Agents screenshot](webview-ui/public/Screenshot.jpg)

## Features

- **One agent, one character** — every OpenRouter agent terminal gets its own animated character
- **Live activity tracking** — characters animate based on what the agent is actually doing (writing, reading, running commands)
- **Office layout editor** — design your office with floors, walls, and furniture using a built-in editor
- **Speech bubbles** — visual indicators when an agent is waiting for input or needs permission
- **Sound notifications** — optional chime when an agent finishes its turn
- **Sub-agent visualization** — Task tool sub-agents spawn as separate characters linked to their parent
- **Persistent layouts** — your office design is saved and shared across VS Code windows
- **External asset directories** — load custom or third-party furniture packs from any folder on your machine
- **Diverse characters** — 6 diverse characters. These are based on the amazing work of [JIK-A-4, Metro City](https://jik-a-4.itch.io/metrocity-free-topdown-character-pack).

<p align="center">
  <img src="webview-ui/public/characters.png" alt="Pixel Agents characters" width="320" height="72" style="image-rendering: pixelated;">
</p>

## Requirements

- VS Code 1.105.0 or later
- Node.js 18 or later
- OpenRouter API key in `OPENROUTER_API_KEY`
- **Platform**: Windows, Linux, and macOS are supported

## Getting Started

If you just want to use Pixel Agents, the easiest way is to download the [VS Code extension](https://marketplace.visualstudio.com/items?itemName=pablodelucca.pixel-agents). If you want to play with the code, develop, or contribute, then:

### Install from source

```bash
git clone https://github.com/pixel-agents-hq/pixel-agents.git
cd pixel-agents
npm install      # npm workspaces installs root + server + webview-ui in one shot
npm run build
```

Then press **F5** in VS Code to launch the Extension Development Host.

### Configure OpenRouter

Pixel Agents reads OpenRouter settings from your shell environment. The bundled OpenRouter agent also loads a `.env` file from the workspace folder it starts in, so the simplest local setup is:

```env
OPENROUTER_API_KEY=your_api_key_here
OPENROUTER_MODEL=openai/gpt-4o-mini
```

`OPENROUTER_MODEL` is optional. If it is not set, Pixel Agents uses `openai/gpt-4o-mini` as a small, low-cost default model. You can change it to any OpenRouter chat model slug.

Windows PowerShell:

```powershell
$env:OPENROUTER_API_KEY="your_api_key_here"
$env:OPENROUTER_MODEL="openai/gpt-4o-mini"
```

macOS/Linux:

```bash
export OPENROUTER_API_KEY="your_api_key_here"
export OPENROUTER_MODEL="openai/gpt-4o-mini"
```

Optional generation controls:

```env
OPENROUTER_TEMPERATURE=0.4
OPENROUTER_MAX_TOKENS=1024
```

To try the **standalone CLI** locally:

```bash
node dist/cli.js                 # or npx pixel-agents [--port 3100] after publish
```

It starts the Fastify server, opens the webview SPA at `http://localhost:3100`, and (in the same `~/.pixel-agents/` namespace) shares your hooks and layout with the VS Code extension if both are running.

### Browser Preview & Hosted Reports

The browser-preview version of the webview can be built and staged for Vercel separately from the VS Code extension build.

```bash
npm run test
npm run e2e
npm run e2e -- --attach-videos-on-success
npm run vercel:prepare
```

Run `npm run test:report` separately when you want the combined Allure report locally without preparing the full Vercel output.

The staged Vercel output serves the standalone webview at `/webview/` and the Linux Allure report at `/reports/allure/`, combining the `e2e`, `server`, and `webview` suites. The GitHub Actions deploy job expects `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID` secrets.

### Usage

1. Open the **Pixel Agents** panel (it appears in the bottom panel area alongside your terminal)
2. Click **+ Agent** to spawn a new OpenRouter agent terminal and its character
3. Type a prompt in the terminal. The agent sends the conversation to OpenRouter and writes transcript events that Pixel Agents renders in real time
4. Click a character to select it, then click a seat to reassign it
5. Click **Layout** to open the office editor and customize your space

## Layout Editor

The built-in editor lets you design your office:

- **Floor** — Full HSB color control
- **Walls** — Auto-tiling walls with color customization
- **Tools** — Select, paint, erase, place, eyedropper, pick
- **Undo/Redo** — 50 levels with Ctrl+Z / Ctrl+Y
- **Export/Import** — Share layouts as JSON files via the Settings modal

The grid is expandable up to 64×64 tiles. Click the ghost border outside the current grid to grow it.

### Office Assets

All office assets (furniture, floors, walls) are now **fully open-source** and included in this repository under `webview-ui/public/assets/`. No external purchases or imports are needed — everything works out of the box.

Each furniture item lives in its own folder under `assets/furniture/` with a `manifest.json` that declares its sprites, rotation groups, state groups (on/off), and animation frames. Floor tiles are individual PNGs in `assets/floors/`, and wall tile sets are in `assets/walls/`. This modular structure makes it easy to add, remove, or modify assets without touching any code.

To add a new furniture item, create a folder in `webview-ui/public/assets/furniture/` with your PNG sprite(s) and a `manifest.json`, then rebuild. The asset manager (`scripts/asset-manager.html`) provides a visual editor for creating and editing manifests.

To use furniture from an external directory, open Settings → **Add Asset Directory**. See [docs/external-assets.md](docs/external-assets.md) for the full manifest format and how to use third-party asset packs.

Characters are based on the amazing work of [JIK-A-4, Metro City](https://jik-a-4.itch.io/metrocity-free-topdown-character-pack).

## How It Works

Pixel Agents now uses an OpenRouter provider:

- **LLM call path** — `server/src/providers/hook/openrouter/openrouterClient.ts` calls `https://openrouter.ai/api/v1/chat/completions` with `system`, `user`, and `assistant` messages.
- **Agent runner** — `dist/openrouter-agent.js` is launched in a terminal, loads `.env`, checks `OPENROUTER_API_KEY`, sends prompts to OpenRouter, prints replies to stdout, and writes JSONL transcript records.
- **Transcript path** — JSONL files are stored under `~/.pixel-agents/openrouter/projects/<project-hash>/<session-id>.jsonl`.

A single `HookProvider.normalizeHookEvent(raw)` translates each CLI's hook payload into a canonical `AgentEvent`. The shared `AgentRuntime` dispatches on `AgentEvent.kind`, mutates `AgentStateStore`, and the broadcast layer translates state events into typed `ServerMessage` over the active transport.

The webview runs a lightweight game loop with canvas rendering, BFS pathfinding, and a character state machine (idle → walk → type/read). Everything is pixel-perfect at integer zoom levels. Game state lives in an imperative `OfficeState` class outside React; React components read from it during render but don't own the state.

Claude CLI is not invoked and does not need to be installed.

## Tech Stack

Four-package monorepo, npm workspaces:

- **`core/`** — TypeScript-only protocol + interfaces (AsyncAPI 3.0 contract, `HookProvider`, `MessageTransport`, `StateAdapter`). Zero runtime side effects.
- **`server/`** — Fastify v5 (HTTP + WebSocket), Vitest. Owns `AgentRuntime`, `AgentStateStore`, `SessionRouter`, `DismissalTracker`, file watching, transcript parsing, providers. Ships the `npx pixel-agents` CLI.
- **`adapters/vscode/`** — VS Code Extension API. Composes `core/` + `server/` for the desktop surface.
- **`webview-ui/`** — React 19, Vite, Canvas 2D. Transport-agnostic (`PostMessageTransport` in VS Code, `WebSocketTransport` in the browser).

Builds: esbuild (extension + CLI + OpenRouter agent runner), Vite (webview SPA). Tests: Vitest (server + webview unit), Playwright (e2e against real VS Code + standalone Fastify).

## Known Limitations

- **Agent-terminal sync** — agents are connected to terminal instances and JSONL files. Rapid terminal close/reopen cycles can still briefly desync until the next scan.
- **Tool execution** — the OpenRouter runner is a lightweight chat agent. It does not execute local file tools by itself; it provides model responses through the existing Pixel Agents lifecycle.
- **Linux/macOS tip** — if you launch VS Code without a folder open (e.g. bare `code` command), agents will start in your home directory. This is supported; OpenRouter transcripts will be tracked under `~/.pixel-agents/openrouter/projects/` using your home directory as the project root.

## Troubleshooting

If your agent appears stuck on idle or doesn't spawn:

1. **Missing API key** — Set `OPENROUTER_API_KEY` in `.env` or your shell. The terminal prints `OPENROUTER_API_KEY is not set` when this is missing.
2. **Wrong model slug** — Set `OPENROUTER_MODEL` to a valid OpenRouter model slug. If unset, the default is `openai/gpt-4o-mini`.
3. **Debug View** — In the Pixel Agents panel, click the gear icon (Settings), then toggle **Debug View**. This shows JSONL file status, lines parsed, last data timestamp, and file path.
4. **Debug Console** — If you're running from source (Extension Development Host via F5), open VS Code's **View > Debug Console**. Search for `[Pixel Agents]` to see project directory resolution, JSONL polling status, and transcript parsing logs.

## Where This Is Going

The long-term vision is an interface where managing AI agents feels like playing the Sims, but the results are real things built.

- **Agents as characters** you can see, assign, monitor, and redirect, each with visible roles (designer, coder, writer, reviewer), stats, context usage, and tools.
- **Desks as directories** — drag an agent to a desk to assign it to a project or working directory.
- **An office as a project** — with a Kanban board on the wall where idle agents can pick up tasks autonomously.
- **Deep inspection** — click any agent to see its model, branch, system prompt, and full work history. Interrupt it, chat with it, or redirect it.
- **Token health bars** — rate limits and context windows visualized as in-game stats.
- **Fully customizable** — upload your own character sprites, themes, and office assets. Eventually maybe even move beyond pixel art into 3D or VR.

For this to work, the architecture needs to be modular at every level:

- **Platform-agnostic**: VS Code extension today, Electron app, web app, or any other host environment tomorrow.
- **Agent-agnostic**: OpenRouter today, but built to support Codex, OpenCode, Gemini, Cursor, Copilot, and others through composable adapters.
- **Theme-agnostic**: community-created assets, skins, and themes from any contributor.

We're actively working on the core module and adapter architecture that makes this possible. If you're interested to talk about this further, please visit our [Discussions Section](https://github.com/pixel-agents-hq/pixel-agents/discussions).

## Community & Contributing

Use **[Issues](https://github.com/pixel-agents-hq/pixel-agents/issues)** to report bugs or request features. Join **[Discussions](https://github.com/pixel-agents-hq/pixel-agents/discussions)** for questions and conversations.

See [CONTRIBUTING.md](CONTRIBUTING.md) for instructions on how to contribute.

Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before participating.

## Supporting the Project

If you find Pixel Agents useful, consider supporting its development:

<a href="https://github.com/sponsors/pablodelucca">
  <img src="https://img.shields.io/badge/Sponsor-GitHub-ea4aaa?logo=github" alt="GitHub Sponsors">
</a>
<a href="https://ko-fi.com/pablodelucca">
  <img src="https://img.shields.io/badge/Support-Ko--fi-ff5e5b?logo=ko-fi" alt="Ko-fi">
</a>

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=pixel-agents-hq/pixel-agents&type=Date)](https://www.star-history.com/?repos=pixel-agents-hq%2Fpixel-agents&type=date&legend=bottom-right)

## License

This project is licensed under the [MIT License](LICENSE).
