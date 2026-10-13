# The web app is a Module Federation remote

WZQ is one of several games on one site, each at its own path (`<domain>/wzq`, `<domain>/tactris`, and so on), and a host app will load them into one page with Webpack 5 Module Federation. The other games are plain React and Webpack 5, and Next.js can't be a remote (the App Router has no federation support, and Next.js 16 builds with Turbopack), so `apps/web` is plain React and Webpack 5 too, set up like tactris: it exposes the game as a React component, shares React as a singleton, and also runs on its own at `/wzq` until the host exists. The server stays on a subdomain of the same domain, so the player cookie is still same-site. This replaces ADR-0002's plan of a subdomain for the web app.

## Considered Options

- **Keep Next.js and route `/wzq` to it at the edge (multi-zones):** works without federation, but WZQ would be the only game built differently, and it could never share a page with the host.
- **Load the Next.js app in an iframe:** quick, but sizing, browser history and deep links would all need working around.

## Consequences

Every game runs on the same origin, and once federated, in the same page. Anything the web app keeps in the browser (`localStorage` keys, cookies it sets itself) is prefixed with `wzq:`, and the server's cookie stays host-only rather than being set on the parent domain.
