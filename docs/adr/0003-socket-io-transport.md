# 0003: Socket.IO transport

## Status
Accepted

## Context
The game needs real-time updates between two players. Moves are a few seconds apart, so load is low. The important requirement is reconnecting a player to their game with the same player ID (see ADR-0004 and ADR-0006).

The alternatives were plain WebSockets, and server-sent events with HTTP POST for moves.

## Decision
Use Socket.IO on both ends.

## Consequences
- Reconnection, per-game rooms and acknowledgements come built in.
- The prototype already used Socket.IO, so the rebuild reuses familiar code.
- Only Socket.IO clients can connect. That's fine, since the web app is the only client.
- The client bundle is larger than plain WebSockets would be.
