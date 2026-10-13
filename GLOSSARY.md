# Glossary

Terms used across WZQ. Use these words in code, issues and docs. The terms in _avoid_ are not used.

**Game**
A single match between two players, from creation until it ends.
_Avoid_: match, room (in user-facing text)

**Host**
The player who created a game. The host moves first.

**Player**
One of the two people in a game. Identified by a **Player ID**.

**Player ID**
A UUID that the server issues to a browser and stores in a cookie. It's how the server knows which player is which, and it persists across page refreshes and browser restarts. There are no user accounts.

**Lobby**
The state of a game before the second player joins. The game code is only valid in the lobby.

**Game code**
The six-digit code that the host shares so another player can join. Valid only while the game is in the lobby.

**Board**
A 16×16 grid of **Cells**.

**Cell**
One position on the board, identified by row and column.

**Turn**
One player placing a stone on an empty cell.

**Win**
A player has five or more of their stones in a row horizontally, vertically or diagonally.
_Avoid_: victory

**Draw**
All cells are filled and no player has a win. The game ends with no winner.
_Avoid_: stalemate

**Leave game**
A player's action to end a game they're in. The game ends as **Abandoned**, with no winner. The button is labelled "Leave game".
_Avoid_: resign, forfeit

**Abandoned**
A game ended by a **Leave game** action. It has no winner and is not a draw.

**Rejoin**
A player returns to a game they're already in, using the same **Player ID**. A page refresh counts as a rejoin. There is no time limit on rejoining in v1.

**Game status**
The state of a game. One of: Lobby, Ongoing, Completed, Draw, Abandoned.

_Deferred to after v1: timer, rematch, spectator._
