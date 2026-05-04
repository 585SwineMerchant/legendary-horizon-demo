import { postLhWebAppJson } from './lhWebAppClient';

export type Gt102Turn = { role: 'user' | 'npc'; text: string; at_iso: string };

export type Gt102TranscriptState = {
  turns: Gt102Turn[];
  favor: number;
  finished: boolean;
  npc: { npc_id: string; name: string; title: string };
  /** Present when the transcript is sealed — return-to-HQ punctuality vs deadline. */
  interview_punctuality?: 'on_time' | 'late';
};

type TurnOutcome =
  | { ok: true; next: Gt102TranscriptState }
  | { ok: false; message: string; errors?: string[] };

function fallbackNpc(realmId: string): Gt102TranscriptState['npc'] {
  if (realmId === 'realm_etheric_nexus') return { npc_id: 'npc_it_technomancer_zero', name: 'Technomancer Zero', title: 'Core Overseer of the Nexus' };
  if (realmId === 'realm_monolith_masonry') return { npc_id: 'npc_arch_master_mason_kael', name: 'Master Mason Kael', title: 'Architect of the Monolith' };
  if (realmId === 'realm_aethelwood') return { npc_id: 'npc_ag_elder_thorne', name: 'Elder Thorne', title: 'High Warden of Aethelwood' };
  return { npc_id: 'npc_guild_proctor', name: 'Guild Proctor', title: 'High Council Liaison' };
}

function nowIso(): string {
  return new Date().toISOString();
}

function simulateTurn(args: {
  playerId: string;
  realmId: string;
  transcript: Omit<Gt102TranscriptState, 'npc'>;
  userText: string;
}): TurnOutcome {
  const npc = fallbackNpc(args.realmId);
  const turns: Gt102Turn[] = [...args.transcript.turns];
  let favor = args.transcript.favor ?? 50;

  const trimmed = args.userText.trim();
  if (trimmed) {
    turns.push({ role: 'user', text: trimmed, at_iso: nowIso() });
    if (trimmed.length > 20) favor += 5;
    if (trimmed[0] === trimmed[0]?.toUpperCase()) favor += 2;
    if (/[.!?]$/.test(trimmed)) favor += 2;
    if (/\bidk\b|\blol\b|\bgonna\b/i.test(trimmed)) favor -= 15;
    favor = Math.max(0, Math.min(100, favor));
  }

  const userCount = turns.filter((t) => t.role === 'user').length;
  const reply =
    userCount === 0
      ? `I am ${npc.name}, ${npc.title}. Answer with clarity, Traveler. Why do you seek to serve this Guild?`
      : userCount === 1
        ? 'So noted. Tell me of a time you solved a problem using your unique skills — what did you do, and what was the outcome?'
        : userCount === 2
          ? 'Accepted. How do you handle disputes with fellow Travelers when emotions run high?'
          : 'The interview is concluded. I will now weigh your merits.';

  turns.push({ role: 'npc', text: reply, at_iso: nowIso() });
  const finished = reply.includes('The interview is concluded.');

  return { ok: true, next: { turns, favor, finished, npc } };
}

export async function runGt102Turn(args: {
  playerId: string;
  realmId: string;
  transcript: Omit<Gt102TranscriptState, 'npc'>;
  userText: string;
}): Promise<TurnOutcome> {
  const forceSim = import.meta.env.VITE_LH_FORCE_SIMULATED_SAVE === 'true';
  const url = import.meta.env.VITE_LH_APPS_SCRIPT_WEBAPP_URL?.trim();
  if (!url || forceSim) {
    return simulateTurn(args);
  }

  const res = await postLhWebAppJson({
    action: 'gt102_turn',
    player_id: args.playerId,
    realm_id: args.realmId,
    transcript: { turns: args.transcript.turns, favor: args.transcript.favor },
    user_text: args.userText,
  });

  if (!res.ok) {
    return { ok: false, message: res.message, errors: res.errors };
  }

  const payload = res.payload;
  if (!payload.ok) {
    return {
      ok: false,
      message: (payload.message as string) || 'gt102_turn rejected',
      errors: (payload.errors as string[] | undefined) ?? (payload.error ? [String(payload.error)] : undefined),
    };
  }

  const npc = (payload.npc as Gt102TranscriptState['npc']) || fallbackNpc(args.realmId);
  const nextRaw = (payload.next as Partial<Gt102TranscriptState>) || {};
  const turns = Array.isArray(nextRaw.turns) ? (nextRaw.turns as Gt102Turn[]) : [];
  const favor = typeof nextRaw.favor === 'number' ? nextRaw.favor : Number(nextRaw.favor) || 50;
  const finished = Boolean(nextRaw.finished);

  return { ok: true, next: { turns, favor, finished, npc } };
}

