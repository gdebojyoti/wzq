# 0002: Hosting and domains

## Status
Accepted

## Context
The game is a free, friends-only project for now. Hosting must cost nothing.

## Decision
- The web app is hosted on Vercel's free tier.
- The server is hosted on Render's free web service tier.
- The web app and the server each get a subdomain of the same parent domain, for example `app.<domain>` and `api.<domain>`.
- The player ID cookie is set on the parent domain, so both subdomains can read it.

## Consequences
- The cookie is same-site, so it isn't blocked as a third-party cookie.
- Socket.IO CORS must allow the web app's exact origin, with credentials enabled.
- Render's free tier sleeps when idle, and a restart clears all in-memory state (see ADR-0005). Both are accepted for now.
- This depends on Render allowing custom domains on its free tier. That still needs to be checked before deployment.
