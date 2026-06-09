# Legendary Horizon — Pre-Deploy Checklist

Use this before every GitHub Pages push. Mark each tier separately.

---

## Environment Labels

| Label | How to get there |
|---|---|
| **Local Dev** | `npm run dev` in `Codex/frontend/` |
| **Local Preview** | `npm run build && npm run preview` — production bundle on localhost |
| **GitHub** | Deployed to `https://585swinemerchant.github.io/legendary-horizon-demo/` |
| **Chromebook** | Load GitHub URL on a school Chromebook (school network) |

> **Rule**: Local Dev passing is NOT sufficient to mark anything verified.  
> Required for GitHub deploy: Local Preview passes, TypeScript clean.

---

## Build Stamp Verification

After `npm run build` succeeds:

1. Open the built `dist/index.html` in Local Preview (`npm run preview`).
2. Append `?lh_build_debug=1` to the URL.
3. Confirm the stamp shows in the bottom-right corner with:
   - `commit` — 7-char short hash matching `git rev-parse --short HEAD`
   - `built` — today's date/time
   - `env` — `production`
   - `base` — `/legendary-horizon-demo/`
   - `save mode` — `simulated (no Apps Script URL)` (unless `.env.local` sets the URL)
   - `map url` — path to `Legendary_Horizon_Map.json`

---

## Standard Pre-Deploy Steps

```
1. git status — confirm working tree is clean.
2. tsc --noEmit passes (no TypeScript errors).
3. npm run build passes (no Vite/rollup errors; verify-pages-media-base passes).
4. npm run preview — open in browser with ?lh_build_debug=1.
5. Confirm build stamp shows correct commit hash.
6. Smoke test: Title → Start Game → character creation → Aethelwood.
7. Verify crops visible, windmill animated, Oracle altar renders.
8. Open Scroll of Destiny (Escape) — confirm signpost runes appear after first run.
9. Save (campfire) → refresh → Load Game → re-open Scroll → runes/prophecy/sigil still present.
10. Type in a document field (e.g., Quest of Fate) — confirm all keys work normally.
11. git push origin main.
12. Wait ~2 min for Pages deploy, then open GitHub URL and repeat smoke test.
```

---

## Chromebook / School Network Notes

- GitHub Pages must be reachable (not blocked by proxy).
- Service workers: the site has no registered service worker; hard refresh (`Ctrl+Shift+R`) clears browser cache if stale assets show.
- Touch events: Phaser input is mouse+touch so Chromebook touchscreen works.
- If the map fails to load, check the Console → Network tab for CORS or 404 on `Legendary_Horizon_Map.json`.

---

## Uncommitted / Local-Only Files to Audit Before Push

- `.env.local` — NEVER commit. Contains Apps Script URL and sheet ID. Verify with `git status` that it is not staged.
- `oracle_cutscene_v1.mp4` — gitignored large binary. Upload to GitHub Release if needed.
- Any `public/assets/maps/*.json` edits — these MUST be committed or the GitHub build gets the old map.

---

## Files That Affect Environment Parity

| File | Purpose | Risk if stale |
|---|---|---|
| `Codex/frontend/vite.config.ts` | Base path, build defines | Wrong base path → 404 on all assets |
| `Codex/frontend/src/lib/lhMediaBase.ts` | Asset URL resolution | Assets 404 in prod |
| `Codex/frontend/public/assets/maps/*.json` | Tiled map JSON | Old map in prod |
| `Codex/frontend/public/assets/oracle/prophecy_sigil.png` | Sigil image | Missing sigil |
| `.env.local` | Backend URL / sheet ID | Must NOT be committed |
