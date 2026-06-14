import { postLhTeacherWebAppJson } from './lhWebAppClient';

export type ComparisonLedgerRowPayload = {
  submitted_iso: string;
  player_id: string;
  module_id: string;
  realm_id: string;
  realm_name: string;
  career_cluster: string;
  career_areas: string;
  research_url: string;
  jobs_found: string;
  skills_needed: string;
  school_subjects: string;
  work_environment: string;
  why_fits: string;
  questions: string;
};

export type ComparisonLedgerSubmitResult =
  | { ok: true; message: string }
  | { ok: false; message: string; errors?: string[] };

export async function submitComparisonLedgerRemote(args: {
  player_id: string;
  rows: ComparisonLedgerRowPayload[];
}): Promise<ComparisonLedgerSubmitResult> {
  const url = import.meta.env.VITE_LH_TEACHER_APPS_SCRIPT_URL?.trim();
  if (!url) {
    return { ok: true, message: 'Ledger sealed locally (no teacher backend URL configured).' };
  }

  const res = await postLhTeacherWebAppJson({
    action: 'submit_comparison_ledger',
    player_id: args.player_id,
    rows: args.rows,
  });

  if (!res.ok) {
    return { ok: false, message: res.message, errors: res.errors };
  }

  const parsed = res.payload;
  if (!parsed.ok) {
    const serverMsg =
      (parsed.message as string | undefined)?.trim() ||
      (parsed.error ? `Server error: ${parsed.error}` : 'Comparison Ledger submission rejected by server.');
    return {
      ok: false,
      message: serverMsg,
      errors:
        (parsed.errors as string[] | undefined) ??
        (parsed.error ? [String(parsed.error)] : undefined),
    };
  }

  return {
    ok: true,
    message: (parsed.message as string) || 'Comparison Ledger submitted to teacher dashboard.',
  };
}
