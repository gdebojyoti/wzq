# 0004: Anonymous player identity

## Status
Accepted

## Context
There are no user accounts in v1. The server still needs to know which player is which, so that a player can rejoin their game after a refresh or a browser restart.

## Decision
- The server issues a UUID as the **Player ID** when a browser first connects.
- The browser keeps it in a cookie with a long expiry, such as one year.
- Every connection presents the cookie, and the server maps it to the player's active game.
- A player can be in only one active game at a time, so the server can find that game from the player ID alone.

## Consequences
- Refreshing or reopening the browser keeps the player's place in their game.
- Clearing cookies or using a private window loses access to the game. This is accepted for friends-only use.
- Accounts can be added later by linking a login to the existing player ID.
