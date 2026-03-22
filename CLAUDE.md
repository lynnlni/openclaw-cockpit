# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run lint     # Run ESLint
npm start        # Run production server
```

No test suite exists yet. When adding tests, use Jest + React Testing Library.

## Architecture

**OpenClaw Cockpit** is a Next.js 16 (App Router) ops console for managing OpenClaw AI agents on remote servers. It connects to remote machines via SSH (password/key auth) or Push (agentless token-based) connection types.

### Request Flow

1. Browser → `middleware.ts` (JWT verification, route protection)
2. API routes in `src/app/api/` handle business logic
3. SSH operations go through `src/lib/ssh/` (connection pooling via `node-ssh`)
4. Credentials are AES-256-GCM encrypted before storage

### Key Directories

- `src/app/api/` — API routes organized by resource (`/machines`, `/instances/[machineId]/*`, `/auth`, `/deploy`, `/skills`)
- `src/lib/` — Business logic organized by domain: `auth/`, `machines/`, `ssh/`, `deploy/`, `backup/`, `skills/`, `mcp/`, `config/`, `workspace/`, `analytics/`
- `src/hooks/` — SWR-based data fetching hooks (one per domain, e.g. `use-machines.ts`, `use-config.ts`)
- `src/store/` — React Context: `auth-context.tsx` (auth state), `machine-context.tsx` (selected machine)
- `src/components/` — Feature-organized UI components; `ui/` contains shadcn/ui primitives

### Data Fetching Pattern

SWR is used exclusively for client-side fetching. All API responses use the shape:
```typescript
{ success: boolean; data?: T; error?: string }
```
Response helpers `jsonSuccess()` / `jsonError()` in lib enforce this consistently.

### Authentication

- JWT stored in httpOnly cookies; verified at the edge in `middleware.ts`
- `useAuth()` hook from `src/store/auth-context.tsx` for client state
- CAPTCHA system added for public deployment (see `src/lib/auth/captcha.ts`)
- Server-side: `src/lib/auth/` handles JWT creation, password hashing (bcryptjs), user management

### SSH & Machine Operations

- `node-ssh` and `ssh2` are Next.js server external packages (configured in `next.config.ts`)
- API helpers `resolveMachine()` and `resolveMachineWithSSH()` are the entry points for machine-scoped operations
- SSH credentials never leave the server; passwords filtered from all API responses

### Validation

Zod schemas live in `src/lib/validation/` and are shared between client and server. Path traversal protection (`..` check) is applied to all file operation endpoints.

### Config & Types

- `src/lib/config/types.ts` — Core domain type definitions (actively modified)
- `src/components/layout/sidebar.tsx` — Navigation sidebar (actively modified)
- `@/*` path alias maps to `src/*`

### In-Progress Features (untracked in git)

- `src/app/analytics/` + `src/app/api/instances/[machineId]/analytics/` + `src/components/analytics/` + `src/hooks/use-analytics.ts` + `src/lib/analytics/` — Analytics system for machine performance tracking
- `src/hooks/use-debug-config.ts` — Debug config hook
