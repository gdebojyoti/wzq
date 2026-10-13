# Socket.IO for real-time updates

The web app and server talk over Socket.IO. Load is tiny (two players, turns seconds apart), so the deciding factor was rejoining: Socket.IO's built-in reconnection, per-game rooms and handshake cookies cover it, where the alternatives would need that logic written by hand.

## Considered Options

- **Server-sent events for updates, with HTTP POST for turns:** plain HTTP and easy to debug, but rooms and resending game state after a reconnect would be ours to build.
- **Plain WebSockets (`ws`):** smaller, but no reconnection or rooms.
