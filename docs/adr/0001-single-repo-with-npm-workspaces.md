# 0001: Single repo with npm workspaces

## Status
Accepted

## Context
WZQ was split into two repos, `wzq` (frontend) and `wzq.socket` (backend), which drifted apart. Their shared types were copied by hand and had already diverged.

## Decision
Keep one repo, `gdebojyoti/wzq`, with npm workspaces:
- `apps/web`: Next.js 16, Tailwind 4, strict TypeScript.
- `apps/server`: Node 24, Express, Socket.IO, TypeScript. Uses `tsx` for development and `tsc` for builds.
- `packages/shared`: event types shared by both apps. Game rules go here later.

Root has one shared TypeScript base config, ESLint 9, and Husky pre-commit.

## Consequences
- The contract between web and server lives in one place.
- Each app deploys independently, with its own root directory on Vercel and Render.
