import { useEffect, useMemo, useRef, useState } from 'react';

import type { ModuleResultPayload } from '../../types';
import { runGt102Turn, type Gt102Turn } from '../../services/gt102Gateway';
import { saveGt102Transcript } from '../../services/gt102TranscriptStore';

/** Favor points withheld from passage threshold when the player opened GT-102 after the HQ return deadline. */
const GT102_PUNCTUALITY_FAVOR_PENALTY = 12;

type Props = {
  playerId: string;
  realmId: string;
  /** Set when `interview_deadline_iso` has passed at module entry — interview still runs; passage is harder. */
  interviewArrivalMissedDeadline?: boolean;
  draft: Record<string, string>;
  onDraftChange: (patch: Partial<Record<string, string>>) => void;
  onSubmitResult: (payload: ModuleResultPayload) => void;
};

type SoftSkillOption = { text: string; score: number; feedback: string };
type SoftSkillCheck = { id: number; scenario: string; options: SoftSkillOption[] };

const SOFT_SKILLS: SoftSkillCheck[] = [
  {
    id: 1,
    scenario:
      'The Guild Manager pauses, leaving a long, uncomfortable silence to test your nerve. What is your physical response?',
    options: [
      { text: 'Maintain steady, pleasant eye contact and wait patiently.', score: 10, feedback: 'You showed professional composure.' },
      { text: 'Pull out your glowing crystal (phone) to pass the time.', score: -15, feedback: 'You appeared distracted and disrespectful.' },
      { text: 'Nervously start rambling to fill the silence.', score: -5, feedback: 'You showed a lack of confidence.' },
    ],
  },
  {
    id: 2,
    scenario: "The Manager mentions a complex Guild regulation that you don't fully understand.",
    options: [
      { text: 'Nod and pretend you know exactly what they mean.', score: -10, feedback: 'You lacked integrity by pretending.' },
      { text: 'Politely ask them to clarify the regulation.', score: 10, feedback: 'You showed active listening and honesty.' },
      { text: "Change the subject back to how great your skills are.", score: -5, feedback: 'You avoided the topic entirely.' },
    ],
  },
  {
    id: 3,
    scenario: 'The Manager finishes speaking and formally stands up from their desk.',
    options: [
      { text: 'Stand up, give a firm handshake (or Realm equivalent), and thank them.', score: 10, feedback: 'Excellent professional closing.' },
      { text: "Say 'Peace out' and walk away immediately.", score: -15, feedback: 'Far too casual for a formal Guild Master.' },
      { text: 'Wait awkwardly in your seat for them to tell you to leave.', score: -5, feedback: 'You lacked initiative and awareness.' },
    ],
  },
];

function nowIso(): string {
  return new Date().toISOString();
}

function newTranscriptId(): string {
  return `gt102_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function coerceDraftTranscript(draft: Record<string, string>): {
  transcriptId: string;
  turns: Gt102Turn[];
  favor: number;
  finished: boolean;
  softSkillScore: number;
  nextSoftSkillIndex: number;
  npcId: string;
} {
  const transcriptId = String(draft.transcript_id || '').trim() || newTranscriptId();
  let turns: Gt102Turn[] = [];
  try {
    const raw = draft.turns_json ? JSON.parse(draft.turns_json) : [];
    if (Array.isArray(raw)) turns = raw as Gt102Turn[];
  } catch {
    turns = [];
  }
  const favor = Number(draft.favor ?? '50') || 50;
  const finished = draft.finished === 'true';
  const softSkillScore = Number(draft.soft_skill_score ?? '0') || 0;
  const nextSoftSkillIndex = Number(draft.soft_skill_next_idx ?? '0') || 0;
  const npcId = String(draft.npc_id ?? '').trim();
  return { transcriptId, turns, favor, finished, softSkillScore, nextSoftSkillIndex, npcId };
}

export function TrialOfTonguesModule({
  playerId,
  realmId,
  interviewArrivalMissedDeadline = false,
  draft,
  onDraftChange,
  onSubmitResult,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [npcHeader, setNpcHeader] = useState<{ npc_id: string; name: string; title: string } | null>(null);
  const [pendingRoll, setPendingRoll] = useState<SoftSkillCheck | null>(null);
  const [softSkillFlash, setSoftSkillFlash] = useState<{ text: string; score: number } | null>(null);

  const parsed = useMemo(() => coerceDraftTranscript(draft), [draft]);
  const turns = parsed.turns;
  const favor = parsed.favor;
  const finished = parsed.finished;
  const softSkillScore = parsed.softSkillScore;
  const nextSoftSkillIndex = parsed.nextSoftSkillIndex;

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [turns.length, busy]);

  const startIfEmpty = async () => {
    if (busy) return;
    if (turns.length) return;
    setBusy(true);
    const outcome = await runGt102Turn({
      playerId,
      realmId,
      transcript: { turns: [], favor: 50, finished: false },
      userText: '',
    });
    setBusy(false);
    if (!outcome.ok) return;
    setNpcHeader({ npc_id: outcome.next.npc.npc_id, name: outcome.next.npc.name, title: outcome.next.npc.title });
    onDraftChange({
      transcript_id: parsed.transcriptId,
      turns_json: JSON.stringify(outcome.next.turns),
      favor: String(outcome.next.favor),
      finished: outcome.next.finished ? 'true' : 'false',
      npc_id: outcome.next.npc.npc_id,
    });
  };

  useEffect(() => {
    void startIfEmpty();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const send = async () => {
    const text = input.trim();
    if (!text || busy || finished || pendingRoll) return;
    setInput('');
    setBusy(true);
    const outcome = await runGt102Turn({
      playerId,
      realmId,
      transcript: { turns, favor, finished },
      userText: text,
    });
    setBusy(false);
    if (!outcome.ok) return;
    setNpcHeader({ npc_id: outcome.next.npc.npc_id, name: outcome.next.npc.name, title: outcome.next.npc.title });
    onDraftChange({
      transcript_id: parsed.transcriptId,
      turns_json: JSON.stringify(outcome.next.turns),
      favor: String(outcome.next.favor),
      finished: outcome.next.finished ? 'true' : 'false',
      npc_id: outcome.next.npc.npc_id,
    });

    // Trigger soft-skill check after each user answer, up to 3.
    const check = SOFT_SKILLS[nextSoftSkillIndex];
    if (check) {
      setPendingRoll(check);
    }
  };

  const passThreshold = 70;
  const punctualityPenalty = interviewArrivalMissedDeadline ? GT102_PUNCTUALITY_FAVOR_PENALTY : 0;
  const effectiveFavorForPass = Math.max(0, favor - punctualityPenalty);
  const hasPassed = finished && effectiveFavorForPass >= passThreshold;

  return (
    <div className="lh-world-map__layout">
      <section className="lh-world-map__realms" aria-label="Trial of Tongues chat">
        <h3 className="lh-heading-sm">The Trial of Tongues (GT-102)</h3>
        <p className="lh-world-map__hint">
          Guild Favor: <strong>{favor}/100</strong> (pass at {passThreshold}+ on effective favor)
          {punctualityPenalty > 0 ? (
            <>
              {' '}
              — <strong>late return to the hall</strong>: −{punctualityPenalty} for passage purposes (effective{' '}
              <strong>{effectiveFavorForPass}</strong>)
            </>
          ) : null}
        </p>

        <div
          ref={scrollRef}
          className="lh-panel"
          style={{ padding: 12, height: 360, overflowY: 'auto', marginTop: 8 }}
          aria-label="Transcript"
        >
          {npcHeader ? (
            <p className="lh-world-map__meta">
              <strong>{npcHeader.name}</strong> — {npcHeader.title}
            </p>
          ) : null}
          {turns.map((t, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                justifyContent: t.role === 'user' ? 'flex-end' : 'flex-start',
                marginTop: 10,
              }}
            >
              <div
                style={{
                  maxWidth: '85%',
                  padding: 10,
                  borderRadius: 12,
                  border: '1px solid rgba(245,158,11,0.25)',
                  background: t.role === 'user' ? 'rgba(30,41,59,0.65)' : 'rgba(17,20,29,0.75)',
                  color: '#f1f5f9',
                }}
              >
                <div style={{ fontSize: 13, lineHeight: 1.4 }}>{t.text}</div>
              </div>
            </div>
          ))}
          {busy ? <p className="lh-world-map__meta">The chamber listens…</p> : null}
        </div>

        {softSkillFlash ? (
          <p className="lh-world-map__meta" style={{ marginTop: 8 }}>
            Soft skill: {softSkillFlash.text} ({softSkillFlash.score >= 0 ? '+' : ''}
            {softSkillFlash.score})
          </p>
        ) : null}

        {pendingRoll ? (
          <div className="lh-panel" style={{ padding: 12, marginTop: 10 }}>
            <h4 className="lh-heading-sm">Charisma check</h4>
            <p className="lh-world-map__meta">{pendingRoll.scenario}</p>
            <div className="lh-stack" style={{ marginTop: 10 }}>
              {pendingRoll.options.map((opt) => (
                <button
                  key={opt.text}
                  type="button"
                  className="lh-button lh-button--secondary"
                  onClick={() => {
                    const nextScore = Math.max(-100, Math.min(100, softSkillScore + opt.score));
                    onDraftChange({
                      soft_skill_score: String(nextScore),
                      soft_skill_next_idx: String(nextSoftSkillIndex + 1),
                    });
                    setPendingRoll(null);
                    setSoftSkillFlash({ text: opt.feedback, score: opt.score });
                    window.setTimeout(() => setSoftSkillFlash(null), 1800);
                  }}
                >
                  {opt.text}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {!finished ? (
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <input
              className="lh-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your professional response…"
              disabled={busy || pendingRoll !== null}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void send();
                }
              }}
            />
            <button type="button" className="lh-button lh-button--primary" onClick={() => void send()} disabled={busy || pendingRoll !== null || !input.trim()}>
              Send
            </button>
          </div>
        ) : (
          <div className="lh-world-map__actions" style={{ marginTop: 12 }}>
            <p className="lh-world-map__meta">
              Result: <strong>{hasPassed ? 'Passed' : 'Failed'}</strong>
              {punctualityPenalty > 0 ? (
                <span>
                  {' '}
                  (punctuality: late — {punctualityPenalty} favor withheld from the passage bar; raw favor {favor})
                </span>
              ) : (
                <span> (punctuality: on time)</span>
              )}
            </p>
            <button
              type="button"
              className="lh-button lh-button--primary"
              onClick={() => {
                const createdIso = nowIso();
                // Persist transcript locally for teacher review and for later artifacts.
                const interviewPunctuality: 'on_time' | 'late' = interviewArrivalMissedDeadline ? 'late' : 'on_time';

                saveGt102Transcript({
                  transcriptId: parsed.transcriptId,
                  playerId,
                  realmId,
                  createdIso,
                  state: {
                    turns,
                    favor,
                    finished: true,
                    interview_punctuality: interviewPunctuality,
                    npc: {
                      npc_id: npcHeader?.npc_id ?? String(draft.npc_id ?? 'npc_guild_proctor'),
                      name: npcHeader?.name ?? 'Guild Proctor',
                      title: npcHeader?.title ?? 'High Council Liaison',
                    },
                  },
                });

                onSubmitResult({
                  module_id: 'mod_gt102_trial_of_tongues',
                  quest_id: 'gt-102',
                  realm_id: realmId,
                  npc_id: npcHeader?.npc_id ?? String(draft.npc_id ?? ''),
                  status: hasPassed ? 'passed' : 'failed',
                  score: favor,
                  soft_skill_score: softSkillScore,
                  interview_punctuality: interviewPunctuality,
                  artifacts: {
                    transcript: { transcript_id: parsed.transcriptId, storage: 'local', created_iso: createdIso },
                  },
                  unlocks: hasPassed ? [{ kind: 'unlock_module', target_id: 'mod_gt103_placeholder' }] : undefined,
                  completed_at_iso: createdIso,
                });
              }}
            >
              Seal the trial & return
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

