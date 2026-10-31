# Public debug list of games

So the state of the server can be checked during development by opening a URL in a browser, the game server serves `GET /debug/games`: the newest 100 games as JSON, newest first, with no authentication. A token would mean a dashboard or a header, which a browser can't send by opening a URL, and games are held in memory (ADR-0005), so there's no database to look in instead. It stays until it's deliberately removed, for example when games move to Supabase.

Because anyone can open it, the list never shows a value that lets someone act as a player or easily join someone else's game:

- **No player IDs.** A player ID is the only proof of who a player is (ADR-0004), so each player is shown by a label of its first 6 characters. That reveals 24 of a UUID's 122 random bits, which leaves the rest unguessable, and keeps the same label for a player in every game.
- **Masked game codes.** Only a game in the lobby shows its game code, with just the first 2 digits visible. A game code stops working once someone joins, so other games show none.
- **Game IDs in full.** A game ID is all a watch link needs (ADR-0009), so anyone can watch any listed game. This is accepted for now.

A later change to the list must keep player IDs out and game codes masked. The tests check that no player's ID appears anywhere in the response.
