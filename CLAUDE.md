## Repo layout

One repo with npm workspaces (ADR-0001). Node 24.

- `apps/web`: React 19 and Webpack 5 web app, with Tailwind 4. It's a Module Federation remote that also runs on its own at `/wzq` (ADR-0006). Deploys to Vercel from this folder. Settings come from `SERVER_URL` (see `.env.example`). Every game on the site shares one origin, so name anything it keeps in the browser (`localStorage` keys, cookies) `wzq-<name>`, with hyphens only.
- `apps/server`: Express and Socket.IO game server. Deploys to Render from this folder. Settings come from `PORT` and `WEB_ORIGIN` (see `.env.example`).
- `packages/shared` (`@wzq/shared`): the Socket.IO event contract shared by web and server. It's compiled to `dist/`, so build it (`npm run build -w @wzq/shared`) before type-checking an app on its own. The root scripts do this for you.

Root commands: `npm run dev` (starts web and server together), `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`. The pre-commit hook runs lint and typecheck.

The old prototype is kept at the `prototype-v1` tag. `gdebojyoti/wzq.socket` is the retired prototype server and is not developed any more.

## Code style

The whole repo follows the code style of the sibling game `gdebojyoti/tactris`. Nothing enforces it: ESLint only checks for bugs. The style is:
- double quotes and semicolons
- trailing commas in multiline lists, objects and arguments
- `;` after each member of an interface or type literal
- parentheses around arrow-function parameters: `(x) =>`
- `function name(` with no space before the parenthesis
- components as `export default function`, helpers as arrow-function constants
- no blank lines between imports

There's no fixed line width: wrap where it reads well, which keeps most lines under 120 characters. Read tactris on GitHub for reference only, and keep every change inside this repo.

## Agent skills

### Issue tracker

All issues are tracked in GitHub Issues on `gdebojyoti/wzq`, using the `gh` CLI with an explicit `--repo gdebojyoti/wzq`. See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `GLOSSARY.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.
