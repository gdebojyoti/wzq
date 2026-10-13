# 0007: v1 rules and scope

## Status
Accepted

## Context
The prototype's rules were loose guidelines, so the rebuild sets them explicitly. The rules are in `GLOSSARY.md`, and this ADR records the choices and what's deferred.

## Decision
Rules:
- 16×16 board, a fixed constant.
- Two players per game. The host moves first.
- Five or more in a row wins. Free-style, so no moves are banned.
- A full board with no win is a draw.
- Joining is by six-digit game code, and only while the game is in the lobby.
- A player can be in only one active game at a time.

Deferred until after v1:
- Timers, including a grace period before forfeit.
- Rematches. After a game ends, the players return to the result screen and start a new game themselves.
- Spectators.
- Lobby expiry. A lobby stays open until the host leaves or the server restarts.
- Renju restrictions and other rule variants.

## Consequences
- The rules engine can ignore time, rematches and spectators in v1.
- The deferred items are listed here so they aren't forgotten.
