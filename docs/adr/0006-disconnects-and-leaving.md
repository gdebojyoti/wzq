# 0006: Disconnects and leaving a game

## Status
Accepted

## Context
A player can lose their connection or refresh the page during a game. Without a rule, the other player could be stuck waiting. The prototype used a grace period before forfeiting, but timers are out of scope for v1.

## Decision
- A disconnected player can rejoin at any time, with the same player ID (see ADR-0004). There is no timer.
- The game waits for the player to return. The other player can't finish or start another game until then.
- **Leave game** is a button available to either player. It ends the game as **Abandoned**, with no winner.
- Timers, including a grace period before forfeit, come after v1.

## Consequences
- Nothing forces a result when a player disappears, so the **Leave game** button is how a waiting player gets out.
- Leaving doesn't count as a loss, so there is no way to win by walking away.
- A timer can be added after v1 without changing the data model.
