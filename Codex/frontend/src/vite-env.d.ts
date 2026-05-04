/// <reference types="vite/client" />

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
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
