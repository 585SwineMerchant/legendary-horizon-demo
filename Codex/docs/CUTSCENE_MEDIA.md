# Cutscene media (intro + future cinematics)

The game ships **small HTML players** in git (`intro-player.html`, future copies). **Large MP4 exports stay out of git** (~190MB DaVinci exports are gitignored).

## How it works

| Piece | Location |
|--------|----------|
| Player + captions | `Codex/frontend/public/assets/intro/*.html` (committed) |
| Video / audio | Media base URL — local in dev, CDN/release in prod |
| Registry | `src/lib/lhCutscenes.ts` |

Dev resolves assets from your Vite server (`http://localhost:5173/legendary-horizon-demo/…`) so a local `intro_davinci.mp4` works immediately.

Production builds set `VITE_LH_MEDIA_BASE_URL` to a folder that contains the MP4 (GitHub Release recommended).

## Demo intro (current)

Default iframe: **`intro-player.html`** with stamped captions. No fallback to `intro_video_v2.html` unless you set that in `.env.local`.

Preview in the app:

```text
http://localhost:5173/legendary-horizon-demo/?lh_force_intro=1
```

## Host the intro video for GitHub Pages

GitHub repos limit file size (~100MB per blob). Use a **release asset** instead of committing the MP4.

1. **Optional — compress for faster streaming** (from repo root):

   ```powershell
   .\Codex\frontend\scripts\compress-intro-video.ps1
   ```

   Produces `intro_davinci.web.mp4` (smaller H.264). Upload either file to the release.

2. **Create / update release** `intro-media-v1` on `legendary-horizon-demo` and attach:

   - **`intro_davinci.web.mp4`** (registry default; run `scripts/compress-intro-video.ps1` to regenerate)
   - Keep the full DaVinci export as gitignored `intro_davinci.mp4` for re-stamping only

3. **CI / production env** (already wired in `.github/workflows/deploy-demo.yml`):

   ```env
   VITE_LH_MEDIA_BASE_URL=https://github.com/585swinemerchant/legendary-horizon-demo/releases/download/intro-media-v1/
   ```

   Video URL becomes:  
   `{MEDIA_BASE}intro_davinci.web.mp4` (flat release root; see `resolveLhCutsceneVideoUrl`).  
   Upload **`intro_davinci.web.mp4`** at the release root. To use the full export instead, set:

   ```env
   VITE_LH_INTRO_VIDEO_URL=https://github.com/.../releases/download/intro-media-v1/intro_davinci.web.mp4
   ```

4. Push to `main` — Pages deploy serves the app; the iframe loads video from the release URL.

Manual upload (GitHub CLI):

### Upload via GitHub website (no CLI)

1. Open your repo on GitHub: **legendary-horizon-demo** (or the repo that hosts the demo).
2. Click **Releases** (right sidebar, or `https://github.com/<owner>/<repo>/releases`).
3. If **`intro-media-v1`** does not exist: click **Create a new release**.
   - **Choose a tag**: type `intro-media-v1` → “Create new tag on publish”.
   - **Release title**: `Intro cutscene media`
   - **Description**: optional note (“Web intro MP4 for intro-player.html”).
   - Leave **Set as a pre-release** unchecked unless you want it hidden.
4. In **Attach binaries**, drag and drop:
   - `Codex/frontend/public/assets/intro/intro_davinci.web.mp4` (~32 MB)
   - Do **not** upload the 190 MB `intro_davinci.mp4` unless you need a backup on the release.
5. Click **Publish release** (or **Update release** if the tag already exists).
6. After publish, confirm the asset link works in a browser (should download/play the MP4).
7. Push your app to `main` when ready so the next Pages build uses the registry URL (no change to `VITE_LH_MEDIA_BASE_URL` needed if it already points at `intro-media-v1`).

Optional CLI:

```bash
gh release create intro-media-v1 --title "Intro cutscene media" --notes "Web intro MP4 for intro-player.html"
gh release upload intro-media-v1 /path/to/intro_davinci.web.mp4
```

## Add another cutscene later

1. Export video; keep MP4 gitignored under `public/assets/intro/` for local work.
2. Copy `intro-player.html` → e.g. `maia-reveal-player.html`, paste new `CAPTIONS` from `caption-stamper.html`.
3. Register in `src/lib/lhCutscenes.ts`:

   ```ts
   maia_reveal: {
     id: 'maia_reveal',
     player: 'assets/intro/maia-reveal-player.html',
     video: 'assets/intro/maia_reveal.mp4',
     cacheTag: '20260601-1',
   },
   ```

4. Upload `maia_reveal.mp4` to the same (or a new) GitHub Release.
5. From game code, open an iframe with `buildCutscenePlayerUrl(LH_CUTSCENES.maia_reveal)` and listen for `lh_intro_finished` (same contract as intro).

## Env reference

| Variable | Purpose |
|----------|---------|
| `VITE_LH_MEDIA_BASE_URL` | Root for all large assets in prod |
| `VITE_LH_INTRO_CINEMATIC_SRC` | Override player HTML path |
| `VITE_LH_INTRO_VIDEO_URL` | Override intro video URL/path |
