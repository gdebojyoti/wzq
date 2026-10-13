# 0005: In-memory storage until Supabase

## Status
Accepted

## Context
The database is Supabase, used as plain Postgres (see issue #10). Setting it up is not needed to build and test the game, and it's not needed for the first deployment.

## Decision
- Game state is held in memory in v1.
- All reads and writes go through a storage interface, so the in-memory version can be replaced by a Postgres-backed one without changing game logic.
- Supabase is set up after v1 is deployed.

## Consequences
- A server restart clears every game. A waiting player is told the game code is invalid. This is accepted for v1.
- Render's free instances sleep when idle, which has the same effect.
- Supabase's free projects pause after 7 days of inactivity. That's harmless until real data is stored there.
