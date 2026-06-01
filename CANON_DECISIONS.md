# Legendary Horizon Canon Decisions

This is the first-read canon note for future agents. Read this file before changing gameplay logic, realm definitions, quest logic, map triggers, save schema, or backend routes.

## Current Beta Canon

- Legendary Horizon currently uses **16 active realms** for the classroom beta.
- Energy / The Arcanum Reactor is **archived future-expansion material**, not active beta runtime canon.
- Do not reintroduce Energy / The Arcanum Reactor into runtime logic unless the project owner explicitly approves that change.
- Do not silently resolve old 16-vs-17 realm conflicts by changing code. Flag the conflict and confirm direction first.
- Do not change quest ID casing or style yet. The `mq-101` vs `MQ-101` issue is known and should be flagged before any refactor.

## Active Runtime Sources

- Active frontend app: `Codex/frontend`
- Active runtime realm registry: `Codex/frontend/src/realm/canonRealms.ts`
- Active runtime map export: `Codex/frontend/public/assets/maps/Legendary_Horizon_Map.json`
- Active Apps Script modular source: `Codex/apps-script`

Treat the modular Apps Script source in `Codex/apps-script` as stronger evidence than stale generated bundles unless deployment confirms the generated bundle is current.

## Prototype And Reference Material

Standalone HTML tools, root-level prototypes, old Phaser experiments, and old Project Documents HTML applets are reference material only unless they are explicitly wired into the current React/Vite app.

Useful reference material should not be treated as trash. It should be deprioritized for implementation context unless a prompt specifically asks for historical, prototype, or design-reference material.

## Agent Workflow Rule

When working on the current classroom beta, start with:

1. `CANON_DECISIONS.md`
2. `Codex/frontend`
3. `Codex/apps-script`
4. `Codex/frontend/src/realm/canonRealms.ts`
5. `Codex/frontend/public/assets/maps/Legendary_Horizon_Map.json`

Then use supporting docs and archived prototypes only to answer specific historical or design-reference questions.
