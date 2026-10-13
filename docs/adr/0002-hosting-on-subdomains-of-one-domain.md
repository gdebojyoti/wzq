# Hosting on subdomains of one domain

Hosting must be free, so the web app is on Vercel's free tier and the server is on Render's free tier. They're served from subdomains of the same parent domain (for example `wzq.<domain>` and `api.<domain>`), rather than their default `vercel.app` and `onrender.com` addresses. That makes the player cookie same-site, so browsers don't block it as a third-party cookie.

## Considered Options

- **Default platform domains with a `SameSite=None` cookie:** rejected, because Safari and Chrome's third-party cookie blocking can still drop it.
- **The web app sets the cookie on its own domain and passes the ID to the server:** workable, but needs extra handoff code that subdomains make unnecessary.
