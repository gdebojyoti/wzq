# Watch a game by its ID through a watch link

Anyone with no active game can watch a game as a spectator by opening its watch link, `/wzq?watch=<game ID>`: the web app's address with the ID every game already gets when it's created, a random UUID. The host copies the link from the lobby screen, which is the only place the ID reaches the web app. Nothing new is generated, and there's no code to type.

The ID is safe to share. A player ID is the only proof of who a player is (ADR-0004), and the game ID proves nothing: the server only ever sends a spectator a neutral snapshot of the game, labelled by host and joiner, with no player IDs and no game code, and no command takes a game ID except to watch. A random UUID can't be guessed, so a game can only be watched by someone who was given its link, or who found it in the public debug list (ADR-0008), which is accepted while that list exists.

Watching is kept in the address rather than on the server, which stores nothing about spectators. On every connection the server says whether the player has an active game; if they don't and the address is a watch link, the web app asks to watch again. This makes reconnecting work the same on its own and inside a host page (ADR-0006).

## Considered Options

- **A spectator code, like the game code:** easy to read aloud, but six digits can be guessed or tried in turn, and it would be a second code to generate, keep unique and retire.
- **Watching by game code:** the game code stops working once someone joins, which is when there's most to watch, and anyone with it could join instead.

## Consequences

The game ID becomes a public value: a later change mustn't let it do anything but watch. When games move to Supabase, a watch link still works as long as the database has the game, including after the server restarts.
