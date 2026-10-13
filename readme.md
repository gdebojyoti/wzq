# WZQ

**Wuziqi** (also called _Gomoku_ or _Five in a row_) is a turn-based strategy game. Imagine Tic-Tac-Toe, but you need five **Stones** in a row, instead of three, to **Win**. WZQ is an online two-player version played between friends.

## Repo layout

| Folder            | What it is                                              |
| ----------------- | ------------------------------------------------------- |
| `apps/web`        | The web app: Next.js and Tailwind.                      |
| `apps/server`     | The game server: Express and Socket.IO.                 |
| `packages/shared` | The event contract shared by the web app and server.    |

Decisions behind the setup are in [`docs/adr/`](docs/adr/), and the game's vocabulary is in [`GLOSSARY.md`](GLOSSARY.md).

## Development

Needs Node 24.

```sh
npm install
npm run dev        # web on http://localhost:3000, server on http://localhost:4000
```

Other commands, run from the root: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.

Both apps work without configuration locally. To change the defaults, copy `apps/server/.env.example` to `apps/server/.env`, or `apps/web/.env.example` to `apps/web/.env.local`.

The original prototype is kept at the `prototype-v1` tag.
