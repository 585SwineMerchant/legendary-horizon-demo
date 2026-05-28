import type { PlayerSave, QuestDefinition, RealmDefinition } from '../types';
import { GUILD_RUNES } from '../data/guildRunes';
import { getGuildById } from '../data/guildData';
import type { RiasecScores } from '../modules/act1/signpostAlgorithm';

const RIASEC_LABELS: Record<keyof RiasecScores, { short: string; full: string; color: string }> = {
  r: { short: 'R', full: 'Realistic', color: '#7a5c2a' },
  i: { short: 'I', full: 'Investigative', color: '#2a5c7a' },
  a: { short: 'A', full: 'Artistic', color: '#5a2a7a' },
  s: { short: 'S', full: 'Social', color: '#2a7a4c' },
  e: { short: 'E', full: 'Enterprising', color: '#7a2a2a' },
  c: { short: 'C', full: 'Conventional', color: '#4a4a2a' },
};

const RIASEC_ORDER: Array<keyof RiasecScores> = ['r', 'i', 'a', 's', 'e', 'c'];

type Props = {
  open: boolean;
  onClose: () => void;
  player: PlayerSave | null;
  quests: readonly QuestDefinition[];
  allRealms: readonly RealmDefinition[];
  foretoldSignpostRealmIds: readonly string[];
  /** Draft for mod_oracle_of_fate containing prophecy info. */
  oracleDraft?: Record<string, string>;
  /** Available when the survey module has been completed. */
  riasecScores?: RiasecScores | null;
  /** Handlers forwarded from the host shell. */
  onSave?: () => void;
  onOpenQuestLog?: () => void;
  onOpenRealmAtlas?: () => void;
  onOpenInventory?: () => void;
  onOpenScrollViewer?: () => void;
  onReviewProphecy?: () => void;
  onOpenQuestOfFateWorksheet?: () => void;
};

function RuneGlyph({ guildId }: { guildId: string }) {
  const rune = GUILD_RUNES[guildId];
  if (!rune) return null;
  return (
    <svg viewBox="0 0 40 46" width={32} height={37} aria-hidden>
      <path
        d={rune.path}
        fill="none"
        stroke="#d4a017"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {rune.dot ? <circle cx={rune.dot.cx} cy={rune.dot.cy} r={rune.dot.r} fill="#d4a017" /> : null}
    </svg>
  );
}

function HollandCodeTile({ code, score }: { code: keyof RiasecScores; score: number }) {
  const meta = RIASEC_LABELS[code];
  const pct = Math.min(100, Math.round((score / 20) * 100));
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        padding: '8px 10px',
        background: 'rgba(255,255,255,0.04)',
        borderRadius: 4,
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#d4a017', letterSpacing: '0.06em' }}>
          {meta.short}
        </span>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.04em' }}>
          {meta.full}
        </span>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', minWidth: 24, textAlign: 'right' }}>
          {score}
        </span>
      </div>
      <div
        style={{
          height: 5,
          background: 'rgba(255,255,255,0.1)',
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: 'linear-gradient(90deg, #d4a017, #f59e0b)',
            borderRadius: 3,
          }}
        />
      </div>
    </div>
  );
}

const EMPTY_RIASEC: RiasecScores = { r: 0, i: 0, a: 0, s: 0, e: 0, c: 0 };

export function ScrollOfDestinyDisplay({
  open,
  onClose,
  player,
  quests,
  allRealms,
  foretoldSignpostRealmIds,
  oracleDraft,
  riasecScores,
  onSave,
  onOpenQuestLog,
  onOpenRealmAtlas,
  onOpenInventory,
  onOpenScrollViewer,
  onReviewProphecy,
  onOpenQuestOfFateWorksheet,
}: Props) {
  if (!open) return null;

  const scores = riasecScores ?? EMPTY_RIASEC;
  const hasScores = Object.values(scores).some((v) => v > 0);

  // Sort codes by score descending to highlight top codes
  const sortedCodes = [...RIASEC_ORDER].sort((a, b) => scores[b] - scores[a]);
  const topCode = sortedCodes[0];

  const prophecyId = oracleDraft?.prophecy_id ? Number(oracleDraft.prophecy_id) : 0;
  const prophecyTitle = oracleDraft?.prophecy_title ?? '';
  const hasProphecy = prophecyId > 0 && prophecyTitle.length > 0;

  const activeQuests = quests.filter(
    (q) => q.status === 'active' || q.status === 'available',
  );
  const completedCount = quests.filter(
    (q) => q.status === 'completed' || q.status === 'turned_in',
  ).length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Scroll of Destiny"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 8500,
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(12, 9, 4, 0.96)',
        color: '#e8dcc8',
        fontFamily: 'serif',
        overflowY: 'auto',
      }}
    >
      {/* Top bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 20px',
          borderBottom: '1px solid rgba(212,160,23,0.2)',
          flexShrink: 0,
        }}
      >
        <div>
          <p
            style={{
              margin: 0,
              fontSize: 10,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'rgba(212,160,23,0.7)',
            }}
          >
            Legendary Horizon
          </p>
          <h1
            style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 700,
              color: '#f0dfa0',
              letterSpacing: '0.04em',
            }}
          >
            Scroll of Destiny
          </h1>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close scroll"
          style={{
            padding: '6px 16px',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 3,
            color: '#e8dcc8',
            fontSize: 13,
            cursor: 'pointer',
            fontFamily: 'serif',
          }}
        >
          Resume
        </button>
      </div>

      {/* Main three-column body */}
      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '200px 1fr 220px',
          gap: 0,
          minHeight: 0,
        }}
      >
        {/* ── Column 1: Holland Codes ── */}
        <aside
          style={{
            borderRight: '1px solid rgba(212,160,23,0.15)',
            padding: '20px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            overflowY: 'auto',
          }}
        >
          <h2
            style={{
              margin: '0 0 12px',
              fontSize: 11,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: 'rgba(212,160,23,0.7)',
            }}
          >
            Holland Codes
          </h2>
          {hasScores ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {RIASEC_ORDER.map((code) => (
                <HollandCodeTile key={code} code={code} score={scores[code]} />
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5, margin: 0 }}>
              Complete the Traveler's Survey with the Master Scribe to reveal your Holland Code profile.
            </p>
          )}

          {hasScores && (
            <div
              style={{
                marginTop: 'auto',
                paddingTop: 12,
                borderTop: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <p style={{ margin: 0, fontSize: 10, color: 'rgba(255,255,255,0.4)', lineHeight: 1.4 }}>
                Leading code:{' '}
                <strong style={{ color: '#d4a017' }}>
                  {topCode.toUpperCase()} — {RIASEC_LABELS[topCode].full}
                </strong>
              </p>
            </div>
          )}
        </aside>

        {/* ── Column 2: Traveler Identity (center) ── */}
        <main
          style={{
            padding: '20px 24px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
        >
          {/* Player identity card */}
          <section>
            <h2
              style={{
                margin: '0 0 12px',
                fontSize: 11,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: 'rgba(212,160,23,0.7)',
              }}
            >
              Traveler
            </h2>
            <div
              style={{
                padding: '14px 16px',
                background: 'rgba(212,160,23,0.06)',
                border: '1px solid rgba(212,160,23,0.18)',
                borderRadius: 4,
              }}
            >
              <p
                style={{
                  margin: '0 0 4px',
                  fontSize: 18,
                  fontWeight: 700,
                  color: '#f0dfa0',
                  letterSpacing: '0.02em',
                }}
              >
                {player?.display_name ?? '—'}
              </p>
              <p style={{ margin: '0 0 10px', fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em' }}>
                Act {player?.current_act ?? 1} Traveler · {player?.xp_total ?? 0} XP
              </p>
              {player?.required_next_action ? (
                <div
                  style={{
                    padding: '8px 12px',
                    background: 'rgba(245,158,11,0.08)',
                    borderLeft: '2px solid #f59e0b',
                    borderRadius: 2,
                  }}
                >
                  <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    Next directive
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: 13, color: '#e8dcc8', lineHeight: 1.4 }}>
                    {player.required_next_action}
                  </p>
                </div>
              ) : null}
            </div>
          </section>

          {/* Foretold Signposts — center band */}
          <section>
            <h2
              style={{
                margin: '0 0 12px',
                fontSize: 11,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: 'rgba(212,160,23,0.7)',
              }}
            >
              Foretold Signposts
            </h2>
            {foretoldSignpostRealmIds.length > 0 ? (
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {foretoldSignpostRealmIds.map((realmId, idx) => {
                  const realm = allRealms.find((r) => r.realm_id === realmId);
                  const guild = getGuildById(realmId);
                  return (
                    <div
                      key={realmId}
                      style={{
                        flex: '1 1 140px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 6,
                        padding: '12px 10px',
                        background: 'rgba(212,160,23,0.06)',
                        border: '1px solid rgba(212,160,23,0.2)',
                        borderRadius: 4,
                        textAlign: 'center',
                      }}
                    >
                      <span style={{ fontSize: 10, color: 'rgba(212,160,23,0.6)', letterSpacing: '0.1em' }}>
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <RuneGlyph guildId={realmId} />
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#f0dfa0', lineHeight: 1.2 }}>
                        {realm?.display_name ?? realmId}
                      </p>
                      {guild?.thematic_descriptor ? (
                        <p style={{ margin: 0, fontSize: 10, color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', lineHeight: 1.3 }}>
                          {guild.thematic_descriptor}
                        </p>
                      ) : null}
                      {guild?.career_cluster ? (
                        <p style={{ margin: 0, fontSize: 10, color: 'rgba(212,160,23,0.55)', lineHeight: 1.3 }}>
                          {guild.career_cluster}
                        </p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5, margin: 0 }}>
                Signposts will appear here after you seal the Manifest with the Master Scribe.
              </p>
            )}
          </section>

          {/* Oracle Prophecy */}
          <section>
            <h2
              style={{
                margin: '0 0 12px',
                fontSize: 11,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: 'rgba(212,160,23,0.7)',
              }}
            >
              Your Prophecy
            </h2>
            {hasProphecy ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '12px 16px',
                  background: 'rgba(212,160,23,0.06)',
                  borderRadius: 4,
                  borderLeft: '3px solid #d4a017',
                }}
              >
                <span
                  style={{
                    fontSize: 24,
                    fontWeight: 700,
                    color: '#f59e0b',
                    minWidth: 40,
                    textAlign: 'center',
                  }}
                  aria-hidden
                >
                  #{prophecyId}
                </span>
                <div>
                  <p
                    style={{ margin: 0, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.4)' }}
                  >
                    Destiny #{prophecyId}
                  </p>
                  <p
                    style={{ margin: '2px 0 0', fontSize: 14, fontWeight: 600, color: '#f0dfa0' }}
                  >
                    {prophecyTitle}
                  </p>
                </div>
              </div>
            ) : (
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5, margin: 0 }}>
                Your prophecy appears here after you consult the Oracle of Fate.
              </p>
            )}
          </section>

          {/* Action Links */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {onOpenScrollViewer && foretoldSignpostRealmIds.length > 0 && (
              <button
                type="button"
                onClick={onOpenScrollViewer}
                style={{
                  padding: '8px 18px',
                  background: 'rgba(212,160,23,0.1)',
                  border: '1px solid rgba(212,160,23,0.3)',
                  borderRadius: 3,
                  color: '#d4a017',
                  fontSize: 12,
                  cursor: 'pointer',
                  fontFamily: 'serif',
                  letterSpacing: '0.04em',
                }}
              >
                Open Scroll Viewer
              </button>
            )}
            {hasProphecy && onReviewProphecy && (
              <button
                type="button"
                onClick={onReviewProphecy}
                style={{
                  padding: '8px 18px',
                  background: 'rgba(212,160,23,0.1)',
                  border: '1px solid rgba(212,160,23,0.3)',
                  borderRadius: 3,
                  color: '#d4a017',
                  fontSize: 12,
                  cursor: 'pointer',
                  fontFamily: 'serif',
                  letterSpacing: '0.04em',
                }}
              >
                Review Prophecy Research
              </button>
            )}
            {hasProphecy && onOpenQuestOfFateWorksheet && (
              <button
                type="button"
                onClick={onOpenQuestOfFateWorksheet}
                style={{
                  padding: '8px 18px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 3,
                  color: '#e8dcc8',
                  fontSize: 12,
                  cursor: 'pointer',
                  fontFamily: 'serif',
                  letterSpacing: '0.04em',
                }}
              >
                Quest of Fate Worksheet
              </button>
            )}
          </div>
        </main>

        {/* ── Column 3: Abilities + Quests ── */}
        <aside
          style={{
            borderLeft: '1px solid rgba(212,160,23,0.15)',
            padding: '20px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            overflowY: 'auto',
          }}
        >
          {/* Stats summary */}
          <section>
            <h2
              style={{
                margin: '0 0 10px',
                fontSize: 11,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: 'rgba(212,160,23,0.7)',
              }}
            >
              Progress
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { label: 'Quests complete', value: completedCount },
                { label: 'XP earned', value: player?.xp_total ?? 0 },
              ].map((row) => (
                <div
                  key={row.label}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '6px 8px',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: 3,
                    fontSize: 12,
                  }}
                >
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>{row.label}</span>
                  <span style={{ color: '#f0dfa0', fontWeight: 700 }}>{row.value}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Active quests */}
          <section style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, minHeight: 0 }}>
            <h2
              style={{
                margin: 0,
                fontSize: 11,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: 'rgba(212,160,23,0.7)',
              }}
            >
              Active Quests
            </h2>
            <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {activeQuests.length > 0 ? (
                activeQuests.slice(0, 8).map((q) => (
                  <div
                    key={q.quest_id}
                    style={{
                      padding: '7px 10px',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: 3,
                    }}
                  >
                    <p style={{ margin: 0, fontSize: 12, color: '#e8dcc8', lineHeight: 1.2, fontWeight: 600 }}>
                      {q.title}
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: 10, color: 'rgba(255,255,255,0.35)', lineHeight: 1.2 }}>
                      {q.objective_short}
                    </p>
                  </div>
                ))
              ) : (
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', margin: 0 }}>No active quests.</p>
              )}
            </div>
          </section>
        </aside>
      </div>

      {/* Action bar */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          padding: '10px 20px',
          borderTop: '1px solid rgba(212,160,23,0.2)',
          flexShrink: 0,
          flexWrap: 'wrap',
        }}
      >
        {[
          { label: 'Quest Log', handler: onOpenQuestLog },
          { label: 'Realm Atlas', handler: onOpenRealmAtlas },
          { label: 'Inventory', handler: onOpenInventory },
          { label: 'Save Progress', handler: onSave, highlight: true },
        ].map(({ label, handler, highlight }) =>
          handler ? (
            <button
              key={label}
              type="button"
              onClick={handler}
              style={{
                padding: '7px 16px',
                fontSize: 12,
                fontFamily: 'serif',
                letterSpacing: '0.04em',
                background: highlight ? 'linear-gradient(135deg,#d4a017,#b8912a)' : 'rgba(255,255,255,0.06)',
                color: highlight ? '#1a0e00' : '#e8dcc8',
                border: highlight ? '1px solid #8a6a1a' : '1px solid rgba(255,255,255,0.12)',
                borderRadius: 3,
                cursor: 'pointer',
                fontWeight: highlight ? 700 : 400,
              }}
            >
              {label}
            </button>
          ) : null,
        )}
      </div>
    </div>
  );
}
