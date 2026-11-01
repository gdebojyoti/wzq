# WZQ

**Wuziqi** (also called _Gomoku_ or _Five in a row_) is a turn-based strategy game. Imagine Tic-Tac-Toe, but you need five **Stones** in a row, instead of three, to **Win**. WZQ is an online two-player version played between friends.

## Playing against an AI

You can play WZQ against Claude, on the free or Pro plan. You play on the web app at https://tablehop.games/wzq as usual, and Claude takes its Turns through WZQ's MCP server, which you add to Claude as a custom connector: a remote MCP server added by its URL. Only Claude is supported for now. Other AI clients, such as ChatGPT or Gemini, aren't.

To add WZQ to Claude:

1. Go to **Settings → Connectors → Add → Add custom connector**.
2. Give it any **Name**, such as `WZQ`.
3. Set **MCP server URL** to `https://api.wzq.tablehop.games/mcp`.
4. Click **Continue**.

Then, in a new conversation, ask Claude to play: "Play a game of WZQ", "Play a game of Wuziqi" or "Let's play a game of Five in a Row". Claude can host the Game and give you a Game code to enter on the web app, or join a Game you host if you give it the Game code. Two Claude conversations can also play each other.

Known limits:

- Claude only acts while it's answering a message. If it stops during a long Game, tell it to keep going.
- A conversation stays the same Player through the Player key WZQ gives it. A new conversation is a new Player, so it can't carry on another conversation's Game.
- If Claude stops playing, it still shows as connected for up to 15 minutes. After that, a Game it hosts in the Lobby is abandoned. To end an ongoing Game it has stopped playing, use Leave game.
- Claude keeps the tool definitions it fetched when the connector was added. If WZQ's tools change and Claude says a tool needs something its definition doesn't list, such as `playerKey`, reconnect the WZQ connector in **Settings → Connectors**, or remove it and add it again, then start a new conversation.

## Repo layout

| Folder            | What it is                                              |
| ----------------- | ------------------------------------------------------- |
| `apps/web`        | The web app: React, Webpack 5 and Tailwind.             |
| `apps/server`     | The game server: Express, Socket.IO and the MCP server. |
| `packages/shared` | The event contract shared by the web app and server.    |

Decisions behind the setup are in [`docs/adr/`](docs/adr/), and the game's vocabulary is in [`GLOSSARY.md`](GLOSSARY.md).

## Development

Needs Node 24.

```sh
npm install
npm run dev        # web on http://localhost:8081/wzq, server on http://localhost:4000
```

Other commands, run from the root: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.

Both apps work without configuration locally. To change the defaults, copy `apps/server/.env.example` to `apps/server/.env`, or `apps/web/.env.example` to `apps/web/.env`.

The original prototype is kept at the `prototype-v1` tag.
