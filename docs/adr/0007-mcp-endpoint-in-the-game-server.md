# MCP endpoint in the game server

So a player can play against the AI of their choice, the game server also serves an MCP endpoint at `/mcp` (the official MCP TypeScript SDK over Streamable HTTP), which any AI client that can add a remote MCP server by URL, such as Claude or ChatGPT, connects to as a player. The player plays on the web app as usual, and the AI takes its turns through MCP tools. The endpoint runs in the same process as the Socket.IO layer, because games are held in memory (ADR-0005), and both are adapters over the same game service, so the rules are enforced in one place. Each MCP session is one player, with a random ID issued when the session starts, in place of ADR-0004's cookie. The AI can join a game the player created, or create one itself and tell the player its game code, and then, as the host, it goes first.

## Considered Options

- **A separate MCP service:** keeps the game server smaller, but it can't reach games held in another process's memory. Worth revisiting once games are in Supabase.
- **WZQ calls an LLM API itself, behind a "Play vs AI" button:** smoother, with no setup and no second window, but WZQ pays for every game, and the player can't choose the AI.
- **Showing the board inside the AI's chat (MCP Apps):** no second window, but it rebuilds the game's UI in the chat, which defeats the purpose of playing on WZQ.

## Consequences

AI clients only act while answering a message, so a tool blocks until it's the AI's turn, and returns after a timeout to be called again. A long game may stall until the player tells the AI to carry on, and a game whose AI stops playing is ended with Leave game. A new chat is a new MCP session, so it's a new player that can't rejoin the old game.

An AI that creates a game waits in the lobby the same way it waits for a turn. A game nobody joins stays in the lobby until the AI uses Leave game, or until its session closes, which abandons the game as the AI couldn't come back to it. The AI points the player to the production web app (`https://tablehop.games/wzq`), even when the server runs locally.
