# OpenClaw Cockpit

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/lynnlni/openclaw-cockpit/releases)
[![License](https://img.shields.io/badge/license-GPL--3.0-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)

Web-based management cockpit for [OpenClaw](https://github.com/lynnlni/openclaw) AI agent instances. Deploy, configure, and monitor your AI agents across multiple remote servers from a single interface.

OpenClaw Cockpit is the **ops console for OpenClaw** — it replaces the tedious SSH + manual config editing workflow with a unified web interface. Here's what you can do with it:

- **Multi-machine ops panel** — Monitor all your servers at a glance: online status, OpenClaw installation state, service health, and version info.
- **One-click deploy & upgrade** — A guided wizard handles remote installation and upgrades, eliminating manual steps.
- **Centralized config management** — Manage Providers (models & API keys), Channels, MCP Servers, and Skills from one place.
- **Workspace editor** — Edit `AGENTS.md`, `SOUL.md`, `MEMORY.md`, and other files directly in the browser to quickly tune agent behavior.
- **Backup & recovery** — Take snapshots, import/export configs, and roll back when things go wrong.
- **Team & multi-environment management** — Ideal for managing local machines, home servers, and cloud hosts (dev / staging / production) simultaneously.

**In one sentence:** OpenClaw Cockpit is the ops control plane for people who want to standardize AI agent deployment and management.

English | [中文](README_ZH.md)

---

## Features

### Machine Management

Register and manage remote servers via SSH. Supports both password and private key authentication. Credentials are encrypted locally with AES-256-GCM.

### Deployment

Guided deployment wizard that handles the full lifecycle:

- Environment detection (OS, architecture, Node.js, package manager)
- Automated Node.js + OpenClaw installation
- Workspace initialization
- Service start / stop / restart / upgrade
- Real-time deployment logs

### Skills

Discover, install, and manage AI skills:

- Browse installed skills with enable/disable toggle
- Discover new skills from configurable GitHub repositories
- One-click install from remote repos
- Create and edit custom skills locally
- Manage skill source repositories

### MCP Servers

Configure [Model Context Protocol](https://modelcontextprotocol.io) servers:

- Support for stdio, HTTP, and SSE transports
- Environment variable and argument configuration
- Per-server enable/disable control

### Providers

Manage LLM providers and API keys:

- Multi-provider support (OpenAI, Anthropic, local LLMs, custom endpoints)
- Model defaults and fallback chain configuration
- Secure API key storage

### Channels

Configure communication channels for your AI agents. Add, edit, enable/disable channels with per-channel settings.

### Backup & Recovery

- Create and restore full snapshots
- Export / import configuration archives
- Clone configurations across machines
- Safety snapshots before restore operations

### Workspace Editor

Edit all workspace configuration files through a browser-based CodeMirror editor:

| File | Purpose |
|------|---------|
| `openclaw.json` | Core configuration (JSON editor) |
| `IDENTITY.md` | AI identity and characteristics |
| `AGENTS.md` | Agent behavior rules |
| `TOOLS.md` | Tool usage guidelines |
| `SOUL.md` | Personality and communication style |
| `MEMORY.md` | Memory structure documentation |
| `USER.md` | User profile and preferences |
| `BOOTSTRAP.md` | Startup procedure |
| `HEARTBEAT.md` | Scheduled tasks and intervals |

### Memory

Browse and edit workspace markdown files with a resizable two-panel layout. Includes a daily memory view organized by date.

### Dashboard

Real-time overview of all registered machines showing connectivity, installation status, service state, and version information.

## Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| UI | shadcn/ui, Radix UI, Tailwind CSS 4 |
| Editor | CodeMirror (JSON + Markdown) |
| Data Fetching | SWR |
| Validation | Zod |
| SSH | node-ssh |

## Getting Started

```bash
# Clone the repository
git clone https://github.com/lynnlni/openclaw-cockpit.git
cd openclaw-cockpit

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and add your first machine.

### Production

```bash
npm run build
npm start
```

## Configuration

### Environment Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `ENCRYPTION_KEY` | Master key for encrypting stored credentials | Built-in default key |

### Local Data

Machine configurations are stored at `~/.openclaw-cockpit/machines.json`. Passwords are encrypted at rest. No credentials are sent to the browser.

## Quick Start Guide

1. Start the cockpit and go to **Machines** — add your remote server
2. Go to **Deploy** — install OpenClaw on the server
3. Configure **Providers** — add your LLM API keys
4. Set up **Channels** — configure how the agent communicates
5. Manage **Skills** — install capabilities from GitHub repos
6. Edit **Workspace** files — customize agent behavior

## Project Structure

```
src/
├── app/                    # Next.js pages and API routes
│   ├── api/                # Server-side API endpoints
│   ├── dashboard/          # Overview page
│   ├── machines/           # Machine management
│   ├── deploy/             # Deployment wizard
│   ├── skills/             # Skill management
│   ├── mcp/                # MCP server config
│   ├── providers/          # LLM provider config
│   ├── channels/           # Channel config
│   ├── backups/            # Backup & recovery
│   ├── memory/             # Memory file editor
│   └── workspace/          # Workspace config pages
├── components/             # React components by feature
├── hooks/                  # Custom React hooks (SWR-based)
├── lib/                    # Business logic and utilities
│   ├── backup/             # Snapshot operations
│   ├── config/             # Config parsing and serialization
│   ├── deploy/             # Deployment scripts and installer
│   ├── machines/           # Machine CRUD and encryption
│   ├── mcp/                # MCP server management
│   ├── skills/             # Skill discovery and management
│   ├── ssh/                # SSH connection pool and file ops
│   ├── validation/         # Zod schemas
│   └── workspace/          # Workspace file utilities
└── store/                  # React Context state management
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[GPL-3.0](LICENSE)
