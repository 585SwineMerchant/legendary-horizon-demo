/**
 * Shared POST helpers for Google Apps Script Web App backends.
 *
 * Two backends exist — use the right helper for each call:
 *   postLhWebAppJson        → game/save backend  (VITE_LH_APPS_SCRIPT_WEBAPP_URL)
 *   postLhTeacherWebAppJson → teacher backend    (VITE_LH_TEACHER_APPS_SCRIPT_URL)
 */

export type LhWebAppJsonResult =
  | { ok: true; status: number; payload: Record<string, unknown> }
  | { ok: false; message: string; errors?: string[]; rawText?: string };

async function postToLhWebApp(url: string, body: Record<string, unknown>): Promise<LhWebAppJsonResult> {
  const spreadsheetId = import.meta.env.VITE_LH_SPREADSHEET_ID?.trim();
  const merged = { ...body, spreadsheet_id: body.spreadsheet_id ?? spreadsheetId ?? undefined };
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(merged),
    });
    const text = await res.text();
    let payload: Record<string, unknown> = {};
    try {
      payload = JSON.parse(text) as Record<string, unknown>;
    } catch {
      return { ok: false, message: 'Server returned non-JSON.', errors: [text.slice(0, 500)], rawText: text };
    }
    if (!res.ok) {
      const errors = (payload.errors as string[] | undefined) ?? (payload.error ? [String(payload.error)] : undefined);
      return { ok: false, message: `HTTP ${res.status} from Web App.`, errors: errors ?? [text.slice(0, 300)], rawText: text };
    }
    return { ok: true, status: res.status, payload };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, message: 'Network error calling Web App (check URL and CORS).', errors: [msg] };
  }
}

/** POST to the game/save backend (VITE_LH_APPS_SCRIPT_WEBAPP_URL). */
export async function postLhWebAppJson(body: Record<string, unknown>): Promise<LhWebAppJsonResult> {
  const url = import.meta.env.VITE_LH_APPS_SCRIPT_WEBAPP_URL?.trim();
  if (!url) return { ok: false, message: 'VITE_LH_APPS_SCRIPT_WEBAPP_URL is not set.' };
  return postToLhWebApp(url, body);
}

/** POST to the teacher backend (VITE_LH_TEACHER_APPS_SCRIPT_URL). */
export async function postLhTeacherWebAppJson(body: Record<string, unknown>): Promise<LhWebAppJsonResult> {
  const url = import.meta.env.VITE_LH_TEACHER_APPS_SCRIPT_URL?.trim();
  if (!url) return { ok: false, message: 'VITE_LH_TEACHER_APPS_SCRIPT_URL is not set. Add it to .env.local.' };
  return postToLhWebApp(url, body);
}
