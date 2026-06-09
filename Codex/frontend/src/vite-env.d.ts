/// <reference types="vite/client" />

/** Injected by `vite.config.ts` `define` for production intro video URL. */
declare const __LH_INTRO_RELEASE_VIDEO__: string;
/** Short git commit hash of this build (e.g. `"3b81647"`). */
declare const __LH_BUILD_COMMIT__: string;
/** ISO build timestamp truncated to the minute (e.g. `"2026-06-09 14:32 UTC"`). */
declare const __LH_BUILD_DATE__: string;
/** Vite mode string: `"development"` or `"production"`. */
declare const __LH_BUILD_MODE__: string;

interface ImportMetaEnv {
  /** Full Web App URL (…/macros/s/…/exec). When set, manual save POSTs here instead of simulating. */
  readonly VITE_LH_APPS_SCRIPT_WEBAPP_URL?: string;
  /** Optional override when the Web App URL is fixed but spreadsheet id varies per build. */
  readonly VITE_LH_SPREADSHEET_ID?: string;
  /** Set to `true` to keep local simulation even if `VITE_LH_APPS_SCRIPT_WEBAPP_URL` is set. */
  readonly VITE_LH_FORCE_SIMULATED_SAVE?: string;
  /** When `true`, exploration shows the Milestone 4 Tiled debug panel (also on in Vite dev server). */
  readonly VITE_LH_MAP_DEBUG?: string;
  /** When `true`, exploration shows collapsible quest JSON (also on in Vite dev server). */
  readonly VITE_LH_QUEST_DEBUG?: string;
  /** Milestone 15 — full URL template for O*NET / career search; use `{q}` for encoded search hint. */
  readonly VITE_LH_ONET_SEARCH_URL_TEMPLATE?: string;
  /** Maia Learning portal (district-specific in production). */
  readonly VITE_LH_MAIA_URL?: string;
  /** Google Slides URL for Chronicle (overrides template + create flows when set). */
  readonly VITE_LH_CHRONICLE_SLIDES_URL?: string;
  /** Slides file id for “Make a copy” Chronicle starter deck. */
  readonly VITE_LH_CHRONICLE_SLIDES_TEMPLATE_ID?: string;
  /** Published Google Form for enrollment / surveys. */
  readonly VITE_LH_ENROLLMENT_FORM_URL?: string;
  /** Direct link to a class Quizlet set (otherwise search is used). */
  readonly VITE_LH_QUIZLET_SET_URL?: string;
  /** Google Classroom course home (`…/c/COURSE_ID`) or class link. */
  readonly VITE_LH_GOOGLE_CLASSROOM_URL?: string;
  /** When `true`, show Pause → Facilitator tools (also on in Vite dev server). */
  readonly VITE_LH_TEACHER_PANEL?: string;
  /**
   * When `true`, Pause shows direct GT-101 / GT-102 module shortcuts (bypasses intended HQ + quest gating).
   * Defaults off in production-shaped builds; dev server still enables via `import.meta.env.DEV`.
   */
  readonly VITE_LH_PAUSE_MODULE_SHORTCUTS?: string;
  /** Full URL to the illustrated realm atlas art; overrides default `lh3.googleusercontent.com` host for the Fog map file. */
  readonly VITE_LH_REALM_ATLAS_IMAGE_URL?: string;
  /**
   * When `true`, demo bootstrap uses Apps Script / localStorage like production.
   * Default (unset): bundled `data/samples/demo_save_state.json` for predictable demos.
   */
  readonly VITE_LH_DEMO_USE_REMOTE_SAVE?: string;
  /**
   * Root URL for large media (intro/cutscene MP4). Trailing slash optional.
   * Dev defaults to the Vite origin; production defaults to GitHub Pages unless set.
   */
  readonly VITE_LH_MEDIA_BASE_URL?: string;
  /** Override intro iframe HTML path (default: `assets/intro/intro-player.html`). */
  readonly VITE_LH_INTRO_CINEMATIC_SRC?: string;
  /** Override intro video URL/path (default: registry `intro` video). */
  readonly VITE_LH_INTRO_VIDEO_URL?: string;
  /**
   * Override Oracle cinematic iframe HTML path (default: no cutscene — Oracle module skips straight
   * to the prophecy reveal when this is unset).
   * Example: `assets/intro/oracle-player.html`
   */
  readonly VITE_LH_ORACLE_CINEMATIC_SRC?: string;
  /** Background image URL/path for the Scroll of Destiny reveal cinematic parchment. Falls back to amber fill (#f0e4c0). */
  readonly VITE_LH_SCROLL_BG_IMAGE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
