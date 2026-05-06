# Corey Leadership Demo Plan

## Goal

Prepare a polished leadership-facing playable slice of Legendary Horizon for Corey. This build should prove that the game exists, has a coherent instructional structure, and supports the real career-planning workflow around Maia Learning instead of replacing it.

## Current Readiness

### Already in place

- React/Vite game shell with title, instructions, resume flow, exploration, pause menu, quest log, world map, manifest, and teacher dashboard surfaces.
- Maia Learning and other classroom tool launch points are already represented in the app.
- The leadership route now includes a sample teacher-reviewed Maia bridge screen before the recap.
- The leadership route now includes an intro cinematic screen before the walkthrough. It has fallback visuals and is ready for scene images and narration files.
- The exploration view now includes a presenter-safe Return to Maia control that opens a closing leadership summary.
- The leadership route now includes a compact Scroll of Destiny reveal between the Maia bridge and mentor recap.
- Scroll of Destiny / Manifest module already supports student reflection, base planning language, and three Foretold Signposts.
- Save/resume/progress state exists through the local demo save flow, with backend-style fields already modeled in the project.
- The large Tiled world map is now the active bundled map source for gameplay parsing and rendering.
- A temporary adventurer/player sprite has been added for the playable demo.

### Partially ready

- The big map renders through Phaser, but it still needs live browser verification outside the current sandbox and may need asset-path cleanup if Antigravity/Vite serves assets differently.
- The Tiled map is art-started, but gameplay object layers for triggers, gates, docks, Maia handoffs, research beats, and save/progress beats still need to be authored.
- Scroll of Destiny exists, and the leadership route now has a cleaner guided reveal so Corey sees the strongest instructional meaning quickly.
- Maia is represented through launch points, copy, and a visible sample Maia-style profile bridge.

### Not ready yet

- The first-pass in-app intro cinematic is implemented. It still needs final scene PNGs and narration audio.
- No dedicated Corey-guided demo mode exists yet.
- The sample teacher-reviewed Maia profile screen exists, but it still needs visual polish and stronger integration with the actual save fields.
- The explicit closing beat now returns the walkthrough to Maia / NYS Career Plan finalization language. It still needs visual polish and rehearsal.
- Live Maia integration is intentionally out of scope for this demo and should not block scheduling.

## Recommended Demo Scope

The leadership demo should be presented as a guided walkthrough, not a full open beta. The reliable version should include:

1. Title screen branded as a leadership demo prepared for Corey.
2. Short intro cinematic or in-app cinematic sequence.
3. Mirror of Maia explanation and handoff.
4. Sample teacher-reviewed Maia-style data profile.
5. Base stats reveal and three Foretold Signposts.
6. Scroll of Destiny / manifest moment.
7. One realm exploration interaction.
8. One career research or comparison interaction.
9. Visible save/resume/progress beat.
10. Closing explanation that students later return to Maia and complete the NYS Career Plan with stronger understanding.

## Realistic Timeline

### Fast internal preview: 1 focused work session

Good for checking direction, not ideal for Corey.

- Rebrand visible UI away from Night One / generic prototype language.
- Add leadership walkthrough copy.
- Add a first-pass Maia explanation and guided sequence.
- Verify typecheck.

Risk: still feels like a prototype if map rendering or player sprite presentation misbehaves.

### Credible Corey demo: 3 to 5 school days

Recommended minimum if this meeting could affect the future of the project.

- Build dedicated guided demo mode.
- Add a polished in-app intro cinematic.
- Add sample Maia profile bridge and stats reveal.
- Tighten Scroll of Destiny reveal for presentation.
- Add one reliable realm interaction and one reliable research/progress interaction.
- Add closing Maia / NYS Career Plan return screen.
- Verify in browser, including Antigravity/Vite asset loading.
- Prepare a short talk track and fallback path if the map view glitches.

### Higher-wow leadership demo: 1 to 2 weeks

Best option if the demo needs to feel more like a funded product prototype.

- Create or commission intro cinematic art/video.
- Fix and author Tiled object layers for the first guided route.
- Improve map traversal staging: rivers, bridges, raft/dock, volcanic gate, forest route, mountain pass.
- Replace temporary player sprite if the adventurer art is not the final tone.
- Add stronger teacher/admin data story around Maia interpretation.
- Run full browser QA and rehearse the live path.

## Implementation Chunks

### Chunk 1 - framing and safety

- Remove visible Night One / Day One / generic prototype branding.
- Rebrand title and instructions as a Corey leadership walkthrough.
- Add a project plan artifact for demo readiness.

### Chunk 2 - guided demo spine

- Add a dedicated guided demo state or overlay.
- Define the beats: intro, Maia, profile bridge, stats, signposts, exploration, research, save, return to Maia.
- Make navigation through those beats presenter-friendly.

### Chunk 3 - Maia profile bridge

- Added a sample processed data object with fields:
  - maia_assessment_complete
  - maia_reviewed_by_teacher
  - top_interest_1
  - top_interest_2
  - top_interest_3
  - suggested_cluster_1
  - suggested_cluster_2
  - suggested_cluster_3
  - base_stat_profile
  - foretold_signposts
  - last_synced_by_teacher
  - sync_notes
- Render it as teacher-reviewed input, not raw Maia analytics.

Status: first pass implemented in the app route. Next pass should connect these values to the actual manifest/signpost state and improve presentation polish.

### Chunk 3.5 - Scroll reveal

- Added a compact Scroll of Destiny reveal screen after the Maia bridge.
- Shows base stats, three Foretold Signposts, and the instructional meaning of signposts as starting points rather than final answers.
- Next pass should sync the reveal into the saved exploration signpost fields so the map strip and reveal always match.

### Chunk 4 - presentation polish

- Add in-app cinematic intro.
- Tighten title/menu styling.
- Add the closing return-to-Maia screen.
- Add a fallback presentation route in case the large Tiled map view is not demo-stable.

Status: first-pass cinematic screen implemented. Drop final media into `Codex/frontend/public/assets/intro/` using the filenames documented in that folder's README.
The first-pass return-to-Maia closing screen is also implemented and reachable from exploration.

### Chunk 5 - map and gameplay route

- Add Tiled object layers and triggers for the guided route.
- Add one realm interaction, one research beat, and one progress/save beat.
- Keep the first route short, readable, and hard to break live.

## Scheduling Recommendation

Do not schedule the Corey demo for tomorrow unless the goal is only to show promise and accept visible roughness. For a demo that could decide the future of the project, schedule it 3 to 5 school days out at minimum. If the goal is real wow factor, schedule 1 to 2 weeks out and use the extra time on cinematic polish, map reliability, and a rehearsed guided path.
