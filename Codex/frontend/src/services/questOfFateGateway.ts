import { postLhWebAppJson } from './lhWebAppClient';

export type QuestOfFateWorksheetPayload = {
  career_name: string;
  career_summary: string;
  responsibilities: string;
  work_environment: string;
  median_salary: string;
  min_education: string;
  credentials: string;
  pros: string;
  cons: string;
  personal_fit: string;
  prophecy_title: string;
  prophecy_id: string;
  submitted_at_iso: string;
};

export type QuestOfFateSubmitResult =
  | { ok: true; message: string }
  | { ok: false; message: string; errors?: string[] };

export async function submitQuestOfFateWorksheetRemote(args: {
  player_id: string;
  worksheet: QuestOfFateWorksheetPayload;
}): Promise<QuestOfFateSubmitResult> {
  const url = import.meta.env.VITE_LH_APPS_SCRIPT_WEBAPP_URL?.trim();
  if (!url) {
    return { ok: true, message: 'Worksheet sealed locally (no backend URL configured).' };
  }

  const res = await postLhWebAppJson({
    action: 'submit_quest_of_fate_worksheet',
    player_id: args.player_id,
    worksheet: args.worksheet,
  });

  if (!res.ok) {
    return { ok: false, message: res.message, errors: res.errors };
  }

  const parsed = res.payload;
  if (!parsed.ok) {
    return {
      ok: false,
      message: (parsed.message as string) || 'Worksheet submission rejected by server.',
      errors:
        (parsed.errors as string[] | undefined) ??
        (parsed.error ? [String(parsed.error)] : undefined),
    };
  }

  return {
    ok: true,
    message: (parsed.message as string) || 'Career worksheet submitted to teacher dashboard.',
  };
}
