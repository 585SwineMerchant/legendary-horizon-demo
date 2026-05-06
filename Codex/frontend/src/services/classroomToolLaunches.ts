/**
 * Milestone 15 — classroom / instructional tool handoffs (new tab, facilitator-configurable URLs).
 * Defaults favor stable public entry points; production builds should set `VITE_LH_*` overrides.
 */

export type ClassroomToolHandlers = {
  onOpenOnet: () => void;
  onOpenMaia: () => void;
  onOpenChronicleSlides: () => void;
  onOpenEnrollmentForm: () => void;
  onOpenQuizlet: () => void;
  onOpenGoogleClassroom: () => void;
};

export function openUrlInNewTabSafe(url: string): boolean {
  try {
    const w = window.open(url, '_blank', 'noopener,noreferrer');
    return Boolean(w);
  } catch {
    return false;
  }
}

export function openUrlInPopupWindowSafe(
  url: string,
  name = `lh_maia_handoff_${Date.now()}`,
  opts?: { width?: number; height?: number },
): Window | null {
  try {
    const width = Math.max(420, Math.min(opts?.width ?? 980, 1400));
    const height = Math.max(420, Math.min(opts?.height ?? 720, 1100));
    // Center on the current screen (best-effort across browsers).
    const left = Math.max(0, Math.round((window.screenX ?? window.screenLeft ?? 0) + (window.outerWidth - width) / 2));
    const top = Math.max(0, Math.round((window.screenY ?? window.screenTop ?? 0) + (window.outerHeight - height) / 2));

    // Supplying features nudges browsers toward a real popup window vs a new tab.
    const features = [
      `popup=yes`,
      `width=${width}`,
      `height=${height}`,
      `left=${left}`,
      `top=${top}`,
      `resizable=yes`,
      `scrollbars=yes`,
    ].join(',');

    const w = window.open(url, name, features);
    if (!w) return null;
    try {
      w.focus();
    } catch {
      // Focus is best-effort.
    }
    return w;
  } catch {
    return null;
  }
}

/** O*NET–adjacent quick occupation search (My Next Move, DOT partner tool). Override with `VITE_LH_ONET_SEARCH_URL_TEMPLATE` (`{q}` = raw keyword). */
export function buildOnetLaunchUrl(keyword: string): string {
  const q = keyword.trim() || 'careers';
  const template = import.meta.env.VITE_LH_ONET_SEARCH_URL_TEMPLATE?.trim();
  if (template) {
    return template.replace(/\{q\}/g, encodeURIComponent(q)).replace(/\{Q\}/g, encodeURIComponent(q));
  }
  return `https://www.mynextmove.org/find/search?s=${encodeURIComponent(q)}`;
}

/** Maia Learning (district deployments vary — use `VITE_LH_MAIA_URL` for your portal). */
export function buildMaiaLaunchUrl(): string {
  return import.meta.env.VITE_LH_MAIA_URL?.trim() || 'https://app.maialearning.com/v3/user-login';
}

/** Chronicle capstone — Slides template duplicate when `VITE_LH_CHRONICLE_SLIDES_TEMPLATE_ID` is set; otherwise blank deck. */
export function buildChronicleSlidesLaunchUrl(): string {
  const custom = import.meta.env.VITE_LH_CHRONICLE_SLIDES_URL?.trim();
  if (custom) return custom;
  const tid = import.meta.env.VITE_LH_CHRONICLE_SLIDES_TEMPLATE_ID?.trim();
  if (tid) return `https://docs.google.com/presentation/d/${tid}/copy`;
  return 'https://docs.google.com/presentation/create';
}

/** Enrollment Rune / surveys — full form URL preferred (`VITE_LH_ENROLLMENT_FORM_URL`). */
export function buildEnrollmentFormLaunchUrl(): string {
  return import.meta.env.VITE_LH_ENROLLMENT_FORM_URL?.trim() || 'https://docs.google.com/forms/u/0/';
}

/** Quizlet — deep-link a class set when `VITE_LH_QUIZLET_SET_URL` is set; otherwise search. */
export function buildQuizletLaunchUrl(searchHint: string): string {
  const setUrl = import.meta.env.VITE_LH_QUIZLET_SET_URL?.trim();
  if (setUrl) return setUrl;
  const hint = searchHint.trim() || 'vocabulary';
  return `https://quizlet.com/search?query=${encodeURIComponent(hint)}`;
}

/** Google Classroom course or home — set `VITE_LH_GOOGLE_CLASSROOM_URL` to a `/c/COURSE_ID` link for one-click entry. */
export function buildGoogleClassroomLaunchUrl(): string {
  return import.meta.env.VITE_LH_GOOGLE_CLASSROOM_URL?.trim() || 'https://classroom.google.com/';
}
