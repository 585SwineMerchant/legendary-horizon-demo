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
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
