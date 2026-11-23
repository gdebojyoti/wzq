# Public debug list of games

So the state of the server can be checked during development by opening a URL in a browser, the game server serves `GET /debug/games`: the newest 100 games as JSON, newest first, with how many games it holds in all, so it's clear when some are left out, and with no authentication. A token would mean a dashboard or a header, which a browser can't send by opening a URL, and games are held in memory (ADR-0005), so there's no database to look in instead. It stays until it's deliberately removed, for example when games move to Supabase.

The response is `{ total, games }`. Each game is shown as a spectator sees it, built from the same snapshot a spectator is sent, so the list can't drift from what's shown to anyone watching. To that it adds only a label for each player and what only the server has: the game's ID, its masked game code, and when it was created and last saved. Its players are listed in the order they joined, the host then the joiner, each named by role, with how they play and whether they're connected. Its board, which comes last as the longest part, has whose turn it is, how the game ended and every stone placed, in the order the turns were taken, and is null for a game that never left the lobby. This follows the same pattern as Ludo's list of the same name, so the lists read alike across TableHop games, while keeping WZQ's own terms and the turn history Ludo's server doesn't keep.

Because anyone can open it, the list never shows a value that lets someone act as a player or easily join someone else's game:

- **No player IDs.** A player ID is the only proof of who a player is (ADR-0004), so each player is shown by a label of its first 6 characters. That reveals 24 of a UUID's 122 random bits, which leaves the rest unguessable, and keeps the same label for a player in every game.
- **Masked game codes.** Only a game in the lobby shows its game code, with just the first 2 digits visible. A game code stops working once someone joins, so other games show none.
- **Game IDs in full.** A game ID is all a watch link needs (ADR-0009), so anyone can watch any listed game. This is accepted for now.

A later change to the list must keep player IDs out and game codes masked. The tests check that no player's ID appears anywhere in the response.
