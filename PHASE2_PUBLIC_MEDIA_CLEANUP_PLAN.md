# Phase 2 Public Media Cleanup Plan

No public media files were moved in Phase 2.

## Target Folder

- `Codex/frontend/public/assets/intro/davinci edit/`

## Inventory

- Total files: 141
- Approximate total size: 405 MB

File types observed:

| Type | Count | Bytes |
|---|---:|---:|
| `.png` | 78 | 233,042,852 |
| `.pfl` | 34 | 8,185,148 |
| `.mp3` | 7 | 6,559,846 |
| `.txt` | 4 | 312 |
| `.mp4` | 2 | 22,994,004 |
| `.mov` | 2 | 134,078,914 |
| timestamped Resolve backup extensions | 14 | 239,692 |

Largest draft/media files include:

- `Codex/frontend/public/assets/intro/davinci edit/drafts/V2.mov` - 80,837,343 bytes
- `Codex/frontend/public/assets/intro/davinci edit/drafts/V1.mov` - 53,241,571 bytes
- `Codex/frontend/public/assets/intro/davinci edit/Intro Video Editing/resolve_ready_images/foggy scene opener (2).mp4` - 15,409,521 bytes
- `Codex/frontend/public/assets/intro/davinci edit/LH Map Final.png` - 10,399,635 bytes
- `Codex/frontend/public/assets/intro/davinci edit/Intro Video Editing/resolve_ready_images/LH Map Final.png` - 10,399,635 bytes

## Reference Check

Current exact-path searches found no references outside the folder for:

- `Codex/frontend/public/assets/intro/davinci edit`
- `assets/intro/davinci edit`
- `davinci edit`

A sample filename search found `opening_video_scene_1_narration.mp3` referenced by `Codex/frontend/public/assets/intro/intro_video_v2.html`, but that reference points to `assets/opening_video_scene_1_narration.mp3`, not the `davinci edit` path.

## Recommended Move

Proposed destination:

- `archive/media-drafts/intro/davinci-edit/`

This folder should be moved as a single unit only after approval.

## Files That Should Remain In Public

Before moving, confirm whether the current app directly uses any release-ready intro assets outside `davinci edit`, especially:

- `Codex/frontend/public/assets/intro/intro_video_v2.html`
- `Codex/frontend/public/assets/intro/audio/`
- Any current release video, poster, or narration paths referenced by `Codex/frontend/src`

Within `davinci edit`, no file is currently confirmed as needing to remain public.

## Deployment Risk

Leaving the folder in `public` increases local dev and GitHub Pages payload size if copied into deploy output. Moving it out of `public` should reduce accidental deploy size, but could break any undocumented manual demo link or direct public URL that points into `assets/intro/davinci edit/`.

Recommended next step before moving:

1. Confirm no teacher/demo workflow uses direct URLs into `assets/intro/davinci edit/`.
2. Move the folder to `archive/media-drafts/intro/davinci-edit/`.
3. Run the frontend build or a deployment asset listing check to confirm the folder no longer appears in generated output.
