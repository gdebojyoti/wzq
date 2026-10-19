# WZQ — mobile UI design (Neubrutalist), v1

Design reference for the v1 web app screens described in issue #17: **Start**, **Lobby**, **Game** (host and joined views).
Results are shown on the Game screen itself, not on a separate screen. Mobile-first, designed at **390 × 844**.

Vocabulary follows `GLOSSARY.md` (Game, Host, Player, Lobby, Game code, Board, Cell, Stone, Turn, Win, Draw, Abandoned, Leave game, Rejoin).

## Files

| File | What it is |
|---|---|
| `screens/index.html` | All four screens side by side, with links to their states. Open this first. |
| `screens/start.html` | Start: create a game or join with a code |
| `screens/lobby.html` | Lobby: Host waits with the game code |
| `screens/game-host.html` | Game from the Host's side (plays first) |
| `screens/game-joined.html` | Game from the joining Player's side (plays second) |
| `screens/wzq-lite.js` | Tiny renderer so the mocks run standalone. **Not part of the design — don't port it.** |

Open the HTML directly in a browser (it needs internet for Google Fonts). The boards are clickable. In the mock, a tap places a stone for whoever's turn it is, so you can play both sides.

### States (URL query params)

| Screen | Param | Values (default first) |
|---|---|---|
| Start | `notice` | `none`, `game-gone`, `bad-code` |
| all | `connection` | Start, Game (joined): `connected` · Lobby: `connecting` · Game (host): `offline`. Each screen also accepts the other two values. |
| Game (host) | `scene` | `playing`, `won`, `lost`, `abandoned` |
| Game (joined) | `scene` | `just-joined`, `playing`, `won`, `lost`, `abandoned` |
| Game | `opponentOnline` | `true`, `false` |

Example: `game-host.html?scene=won&connection=connected`

Each screen's markup is in its `<template id="screen">` and its logic in the `Component` class at the bottom. Exact values (sizes, colours, spacing) are inline styles there; treat those as the source of truth.

## Design tokens

**Colour**

| Token | Hex | Use |
|---|---|---|
| ink | `#111111` | Text, borders, hard shadows, your stones |
| background | `#ffe45e` | Page background (yellow) |
| surface | `#ffffff` | Board, input, title card, code tiles, secondary buttons, opponent stones |
| pink | `#ff8ac4` | Primary buttons, "you" turn highlight, winning-line cells |
| blue | `#8ab4ff` | "Opponent" turn highlight, decorative block |
| last-move | `#ffe45e` | Background of the cell holding the most recent stone |
| cell-hover | `#fff4b0` | Hover on a playable empty cell (pointer devices) |
| error | `#9b0020` | Wrong game code message |
| conn-ok / conn-wait / conn-down | `#1fae5b` / `#f5b700` / `#e5383b` | Server connection dot |

**Type.** Archivo Black (display, buttons, names, headline) + Archivo 500/600/700 (body). Google Fonts.
- WZQ wordmark: 96px on Start, 28px in headers
- Turn headline: 34px · button labels: 13–19px uppercase · body: 14–17px · labels: 12–14px uppercase, tracked

**Shape.** No border radius anywhere except circles (stones, status dots). Borders are 3px solid ink. Board grid lines are 1px ink.

**Shadows.** Hard offset shadows only (`Npx Npx 0 #111`), and only on things you can press.

## Interaction rules (the core of this direction)

1. **Shadow = pressable.** Only buttons have the hard offset shadow, and every button has an icon or arrow.
   - Hover: lift 1px, shadow grows.
   - Active: translate into the shadow; the shadow goes to 0.
   - Focus-visible: 3px ink outline.
2. **Pink = primary action** on each screen: Start a game, Copy code, New game. **White = secondary**: Join, Leave game.
3. **Inputs are sunken.** White field with an inset hard shadow (`inset 4px 4px 0 rgba(17,17,17,.14)`).
4. **Information is flat.**
   - Display surfaces (title card, code tiles, board) may have a border but never a shadow.
   - Status and notices are an icon plus text, with no box.
5. **Leave game** is always the same small secondary button in the header's top-right corner, on Lobby and Game. It's hidden once the game has ended, when New game replaces it.
6. **Board cells.**
   - Hovering an empty cell on your turn previews your stone: solid for you, dashed outline for the opponent's turn in the mock.
   - Taken cells and finished games get no hover and no pointer cursor.
   - In the real app, cells are locked while it isn't your turn (spec story 14).

## Components

- **Player strip (Game):** `● YOU  VS  OPPONENT ○`.
  - The player whose turn it is gets a highlighter stroke behind their name: pink for you, blue for the opponent. The other side fades to 40% opacity.
  - Sub-labels: "Host · plays first" / "Joined · plays second". The opponent shows "Online" or "Disconnected", prefixed "Host ·" in the joined view.
- **Stones:** you are **always black** (solid ink), host or not; the opponent is always white with an ink border.
- **Cell marks:**
  - Last-move cell: yellow background.
  - Winning-line cells: pink background.
- **Connection indicator** (bottom-centre of every screen, 75% opacity): 12px circle with a 2px ink border plus a label.
  - Green, "Connected to server".
  - Amber, "Connecting to server…".
  - Red, "Not connected to server · retrying".
  - It's **informational only**: no button, board or other element depends on it, because it can be out of sync with the real network state.
- **Opponent disconnected notice** (Game, under the headline): info icon + "Your opponent is disconnected. The game will wait for them to rejoin, with no time limit."
- **Lobby waiting ticker:** full-bleed, ink rules above and below, scrolling "WAITING FOR YOUR FRIEND ●".

## Copy

| Where | Text |
|---|---|
| Start | "Five in a row, played between friends. No sign-up." · START A GAME · "GOT A CODE? JOIN IN" · JOIN |
| Start, `bad-code` | "No game in the lobby has that code. Check it with your friend." |
| Start, `game-gone` | "That game no longer exists. Start a new one, or join a friend's." |
| Lobby | "YOUR GAME CODE" · "Send this code to your friend. The game starts the moment they join." · COPY CODE |
| Game headline | YOUR TURN · THEIR TURN · YOU WON! · YOU LOST · GAME ABANDONED · DRAW |
| Game hint | "Tap any empty cell to place your stone." / "Waiting for your opponent to play." / joined, empty board: "The host places the first stone." |
| Won | "Five in a row. The winning line is marked in pink." |
| Lost | "Your opponent got five in a row. Their line is marked in pink." |
| Abandoned | "Your opponent left the game. There is no winner." |
| Draw | "The board is full and nobody got five in a row." |

## Mock-only things (don't implement)

- Tapping places a stone for **either** side, so both colours can be played in the mock.
- The board positions are hard-coded seed sequences.
- `wzq-lite.js`, the grey preview background, and the `embed` query param.
- Links between screens (Start a game → Lobby, Join → Game) only move between mocks; the real flow is driven by game snapshots from the server.

## Decisions made while building it (#30)

These settle the open points the designs left, and the cases they didn't cover.

- **Board size:** the app keeps the rules' **16×16** Board, so no rules change. The board is built to the design at that size.
- **Desktop:** the mobile layout, as a centred column about 430px wide on the full-width yellow background. The three desktop layouts on the design canvas are not used for v1.
- **Copy code:** shows "Copied" with a check icon for about 2 seconds.
- **Leave game:** asks for no confirmation.
- **Abandoned, seen by the Player who left:** the same GAME ABANDONED screen, with "You left the game. There is no winner."
- **New game:** goes to Start, where the Player can start a game or join a friend's.
- **Buttons while not connected:** stay enabled, as the connection indicator is informational only. Socket.IO holds commands until it reconnects. Buttons are disabled only while a command waits for the server's reply, shown at 50% opacity with no shadow.
- **Other server errors** (not your turn, Cell taken, already in a game, and so on): the same flat notice in the error colour, under the headline on Game and under the join row on Start.

All of the app's text lives in `apps/web/src/ui/messages.ts`.
