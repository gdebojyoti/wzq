# WZQ

WZQ is an online two-player game of Wuziqi (also called Gomoku or Five in a row), played between friends.

## Language

### Players

**Player**:
One of the two people in a **Game**. A player is recognised across visits without needing an account.
_Avoid_: user, opponent (except relative to another player)

**Host**:
The **Player** who created a **Game**.
_Avoid_: owner, creator

**Joiner**:
The **Player** who joined a **Game** in the **Lobby** with its **Game code**. They stay the Joiner for the rest of the **Game**, including after they **Rejoin**.
_Avoid_: guest, invitee, challenger, visitor

### Game lifecycle

**Game**:
A single match between two **Players**, from creation until it ends.
_Avoid_: match, room

**Lobby**:
The stage of a **Game** before the **Joiner** has joined.
_Avoid_: waiting room

**Game code**:
The six-digit code the **Host** shares, which the **Joiner** enters to join a **Game** in the **Lobby**.
_Avoid_: room code, invite code

**Rejoin**:
A **Player** returning to a **Game** they are already in, such as after a page refresh or a lost connection.
_Avoid_: reconnect (in user-facing text)

**Leave game**:
A **Player** choosing to end a **Game** they are in, which makes it **Abandoned**.
_Avoid_: resign, forfeit, quit

### Play

**Board**:
The grid of **Cells** a **Game** is played on.
_Avoid_: grid

**Cell**:
One position on the **Board**.
_Avoid_: square, intersection

**Stone**:
A **Player's** mark on a **Cell**.
_Avoid_: piece, token

**Turn**:
A **Player** placing one **Stone** on an empty **Cell**.
_Avoid_: move

### Outcomes

**Win**:
The result when a **Player** has five or more **Stones** in an unbroken horizontal, vertical or diagonal line.
_Avoid_: victory

**Draw**:
The result when every **Cell** is filled and no **Player** has a **Win**.
_Avoid_: stalemate, tie

**Abandoned**:
How a **Game** ends after **Leave game**: there is no winner, and it is not a **Draw**. A **Game** abandoned in the **Lobby** never started, so it has no result.
_Avoid_: cancelled, forfeited
