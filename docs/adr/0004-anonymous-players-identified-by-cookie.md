# Anonymous players identified by a cookie

There are no accounts. On first visit the server issues a random UUID, which the browser keeps in a long-lived cookie, and that's how the server recognises a player when they rejoin after a refresh or a browser restart. A player can be in only one active game at a time, so the server can find their game from the cookie alone. Clearing cookies or using a private window loses the game; that's accepted while the game is played among friends. Accounts can later be linked to the existing ID.
