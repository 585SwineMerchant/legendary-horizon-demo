import { postLhWebAppJson } from './lhWebAppClient';

export type TeacherToolRemoteOutcome = { ok: boolean; message: string; simulated?: boolean };

function teacherRemoteEnabled(): boolean {
  const url = import.meta.env.VITE_LH_APPS_SCRIPT_WEBAPP_URL?.trim();
  const forceSim = import.meta.env.VITE_LH_FORCE_SIMULATED_SAVE === 'true';
  return Boolean(url) && !forceSim;
}

async function postTeacher(action: string, body: Record<string, unknown>): Promise<TeacherToolRemoteOutcome> {
  if (!teacherRemoteEnabled()) {
    return { ok: true, message: 'Local / simulated facilitator action (no Web App POST).', simulated: true };
  }
  const res = await postLhWebAppJson({ action, ...body });
  if (!res.ok) {
    return { ok: false, message: res.message };
  }
  const p = res.payload;
  if (!p.ok) {
    return {
      ok: false,
      message: (p.message as string) || 'Request rejected by Apps Script.',
    };
  }
  return { ok: true, message: (p.message as string) || 'OK' };
}

export function teacherUnlockQuestRemote(playerId: string, questId: string): Promise<TeacherToolRemoteOutcome> {
  return postTeacher('teacher_unlock_quest', { player_id: playerId, quest_id: questId });
}

export function teacherRestoreBackupRemote(playerId: string): Promise<TeacherToolRemoteOutcome> {
  return postTeacher('teacher_restore_backup', { player_id: playerId });
}

export function teacherRestoreItemRemote(
  playerId: string,
  itemId: string,
  qty: number,
  label?: string,
): Promise<TeacherToolRemoteOutcome> {
  return postTeacher('teacher_restore_item', {
    player_id: playerId,
    item_id: itemId,
    qty,
    ...(label ? { label } : {}),
  });
}

export function teacherResetActRemote(playerId: string, targetAct: number): Promise<TeacherToolRemoteOutcome> {
  return postTeacher('teacher_reset_act', { player_id: playerId, target_act: targetAct });
}
