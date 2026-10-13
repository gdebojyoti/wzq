# 0008: Prototype and wzq.socket retirement

## Status
Accepted

## Context
The prototype code in `wzq` and in `gdebojyoti/wzq.socket` is not the basis for the rebuild. The rules are being rewritten, and the new architecture is different.

## Decision
- Tag the final prototype commit of `wzq` as `prototype-v1` and push the tag. Remove the prototype code from `master` when the rebuild starts.
- Don't import `wzq.socket`'s history. Once the new server is deployed, delete the `gdebojyoti/wzq.socket` repo on GitHub.
- Deleting the repo on GitHub removes its history. A local clone at `d:\Work\wzq.socket` is a separate copy and can be kept or deleted separately.

## Consequences
- The prototype can still be read through its tag.
- Nothing on `wzq.socket` is needed after v1 is deployed.
