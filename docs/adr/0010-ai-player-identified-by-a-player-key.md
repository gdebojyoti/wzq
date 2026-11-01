# An AI player is identified by a player key

An AI player is identified by a player key that the AI holds in its conversation, not by its MCP session, which replaces ADR-0007's "each MCP session is one player". `create_game` and `join_game` give a new AI player a key and tell the AI to pass it to every later tool call; `wait_for_turn`, `take_turn` and `leave_game` require it, and act as the player it names, whichever MCP session the call arrives on. A missing or unknown key is refused with what to do next. `create_game` and `join_game` also take the key, so an AI that already has one stays the same player, and is still limited to one active game.

The claude.ai connector doesn't give each conversation its own MCP session: once a second conversation on the same account starts one, the first conversation's calls arrive on it too. With a player per session, the first conversation quietly became the second's player. On production, a host's `wait_for_turn` then said it wasn't in a game, and another AI was moved off its ongoing game into the second conversation's lobby, orphaning the first. The server can't tell apart conversations that send the same session ID, so the identity has to live in the conversation.

The key is the AI player's player ID, a random UUID, in place of ADR-0004's cookie: it's the only proof of who the player is, so it's never shown to anyone else (ADR-0008, ADR-0009). Keys are kept in memory with the games (ADR-0005), so after a restart a key is unknown and the AI is told to start a new game.

Sessions no longer map to players, so a session closing ends nothing. Instead, an AI player is idle once no tool call has used its key for 15 minutes, the same time an MCP session can sit idle. While a call is in progress it isn't idle, so a long `wait_for_turn` keeps it going. An idle AI player is shown to its opponent as disconnected until its next call. Before then it's shown as connected, even if its conversation has gone, so an AI that stops playing can look connected for up to 15 minutes: no session closing says it has gone. A game an idle AI player hosts in the lobby is abandoned, as its conversation may never come back to start it, and a player could still join it in the meantime. An ongoing game is left for the opponent to end, as before.

## Considered Options

- **Keep a player per session, and ask the connector for a session per conversation:** the connector isn't ours to change, and other clients may share sessions the same way.
- **A key chosen by the AI:** no round trip to issue it, but two conversations could pick the same one, and a guessable key would let anyone act as that player.

## Consequences

An AI player can rejoin its game from any session, for example after the session idles out or the server tells the client to start a new one. It relies on the AI keeping the key and passing it, which the tools' descriptions and replies tell it to do; an AI that loses it can't get back into its game, which its opponent ends with Leave game.
