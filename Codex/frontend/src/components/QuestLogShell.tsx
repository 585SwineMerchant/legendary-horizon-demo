import { useMemo } from 'react';

import { useEscapeToClose } from '../hooks/useEscapeToClose';
import { groupQuestsForQuestLog, type QuestLogGroupKey } from '../quests/questEngine';
import type { QuestDefinition } from '../types';
import { ScrollSubMenuShell } from './ScrollSubMenuShell';

export type Act3GuildProgress = {
  signpostsVisited: number;
  guildsResearched: number;
  hasLedgerNotes: boolean;
  ledgerSubmitted: boolean;
};

export type Act4GuildProgress = {
  applicationUnlocked: boolean;
  applicationSealed: boolean;
  interviewInvited: boolean;
  accepted: boolean;
};

type Props = {
  open: boolean;
  onClose: () => void;
  quests: QuestDefinition[];
  onMarkQuestTurnedIn?: (questId: string) => void;
  guildPathBreatherNote?: string | null;
  currentRequiredNextAction?: string | null;
  act3GuildProgress?: Act3GuildProgress | null;
  act4GuildProgress?: Act4GuildProgress | null;
  onOpenTruePathPicker?: () => void;
};

const GROUP_LABEL: Record<QuestLogGroupKey, string> = {
  main: 'Main Path',
  side: 'Side Quests',
  guild: 'Guild Trials',
  system: 'System & Classroom',
  completed: 'Completed & Turned In',
};

const GROUP_ICON: Record<QuestLogGroupKey, string> = {
  main: '◈',
  side: '◇',
  guild: '⚔',
  system: '📜',
  completed: '✓',
};

const STATUS_COLOR: Record<string, string> = {
  active: '#f59e0b',
  available: '#86efac',
  completed: '#6ee7b7',
  turned_in: '#4ade80',
  locked: 'rgba(255,255,255,0.40)',
};

// ── Act III "Chart the Guild Roads" mission block ─────────────────────────

type ObjState = 'complete' | 'active' | 'pending';

function ObjectiveLine({
  state,
  label,
  sub,
}: {
  state: ObjState;
  label: string;
  sub?: string;
}) {
  const icon  = state === 'complete' ? '✓' : state === 'active' ? '◆' : '○';
  const color = state === 'complete'
    ? '#4ade80'
    : state === 'active'
    ? '#f59e0b'
    : 'rgba(255,255,255,0.38)';

  return (
    <li style={{ display: 'flex', gap: 10, alignItems: 'flex-start', opacity: state === 'pending' ? 0.55 : 1 }}>
      <span style={{ color, fontSize: 11, marginTop: 2, flexShrink: 0, minWidth: 12, textAlign: 'center' }}>{icon}</span>
      <div>
        <span style={{ fontSize: 13, color: state === 'complete' ? 'rgba(74,222,128,0.80)' : '#f0dfa0', lineHeight: 1.4 }}>
          {label}
        </span>
        {sub && (
          <p style={{ margin: '1px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.50)', lineHeight: 1.4 }}>{sub}</p>
        )}
      </div>
    </li>
  );
}

function Act3GuildMission({ progress }: { progress: Act3GuildProgress }) {
  const { signpostsVisited, guildsResearched, hasLedgerNotes, ledgerSubmitted } = progress;

  const spState: ObjState   = signpostsVisited >= 3  ? 'complete' : signpostsVisited > 0  ? 'active' : 'active';
  const grState: ObjState   = guildsResearched >= 5  ? 'complete' : guildsResearched > 0  ? 'active' : 'active';
  const notesState: ObjState = hasLedgerNotes        ? 'complete' : 'active';
  const gateOk              = signpostsVisited >= 3 && guildsResearched >= 5;
  const submitState: ObjState = ledgerSubmitted      ? 'complete' : gateOk ? 'active' : 'pending';

  const submitLabel = ledgerSubmitted
    ? 'Turn in your Comparison Ledger — complete!'
    : gateOk
    ? 'Turn in your Comparison Ledger from Scroll → Documents'
    : 'Turn in your Comparison Ledger';

  const submitSub = !ledgerSubmitted && !gateOk
    ? `Unlocks after all 3 Foretold Signposts and 5 Guilds are researched`
    : undefined;

  return (
    <section
      aria-label="Chart the Guild Roads — Act III mission"
      style={{
        padding: '14px 16px',
        background: 'rgba(212,160,23,0.07)',
        border: '1px solid rgba(212,160,23,0.22)',
        borderRadius: 4,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <span style={{ fontSize: 14, color: 'rgba(212,160,23,0.88)' }} aria-hidden>◈</span>
        <h3 style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(212,160,23,0.88)' }}>
          Chart the Guild Roads
        </h3>
        <div style={{ flex: 1, height: 1, background: 'rgba(212,160,23,0.18)' }} aria-hidden />
        <span style={{ fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(212,160,23,0.75)', flexShrink: 0 }}>
          Main · Act III
        </span>
      </div>

      {/* Lore helper */}
      <p style={{ margin: '0 0 12px', fontSize: 11, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>
        Your Foretold Signposts are the three Guilds revealed on your Scroll.
        Research them, then compare them with other Guilds before turning in your ledger.
      </p>

      {/* Objective lines */}
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <ObjectiveLine
          state={spState}
          label={`Visit your Foretold Signposts: ${signpostsVisited}/3`}
        />
        <ObjectiveLine
          state={grState}
          label={`Research Guilds for your Comparison Ledger: ${guildsResearched}/5`}
        />
        <ObjectiveLine
          state={notesState}
          label="Fill in your Comparison Ledger research notes"
        />
        <ObjectiveLine
          state={submitState}
          label={submitLabel}
          sub={submitSub}
        />
      </ul>
    </section>
  );
}

function Act4GuildMission({ progress }: { progress: Act4GuildProgress }) {
  const { applicationUnlocked, applicationSealed, interviewInvited, accepted } = progress;

  const runeState: ObjState   = applicationSealed ? 'complete' : applicationUnlocked ? 'active' : 'active';
  const waitState: ObjState   = applicationSealed
    ? interviewInvited || accepted ? 'complete' : 'active'
    : 'pending';
  const inviteState: ObjState = interviewInvited || accepted ? 'complete' : applicationSealed ? 'active' : 'pending';
  const trialState: ObjState  = accepted ? 'complete' : interviewInvited ? 'active' : 'pending';
  const acceptState: ObjState = accepted ? 'complete' : 'pending';

  return (
    <section
      aria-label="The Rite of Enrollment — Act IV mission"
      style={{
        padding: '14px 16px',
        background: 'rgba(120,80,212,0.07)',
        border: '1px solid rgba(120,80,212,0.22)',
        borderRadius: 4,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <span style={{ fontSize: 14, color: 'rgba(160,120,240,0.88)' }} aria-hidden>◈</span>
        <h3 style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(160,120,240,0.88)' }}>
          The Rite of Enrollment
        </h3>
        <div style={{ flex: 1, height: 1, background: 'rgba(160,120,240,0.18)' }} aria-hidden />
        <span style={{ fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(160,120,240,0.75)', flexShrink: 0 }}>
          Main · Act IV
        </span>
      </div>

      <p style={{ margin: '0 0 12px', fontSize: 11, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>
        You have chosen your True Path. Now prove yourself worthy of the hall.
      </p>

      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <ObjectiveLine
          state={runeState}
          label={applicationSealed ? 'Complete the Enrollment Rune — sealed!' : 'Complete the Enrollment Rune (Scroll → Documents)'}
        />
        <ObjectiveLine
          state={waitState}
          label="Await the Guild Manager's review"
          sub={!applicationSealed ? 'Unlocks after your application is sealed' : undefined}
        />
        <ObjectiveLine
          state={inviteState}
          label="Receive your Trial of Tongues summons"
          sub={!applicationSealed ? 'Unlocks after your application is sealed' : undefined}
        />
        <ObjectiveLine
          state={trialState}
          label="Pass the Trial of Tongues (interview practice)"
          sub={!interviewInvited && !accepted ? 'Unlocks after summons received' : undefined}
        />
        <ObjectiveLine
          state={acceptState}
          label={accepted ? 'Guild acceptance received — journey complete!' : 'Receive guild acceptance'}
          sub={!accepted && !interviewInvited ? 'Unlocks after the trial' : undefined}
        />
      </ul>
    </section>
  );
}

function QuestCard({
  q,
  onMarkQuestTurnedIn,
  onOpenTruePathPicker,
}: {
  q: QuestDefinition;
  onMarkQuestTurnedIn?: (id: string) => void;
  onOpenTruePathPicker?: () => void;
}) {
  const terminal = q.status === 'completed' || q.status === 'turned_in';
  const statusColor = STATUS_COLOR[q.status] ?? 'rgba(255,255,255,0.4)';

  return (
    <li
      style={{
        padding: '12px 16px',
        background: terminal ? 'rgba(74,222,128,0.04)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${terminal ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.07)'}`,
        borderRadius: 4,
        opacity: terminal ? 0.7 : 1,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
        <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: '#f0dfa0', lineHeight: 1.3, fontFamily: 'serif' }}>
          {q.title}
        </span>
        <span style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: statusColor,
          flexShrink: 0,
        }}>
          {q.status.replace(/_/g, ' ')}
        </span>
        <span style={{
          fontSize: 10,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'rgba(212,160,23,0.75)',
          flexShrink: 0,
        }}>
          {q.tier}
        </span>
      </div>
      <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.72)', lineHeight: 1.5 }}>
        {q.objective_short}
      </p>
      {q.status === 'completed' && onMarkQuestTurnedIn ? (
        <button
          type="button"
          style={{
            marginTop: 8,
            padding: '4px 12px',
            fontSize: 11,
            background: 'rgba(212,160,23,0.08)',
            border: '1px solid rgba(212,160,23,0.25)',
            borderRadius: 3,
            color: '#d4a017',
            cursor: 'pointer',
            fontFamily: 'serif',
          }}
          onClick={() => onMarkQuestTurnedIn(q.quest_id)}
        >
          Mark turned in to facilitator
        </button>
      ) : null}
      {q.quest_id === 'mq-401' && (q.status === 'active' || q.status === 'available') && onOpenTruePathPicker ? (
        <button
          type="button"
          style={{
            marginTop: 8,
            padding: '6px 16px',
            fontSize: 12,
            background: 'rgba(212,160,23,0.12)',
            border: '1px solid rgba(212,160,23,0.35)',
            borderRadius: 3,
            color: '#d4a017',
            cursor: 'pointer',
            fontFamily: 'var(--lh-guild-display, "Cinzel", serif)',
            fontWeight: 700,
            letterSpacing: '0.03em',
          }}
          onClick={onOpenTruePathPicker}
        >
          Choose True Path →
        </button>
      ) : null}
    </li>
  );
}

export function QuestLogShell({
  open,
  onClose,
  quests,
  onMarkQuestTurnedIn,
  guildPathBreatherNote,
  currentRequiredNextAction,
  act3GuildProgress,
  act4GuildProgress,
  onOpenTruePathPicker,
}: Props) {
  const groups = useMemo(() => groupQuestsForQuestLog(quests), [quests]);
  const lockedCount = useMemo(() => quests.filter((q) => q.status === 'locked').length, [quests]);
  useEscapeToClose(open, onClose);

  if (!open) return null;

  const sectionOrder: QuestLogGroupKey[] = ['main', 'side', 'guild', 'system', 'completed'];

  return (
    <ScrollSubMenuShell
      title="Quest Log"
      subtitle="Legendary Horizon"
      onBack={onClose}
      backLabel="← Back to Scroll"
      ariaLabel="Quest log"
      zIndex={9000}
    >
      {/* Current directive strip */}
      {currentRequiredNextAction ? (
        <div style={{
          padding: '10px 24px',
          borderBottom: '1px solid rgba(212,160,23,0.12)',
          background: 'rgba(245,158,11,0.06)',
          flexShrink: 0,
          textAlign: 'center',
        }}>
          <p style={{ margin: 0, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(212,160,23,0.80)' }}>
            Current directive
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 14, color: '#f0dfa0', fontWeight: 700, lineHeight: 1.3 }}>
            {currentRequiredNextAction}
          </p>
        </div>
      ) : null}

      {/* Quest sections */}
      <div style={{ padding: '0 24px 24px', maxWidth: 720, margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: 28 }}>
        <div style={{ height: 16 }} aria-hidden />

        {/* Act III dynamic mission block — shown when player has reached guild exploration */}
        {act3GuildProgress ? <Act3GuildMission progress={act3GuildProgress} /> : null}

        {/* Act IV dynamic mission block — shown when Guild Manager has been met */}
        {act4GuildProgress ? <Act4GuildMission progress={act4GuildProgress} /> : null}

        {sectionOrder.map((key) => {
          const list = groups[key];
          if (!list.length) return null;
          return (
            <section key={key} aria-label={GROUP_LABEL[key]}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <span style={{ fontSize: 14, color: 'rgba(212,160,23,0.88)' }} aria-hidden>
                  {GROUP_ICON[key]}
                </span>
                <h3 style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(212,160,23,0.88)' }}>
                  {GROUP_LABEL[key]}
                </h3>
                <div style={{ flex: 1, height: 1, background: 'rgba(212,160,23,0.12)' }} aria-hidden />
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', minWidth: 16, textAlign: 'right' }}>{list.length}</span>
              </div>
              {list.length ? (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {list.map((q) => (
                    <QuestCard key={q.quest_id} q={q} onMarkQuestTurnedIn={onMarkQuestTurnedIn} onOpenTruePathPicker={onOpenTruePathPicker} />
                  ))}
                </ul>
              ) : (
                <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.50)', fontStyle: 'italic', paddingLeft: 4 }}>
                  No quests in this category yet.
                </p>
              )}
            </section>
          );
        })}

        {guildPathBreatherNote ? (
          <aside style={{ padding: '12px 16px', background: 'rgba(212,160,23,0.06)', border: '1px solid rgba(212,160,23,0.18)', borderRadius: 4 }}>
            <p style={{ margin: 0, fontSize: 13, color: '#e8dcc8', lineHeight: 1.5 }}>{guildPathBreatherNote}</p>
          </aside>
        ) : null}

        {import.meta.env.DEV && lockedCount ? (
          <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,100,100,0.6)' }}>
            DEV: {lockedCount} locked quest row(s) hidden from student view.
          </p>
        ) : null}
      </div>
    </ScrollSubMenuShell>
  );
}
