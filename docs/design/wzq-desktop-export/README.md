# WZQ — desktop UI design (Neubrutalist, layout "Desktop 1 · Sidebar"), v1

Desktop design for the v1 web app screens in issue #17: **Start**, **Lobby**, and **Game**. Results are shown on the Game screen itself. Designed at **1440 × 900**; each layout fills the browser window.

This builds on the mobile export (`wzq-mobile-export/README.md`). **Design tokens, interaction rules, components, and copy are the same as mobile** unless this file says otherwise. Read that one for the shared rules; this file covers what's specific to desktop.

## Files

| File | What it is |
|---|---|
| `screens/index.html` | All three screens side by side at 50%, with links to their states. Open this first. |
| `screens/start.html` | Start: create a game or join with a code |
| `screens/lobby.html` | Lobby: Host waits with the game code |
| `screens/game.html` | Game, from the Host's side (plays first) |
| `screens/wzq-lite.js` | Tiny renderer so the mocks run standalone (same file as the mobile export). **Not part of the design — don't port it.** |

Open the HTML directly in a browser (it needs internet for Google Fonts). The board is clickable. In the mock, a click places a stone for whoever's turn it is.

### States (URL query params)

| Screen | Param | Values (default first) |
|---|---|---|
| all | `connection` | `connected`, `connecting`, `offline` |
| Start | `notice` | `none`, `game-gone`, `bad-code` |
| Game | `scene` | `playing`, `won`, `lost`, `abandoned` |
| Game | `opponentOnline` | `true`, `false` |

Example: `game.html?scene=won&connection=offline`

Each screen's markup is in its `<template id="screen">` and its logic in the `Component` class at the bottom. Exact values (sizes, colours, spacing) are inline styles there; treat those as the source of truth.

## Layout

Every screen has two parts side by side (a flex row):

1. **Content pane** (left): yellow background, takes the remaining width.
2. **Sidebar** (right): white, full window height, 3px ink border on its left edge.

| Screen | Content pane | Sidebar width | Sidebar padding |
|---|---|---|---|
| Start | Title card + decorative stone strip, vertically centred, max 640px wide | 440–560px | 64px 56px 28px |
| Lobby | WZQ wordmark top-left, then game code block vertically centred, max 680px wide | 400–480px | 40px 48px 28px |
| Game | WZQ wordmark top-left, then the board centred in the space below | 380–440px | 32px 40px 24px |

### Shared alignment rules

- **WZQ wordmark** (Lobby, Game): 32px Archivo Black, top-left of the content pane, 40px from the top and 72px from the left. Start uses the large title card instead.
- **Leave game**: top-right of the sidebar, the same small secondary button as mobile. On Game it's hidden once the game has ended.
- **Players list** (Lobby, Game): starts at the same height on both screens. The "PLAYERS" heading's top edge is **200px from the top of the window**. It's a fixed offset, not centred, so it stays put at any window height.
- **Connection indicator**: bottom-centre of the **sidebar** (not of the whole screen), 75% opacity. Same circles, colours, and labels as mobile.

### Start

- Sidebar holds both actions, centred vertically: "Start a new game" (32px title, one-line explanation, pink START A GAME button), an "OR" divider, then "Join a friend's game" (32px label, sunken code input + white JOIN button side by side).
- `game-gone` notice sits at the top of the sidebar; `bad-code` error sits under the code input.
- Title card: WZQ at 168px, tagline at 22px, rotated pink "5 IN A ROW" sticker.

### Lobby

- Content pane: "YOUR GAME CODE" label, six white code tiles (120px tall, 64px digits, 12px gaps), the explanation line, and the pink COPY CODE button.
- Sidebar: Leave game, then the players list:
  - **YOU** · "Host · ready" (solid black disc).
  - **YOUR FRIEND** · "Waiting to join…" (dashed empty circle that slowly fades between 35% and 100% opacity).
- The mobile "WAITING FOR YOUR FRIEND" ticker is **not** used on desktop; the friend row carries the waiting state.

### Game

- **Board**: 13×13, width `min(780px, 100vh − 140px, 100%)`, so it shrinks to fit shorter windows. About 760px at 1440×900.
- **Sidebar, top to bottom**:
  1. Leave game (while playing).
  2. PLAYERS heading + player rows (YOU / OPPONENT, same highlighter and 40% fade rules as mobile).
  3. Headline (48px: YOUR TURN, THEIR TURN, YOU WON!, …) and the hint line. The opponent-disconnected notice appears here too.
  4. Flexible space.
  5. When the game is over: result line + pink NEW GAME button (64px tall, full sidebar width).
  6. Connection indicator.

## Differences from mobile

| Thing | Mobile | Desktop |
|---|---|---|
| Hint copy | "Tap any empty cell to place your stone." | "Click any empty cell to place your stone." |
| Turn headline | 34px | 48px |
| WZQ in headers | 28px | 32px |
| Player list | Horizontal strip `● YOU VS OPPONENT ○` | Vertical list with a "PLAYERS" heading |
| Lobby waiting state | Scrolling ticker | Dashed "YOUR FRIEND" row |
| Connection indicator | Bottom-centre of the screen | Bottom-centre of the sidebar |

## Mock-only things (don't implement)

- Clicking places a stone for **either** side; board positions are hard-coded seed sequences.
- `wzq-lite.js`, the `index.html` preview page, and the `embed` query param.
- Links between screens only move between mocks; the real flow is driven by game snapshots from the server.

## Open points

- **Joined view:** there's no desktop artboard for the joining Player. Presumably the mobile joined-view rules carry over ("Joined · plays second", "Host ·" prefix on the opponent, "The host places the first stone." on an empty board), but that hasn't been designed.
- **Narrow windows:** the panes are set to wrap (sidebar drops below the content) when the window gets too narrow for both, but that in-between width hasn't been designed or checked. Where to switch to the mobile layout is still undecided.
- **Highlighter colours:** whether the opponent's turn highlight should stay blue or become pink is undecided.
- **Board size:** 13×13 in the designs vs 16×16 in issue #17.
- **Copy code** has no copied/confirmation state yet; **Leave game** asks for no confirmation.

## Decisions made while building it

These settle the open points above, and the cases the designs didn't cover. Where nothing here says otherwise, the
mobile export's decisions (`wzq-mobile-export/README.md`) carry over.

- **Where desktop starts:** windows 1024px wide and up (Tailwind's `lg`) get the desktop layout. Narrower ones get the
  mobile layout, so the panes never wrap. This may move to `xl` (1280px) after a look at the experience.
- **Board size:** the rules' **16×16** Board at the design's width, as on mobile.
- **Joined view:** the mobile joined-view rules carry over.
- **Highlighter and winning line colours:** as on mobile. The opponent is blue, and the Lost text says "Their line is
  marked in blue."
- **Copy, Leave game and Back to Home:** as on mobile. Copying shows "Copied" with a check icon for about 2 seconds,
  Leave game asks for no confirmation, and NEW GAME is labelled "Back to Home".
- **Lobby copy buttons:** the app's three copy buttons sit in the content pane under the explanation line. The pink
  COPY JOIN LINK comes first, then the white COPY CODE and COPY WATCH LINK side by side.
- **Spectator screen:** the Game layout. The PLAYERS list shows HOST and JOINER, and STOP WATCHING sits where Leave
  game does.
- **Errors and notices:** on Game (and the Spectator screen), they go in the sidebar under the headline and hint, where
  the opponent-disconnected notice is, so the Board never moves. Start and Lobby keep room for a two-line error, as on
  mobile.
