# Single repo with npm workspaces

The prototype was split across two repos (`wzq` and `wzq.socket`), and the event types copied between them by hand had already drifted apart. The rebuild is one repo with npm workspaces: `apps/web` (Next.js), `apps/server` (Express and Socket.IO) and `packages/shared` (the event contract, and later the game rules), so the contract between web and server lives in one place. Each app still deploys on its own, from its own root folder.
