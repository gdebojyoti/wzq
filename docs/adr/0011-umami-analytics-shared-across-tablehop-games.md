# Umami analytics shared across TableHop Games

WZQ is one of the TableHop Games (THG), each served under a path on tablehop.games, and every THG game sends its analytics to one shared Umami Cloud website. The web app's own page, `index.html`, loads Umami's script with `data-domains="tablehop.games"`, so localhost and preview builds send nothing. Each game loads its own copy for now; a shared host app may take it over later. When a host page loads WZQ as a remote (ADR-0006), WZQ's events are sent only if the host page loads the script.

Every custom event goes through one wrapper, `track()` in `apps/web/src/ui/analytics.ts`, which puts `wzq_` in front of the name: the game's path segment in lower case and an underscore. Umami's Goals and Funnels pick events by name, and its property filters work only inside one event, so a separate name is the only way to keep each game's events apart in reports, and there's no `game` property. Names are snake_case and stay under 50 characters with the prefix. An event that means the same as one in another THG game uses the same name after the prefix, so a THG-wide total is a sum of each game's count: WZQ shares `game_over` and `game_left` with Tactris.

`track()` adds `layout` to every event: `desktop` if the window is wide enough for the desktop layout when the event is sent, otherwise `mobile`, as Umami files iPads under desktop by their user agent. It's to change to the user agent soon, as Tactris does.

## Events

| Event | Sent when | Data |
| --- | --- | --- |
| `wzq_game_created` | The Host starts a Game with New game. | — |
| `wzq_game_joined` | The Joiner joins a Game, which starts it. | `via`: `code` (typed on the start screen) or `link` (a join link) |
| `wzq_link_copied` | The Host copies something to share from the lobby. | `what`: `join_link`, `code` or `watch_link` |
| `wzq_game_over` | A Game the Player was playing ends, seen live. | `outcome`: `won`, `lost`, `draw` or `abandoned` (the opponent left); `role`; `opponent`; `turns`; `seconds` |
| `wzq_game_left` | The Player uses Leave game. | `stage`: `lobby` or `play`; `role`; `opponent`; `turns`; `seconds` |
| `wzq_back_to_start` | The Player uses Back to start after their Game ended. | `outcome`: as in `game_over` |
| `wzq_watch_start` | A Spectator starts watching a Game from a watch link. | `state`: the Game's state then, such as `lobby` or `ongoing` |
| `wzq_watch_stop` | A Spectator stops watching. | `via`: `stop` (Stop watching) or `back_to_start` (after the Game ended) |

`role` is `host` or `joiner`, and `opponent` is `ai`, `browser`, or `none` before anyone has joined. `turns` counts the Stones placed in the whole Game. `seconds` is how long the Game had been going, and is left out when this browser didn't see it start, such as after a reload mid-Game, since snapshots carry no times; it's never sent from the lobby.

Each Player's browser sends its own events, as that Player sees the Game. A Game between two browsers is counted twice, a Game against an AI Player once, and a Game between two AI Players not at all, as AI Players play through the MCP endpoint (ADR-0007) and never load the page. Closing the tab doesn't end a WZQ Game, so unlike Tactris there's no `game_left` for a hidden page. A Game that ends while the Player's connection is down shows as gone when it comes back, and sends no `game_over`.

## Considered Options

- **Only the Host's browser sends `game_over`:** counts match Games, but Games an AI Player hosts aren't counted, and the loser's or Joiner's side of a Game is lost.
- **Only the winner's or leaver's browser sends it:** one event per Game, unless the deciding Player is an AI.
- **A `game` property instead of the prefix:** Goals and Funnels can't filter by it, so each game's events would mix in reports.

## Consequences

A Goal or Funnel for WZQ picks events by their `wzq_` names. Counts of `game_over` and `game_left` are per Player, not per Game. A new event goes through `track()`, and reuses another THG game's name when it means the same thing.
