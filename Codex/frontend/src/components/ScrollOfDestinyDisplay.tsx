import { useState } from 'react';
import type { PlayerSave, QuestDefinition, RealmDefinition } from '../types';
import type { ExplorationLoopState, EncounterLogEntryV1 } from '../domain/lh-contract';
import type { RealmProgressMap } from '../realm/realmProgress';
import { GUILD_RUNES } from '../data/guildRunes';
import { getGuildById } from '../data/guildData';
import type { RiasecScores } from '../modules/act1/signpostAlgorithm';
import { ResolveBar } from './ResolveBar';
import { parseSatchelInventory, getTitleLabel, CAMPFIRE_STREAK_MILESTONES } from '../data/itemCatalog';
import { ScrollSubMenuShell } from './ScrollSubMenuShell';
import { ScrollFrameStage } from './scrollUI/ScrollFrameStage';
import { ScrollSideNav, ScrollSideNavButton } from './scrollUI/ScrollSideNav';
import { SCROLL_ASSETS } from './scrollUI/scrollAssets';
import { ScrollLayoutCalibrator } from './scrollUI/ScrollLayoutCalibrator';

// ── Types ──────────────────────────────────────────────────────────────────

const RIASEC_LABELS: Record<keyof RiasecScores, { short: string; full: string; color: string }> = {
  r: { short: 'R', full: 'Realistic',     color: '#7a5c2a' },
  i: { short: 'I', full: 'Investigative', color: '#2a5c7a' },
  a: { short: 'A', full: 'Artistic',      color: '#5a2a7a' },
  s: { short: 'S', full: 'Social',        color: '#2a7a4c' },
  e: { short: 'E', full: 'Enterprising',  color: '#7a2a2a' },
  c: { short: 'C', full: 'Conventional',  color: '#4a4a2a' },
};

const RIASEC_ORDER: Array<keyof RiasecScores> = ['r', 'i', 'a', 's', 'e', 'c'];

type FieldJournalTab =
  | 'work_files'
  | 'journey_review'
  | 'enemy_records'
  | 'realm_notes'
  | 'mementos'
  | 'reflection_archive';

type HubMode = 'scroll_hub' | 'journal';

type Props = {
  open: boolean;
  onClose: () => void;
  player: PlayerSave | null;
  quests: readonly QuestDefinition[];
  allRealms: readonly RealmDefinition[];
  foretoldSignpostRealmIds: readonly string[];
  oracleDraft?: Record<string, string>;
  riasecScores?: RiasecScores | null;
  exploration?: ExplorationLoopState | null;
  realmProgress?: RealmProgressMap;
  onSave?: () => void;
  onEndSession?: () => void;
  onOpenQuestLog?: () => void;
  onOpenRealmAtlas?: () => void;
  onOpenInventory?: () => void;
  onOpenScrollViewer?: () => void;
  onReviewProphecy?: () => void;
  onOpenQuestOfFateWorksheet?: () => void;
};

// ── Scroll Layout Config ───────────────────────────────────────────────────
// All values are in px on a 1280×720 reference grid (Chromebook landscape).
// Tune positions here — they convert to % automatically so they scale at any
// viewport size. The scroll image has prepared blank regions; match these
// coordinates to the actual blank areas in Scroll_Of_Destiny_ready.png.

const SCROLL_REF = { w: 1280, h: 720 } as const;

const SCROLL_LAYOUT = {
  // ── Calibrated 2026-06-02 via ?lh_scroll_layout_debug=1 (pass 3) ───────
  portrait:  { left: 567, top: 129, width: 149, height: 132 },
  name:      { left: 548, top: 238, width: 188, height:  21 },
  leftCol:   { left: 252, top: 246, width: 147, height: 268 },
  center:    { left: 430, top: 296, width: 423, height: 241 },
  rightCol:  { left: 881, top: 247, width: 144, height: 265 },
  sigil1:    { left: 374, top: 539, width: 142, height: 112 },
  sigil2:    { left: 570, top: 541, width: 142, height: 112 },
  sigil3:    { left: 757, top: 548, width: 142, height: 112 },
} as const;

/** Convert a SCROLL_LAYOUT region to absolute-% CSS within the scroll container. */
function toOverlayCss(
  r: { left: number; top: number; width: number; height: number },
): React.CSSProperties {
  return {
    position: 'absolute',
    left:   `${(r.left   / SCROLL_REF.w) * 100}%`,
    top:    `${(r.top    / SCROLL_REF.h) * 100}%`,
    width:  `${(r.width  / SCROLL_REF.w) * 100}%`,
    height: `${(r.height / SCROLL_REF.h) * 100}%`,
    overflow: 'hidden',
  };
}

// ── Ink-on-parchment text styles ──────────────────────────────────────────
const INK = '#1c0f00';
const INK_DIM = 'rgba(28,15,0,0.6)';
const INK_LABEL = 'rgba(28,15,0,0.45)';
const GOLD_INK = '#7a4e00';

// ── Scroll Hub View ────────────────────────────────────────────────────────
// Uses ScrollFrameStage for the vignette + scroll image, and ScrollSideNav for
// the left/right parchment-tab button rails. The character-sheet content uses
// the three-column zone layout defined in SCROLL_LAYOUT above.

function RiasecScrollRow({ code, score }: { code: keyof RiasecScores; score: number }) {
  const meta = RIASEC_LABELS[code];
  const pct  = Math.min(100, Math.round((score / 20) * 100));
  const isTop = score >= 14;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <span style={{ width: 12, fontSize: '0.62em', fontWeight: 700, color: isTop ? GOLD_INK : INK_LABEL, textAlign: 'center', flexShrink: 0, letterSpacing: '0.04em' }}>
        {meta.short}
      </span>
      <span style={{ width: 68, fontSize: '0.58em', color: isTop ? INK : INK_DIM, letterSpacing: '0.01em', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {meta.full}
      </span>
      <div style={{ flex: 1, height: 4, background: 'rgba(28,15,0,0.08)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: isTop ? '#7a4e00' : 'rgba(28,15,0,0.30)', borderRadius: 2, transition: 'width 0.3s ease' }} />
      </div>
      <span style={{ width: 16, fontSize: '0.62em', fontWeight: isTop ? 700 : 400, color: isTop ? GOLD_INK : INK_LABEL, textAlign: 'right', flexShrink: 0 }}>
        {score}
      </span>
    </div>
  );
}

function ScrollHubView({
  player,
  quests,
  foretoldSignpostRealmIds,
  allRealms,
  riasecScores,
  onClose,
  onOpenQuestLog,
  onOpenRealmAtlas,
  onOpenInventory,
  onEndSession,
  onOpenJournal,
}: {
  player: PlayerSave | null;
  quests: readonly QuestDefinition[];
  foretoldSignpostRealmIds: readonly string[];
  allRealms: readonly RealmDefinition[];
  riasecScores?: RiasecScores | null;
  onClose: () => void;
  onOpenQuestLog?: () => void;
  onOpenRealmAtlas?: () => void;
  onOpenInventory?: () => void;
  onEndSession?: () => void;
  onOpenJournal: () => void;
}) {
  const activeQuests = quests
    .filter((q) => q.status === 'active' || q.status === 'available')
    .slice(0, 3);

  const streak = player?.campfire_streak ?? 0;
  const tier   = player?.rested_readiness_tier;

  // Build exactly 3 signpost slots — empty slots show "not yet revealed"
  const signposts = [
    foretoldSignpostRealmIds[0] ?? null,
    foretoldSignpostRealmIds[1] ?? null,
    foretoldSignpostRealmIds[2] ?? null,
  ] as const;
  const sigilRegions = [SCROLL_LAYOUT.sigil1, SCROLL_LAYOUT.sigil2, SCROLL_LAYOUT.sigil3] as const;

  return (
    <ScrollFrameStage zIndex={8500} variant="hub">

      {/* ── LEFT SIDE NAV ── Field Journal · Quest Log · Satchel ─── */}
      <ScrollSideNav side="left">
        <ScrollSideNavButton label="Field Journal" icon="📜" onClick={onOpenJournal} />
        <ScrollSideNavButton label="Quest Log"     icon="◈"  onClick={onOpenQuestLog} />
        <ScrollSideNavButton label="Satchel"       icon="⚗"  onClick={onOpenInventory} />
      </ScrollSideNav>

      {/* ── TRAVELER PORTRAIT — fills the scroll oval, clipped to ellipse ── */}
      {/* Zone is 149×132 px — border-radius:50% creates the oval clip.        */}
      {/* objectPosition:center top keeps the character's face/torso visible.  */}
      <div
        style={{
          ...toOverlayCss(SCROLL_LAYOUT.portrait),
          borderRadius: '50%',
          overflow: 'hidden',
          border: '3px solid rgba(212,168,28,0.65)',
          boxShadow: '0 0 16px rgba(180,120,0,0.40), 0 0 4px rgba(0,0,0,0.55)',
        }}
      >
        <img
          src={SCROLL_ASSETS.portrait}
          alt="Traveler"
          draggable={false}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center top',
            userSelect: 'none',
            display: 'block',
          }}
        />
      </div>

      {/* ── NAME — player name only in the banner below the portrait ── */}
      <div
        style={{
          ...toOverlayCss(SCROLL_LAYOUT.name),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <p style={{ margin: 0, fontSize: '0.95em', fontWeight: 700, color: INK, lineHeight: 1, textAlign: 'center', letterSpacing: '0.03em' }}>
          {player?.display_name ?? '—'}
        </p>
      </div>

      {/* ── LEFT COLUMN — Active quests + current directive ─────── */}
      <div
        style={{
          ...toOverlayCss(SCROLL_LAYOUT.leftCol),
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        <p style={{ margin: '0 0 4px', fontSize: '0.57em', textTransform: 'uppercase', letterSpacing: '0.12em', color: INK_LABEL }}>
          Active Quests
        </p>
        {activeQuests.length > 0 ? (
          activeQuests.map((q) => (
            <div key={q.quest_id} style={{ padding: '3px 0', borderBottom: '1px solid rgba(28,15,0,0.09)' }}>
              <p style={{ margin: 0, fontSize: '0.72em', fontWeight: 700, color: INK, lineHeight: 1.2 }}>{q.title}</p>
              <p style={{ margin: 0, fontSize: '0.61em', color: INK_DIM, lineHeight: 1.2 }}>{q.objective_short}</p>
            </div>
          ))
        ) : (
          <p style={{ margin: 0, fontSize: '0.68em', color: INK_DIM, fontStyle: 'italic' }}>No active quests.</p>
        )}
        <div style={{ margin: '8px 0 5px', height: 1, background: 'rgba(28,15,0,0.11)' }} />
        <p style={{ margin: '0 0 3px', fontSize: '0.57em', textTransform: 'uppercase', letterSpacing: '0.12em', color: INK_LABEL }}>
          Current Directive
        </p>
        <p style={{ margin: 0, fontSize: '0.75em', fontWeight: 700, color: INK, lineHeight: 1.35 }}>
          {player?.required_next_action || 'Speak with the Master Scribe'}
        </p>
        {player ? <div style={{ marginTop: 6 }}><ResolveBar player={player} /></div> : null}
      </div>

      {/* ── CENTER BLOCK — Base Stats (Mirror of Maia / RIASEC) ─── */}
      <div
        style={{
          ...toOverlayCss(SCROLL_LAYOUT.center),
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          padding: '5px 10px',
        }}
      >
        <p style={{ margin: '0 0 4px', fontSize: '0.57em', textTransform: 'uppercase', letterSpacing: '0.12em', color: INK_LABEL }}>
          Mirror of Maia · Base Stats
        </p>
        {riasecScores && Object.values(riasecScores).some((v) => v > 0) ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {RIASEC_ORDER.map((code) => (
              <RiasecScrollRow key={code} code={code} score={riasecScores[code]} />
            ))}
          </div>
        ) : (
          <p style={{ margin: 0, fontSize: '0.65em', color: INK_DIM, fontStyle: 'italic', lineHeight: 1.45 }}>
            Base Stats unrevealed — complete the Master Scribe survey to inscribe your profile.
          </p>
        )}
      </div>

      {/* ── RIGHT COLUMN — Traveler Record, Resolve, Campfire, Rested Readiness ── */}
      <div
        style={{
          ...toOverlayCss(SCROLL_LAYOUT.rightCol),
          display: 'flex',
          flexDirection: 'column',
          gap: 5,
        }}
      >
        <p style={{ margin: '0 0 2px', fontSize: '0.57em', textTransform: 'uppercase', letterSpacing: '0.12em', color: INK_LABEL }}>
          Traveler Record
        </p>
        {[
          { label: 'Experience', value: player ? `${player.xp_total} XP` : '—' },
          { label: 'Rank', value: player ? `Level ${player.level_cached}` : '—' },
        ].map(({ label, value }) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <p style={{ margin: 0, fontSize: '0.63em', color: INK_DIM }}>{label}</p>
            <p style={{ margin: 0, fontSize: '0.70em', fontWeight: 700, color: INK }}>{value}</p>
          </div>
        ))}
        <div style={{ height: 1, background: 'rgba(28,15,0,0.10)', margin: '2px 0' }} />
        {streak > 0 ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <p style={{ margin: 0, fontSize: '0.63em', color: INK_DIM }}>Campfire</p>
            <p style={{ margin: 0, fontSize: '0.70em', fontWeight: 700, color: '#b45309' }}>🔥 {streak}</p>
          </div>
        ) : null}
        {tier ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <p style={{ margin: 0, fontSize: '0.63em', color: INK_DIM }}>Rest</p>
            <p style={{ margin: 0, fontSize: '0.63em', fontWeight: 600, color: GOLD_INK, textTransform: 'capitalize' }}>
              {tier.replace(/_/g, ' ')}
            </p>
          </div>
        ) : null}
      </div>

      {/* ── BOTTOM CIRCLES — Foretold Signposts ─────────────────── */}
      {signposts.map((realmId, i) => {
        const realm = realmId ? allRealms.find((r) => r.realm_id === realmId) : null;
        return (
          <div
            key={i}
            style={{
              ...toOverlayCss(sigilRegions[i]),
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
            }}
          >
            {realmId ? (
              <>
                <RuneGlyph guildId={realmId} />
                <p style={{ margin: 0, fontSize: '0.57em', fontWeight: 700, color: INK, lineHeight: 1.2, textAlign: 'center' }}>
                  {realm?.display_name ?? realmId}
                </p>
              </>
            ) : (
              <p style={{ margin: 0, fontSize: '0.58em', color: INK_LABEL, fontStyle: 'italic', textAlign: 'center' }}>
                Signpost {i + 1}
              </p>
            )}
          </div>
        );
      })}

      {/* ── RIGHT SIDE NAV ── World Atlas · Make Camp · Return ───── */}
      <ScrollSideNav side="right">
        <ScrollSideNavButton label="World Atlas"     icon="⚑" onClick={onOpenRealmAtlas} />
        <ScrollSideNavButton label="Make Camp"       icon="🔥" onClick={onEndSession} primary />
        <ScrollSideNavButton label="Return to Game"           onClick={onClose} primary />
      </ScrollSideNav>

      {/* DEV ONLY — layout calibration overlay. Activate with ?lh_scroll_layout_debug=1 */}
      <ScrollLayoutCalibrator scrollLayout={SCROLL_LAYOUT} scrollRef={SCROLL_REF} />

    </ScrollFrameStage>
  );
}

// ── Shared button style (journal mode) ────────────────────────────────────

const btnStyle: React.CSSProperties = {
  padding: '8px 18px',
  background: 'rgba(212,160,23,0.1)',
  border: '1px solid rgba(212,160,23,0.3)',
  borderRadius: 3,
  color: '#d4a017',
  fontSize: 12,
  cursor: 'pointer',
  fontFamily: 'serif',
  letterSpacing: '0.04em',
};

// ── Journal Tab Components ─────────────────────────────────────────────────

function RuneGlyph({ guildId }: { guildId: string }) {
  const rune = GUILD_RUNES[guildId];
  if (!rune) return null;
  return (
    <svg viewBox="0 0 40 46" width={32} height={37} aria-hidden>
      <path d={rune.path} fill="none" stroke="#d4a017" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {rune.dot ? <circle cx={rune.dot.cx} cy={rune.dot.cy} r={rune.dot.r} fill="#d4a017" /> : null}
    </svg>
  );
}

function HollandCodeTile({ code, score }: { code: keyof RiasecScores; score: number }) {
  const meta = RIASEC_LABELS[code];
  const pct  = Math.min(100, Math.round((score / 20) * 100));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '8px 10px', background: 'rgba(255,255,255,0.04)', borderRadius: 4, border: '1px solid rgba(255,255,255,0.08)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#d4a017', letterSpacing: '0.06em' }}>{meta.short}</span>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.04em' }}>{meta.full}</span>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', minWidth: 24, textAlign: 'right' }}>{score}</span>
      </div>
      <div style={{ height: 5, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg,#d4a017,#f59e0b)', borderRadius: 3 }} />
      </div>
    </div>
  );
}

const EMPTY_RIASEC: RiasecScores = { r: 0, i: 0, a: 0, s: 0, e: 0, c: 0 };

function WorkFilesTab({
  player, quests, allRealms, foretoldSignpostRealmIds, oracleDraft, riasecScores,
  onOpenScrollViewer, onReviewProphecy, onOpenQuestOfFateWorksheet,
}: Pick<Props, 'player'|'quests'|'allRealms'|'foretoldSignpostRealmIds'|'oracleDraft'|'riasecScores'|'onOpenScrollViewer'|'onReviewProphecy'|'onOpenQuestOfFateWorksheet'>) {
  const scores = riasecScores ?? EMPTY_RIASEC;
  const hasScores = Object.values(scores).some((v) => v > 0);
  const sortedCodes = [...RIASEC_ORDER].sort((a, b) => scores[b] - scores[a]);
  const topCode = sortedCodes[0];
  const prophecyId    = oracleDraft?.prophecy_id ? Number(oracleDraft.prophecy_id) : 0;
  const prophecyTitle = oracleDraft?.prophecy_title ?? '';
  const hasProphecy   = prophecyId > 0 && prophecyTitle.length > 0;
  const activeQuests  = quests.filter((q) => q.status === 'active' || q.status === 'available');
  const completedCount = quests.filter((q) => q.status === 'completed' || q.status === 'turned_in').length;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 220px', gap: 0, flex: 1, minHeight: 0 }}>
      {/* Holland Codes */}
      <aside style={{ borderRight: '1px solid rgba(212,160,23,0.15)', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto' }}>
        <h2 style={{ margin: '0 0 12px', fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(212,160,23,0.7)' }}>Holland Codes</h2>
        {hasScores ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {RIASEC_ORDER.map((code) => <HollandCodeTile key={code} code={code} score={scores[code]} />)}
          </div>
        ) : (
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5, margin: 0 }}>
            Complete the Traveler's Survey to reveal your Holland Code profile.
          </p>
        )}
        {hasScores && (
          <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <p style={{ margin: 0, fontSize: 10, color: 'rgba(255,255,255,0.4)', lineHeight: 1.4 }}>
              Leading code:{' '}
              <strong style={{ color: '#d4a017' }}>{topCode.toUpperCase()} — {RIASEC_LABELS[topCode].full}</strong>
            </p>
          </div>
        )}
      </aside>

      {/* Center: Identity + Signposts + Prophecy */}
      <main style={{ padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <section>
          <h2 style={{ margin: '0 0 12px', fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(212,160,23,0.7)' }}>Traveler</h2>
          <div style={{ padding: '14px 16px', background: 'rgba(212,160,23,0.06)', border: '1px solid rgba(212,160,23,0.18)', borderRadius: 4 }}>
            <p style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700, color: '#f0dfa0', letterSpacing: '0.02em' }}>{player?.display_name ?? '—'}</p>
            <p style={{ margin: '0 0 10px', fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em' }}>
              Act {player?.current_act ?? 1} Traveler · {player?.xp_total ?? 0} XP
            </p>
            {player ? <div style={{ marginTop: 8 }}><ResolveBar player={player} /></div> : null}
            {player?.required_next_action ? (
              <div style={{ marginTop: 10, padding: '8px 12px', background: 'rgba(245,158,11,0.08)', borderLeft: '2px solid #f59e0b', borderRadius: 2 }}>
                <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Next directive</p>
                <p style={{ margin: '2px 0 0', fontSize: 13, color: '#e8dcc8', lineHeight: 1.4 }}>{player.required_next_action}</p>
              </div>
            ) : null}
          </div>
        </section>

        <section>
          <h2 style={{ margin: '0 0 12px', fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(212,160,23,0.7)' }}>Foretold Signposts</h2>
          {foretoldSignpostRealmIds.length > 0 ? (
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {foretoldSignpostRealmIds.map((realmId, idx) => {
                const realm = allRealms.find((r) => r.realm_id === realmId);
                const guild = getGuildById(realmId);
                return (
                  <div key={realmId} style={{ flex: '1 1 140px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '12px 10px', background: 'rgba(212,160,23,0.06)', border: '1px solid rgba(212,160,23,0.2)', borderRadius: 4, textAlign: 'center' }}>
                    <span style={{ fontSize: 10, color: 'rgba(212,160,23,0.6)', letterSpacing: '0.1em' }}>{String(idx + 1).padStart(2, '0')}</span>
                    <RuneGlyph guildId={realmId} />
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#f0dfa0', lineHeight: 1.2 }}>{realm?.display_name ?? realmId}</p>
                    {guild?.career_cluster ? <p style={{ margin: 0, fontSize: 10, color: 'rgba(212,160,23,0.55)', lineHeight: 1.3 }}>{guild.career_cluster}</p> : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5, margin: 0 }}>
              Seal the Manifest with the Master Scribe to reveal your Signposts.
            </p>
          )}
        </section>

        <section>
          <h2 style={{ margin: '0 0 12px', fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(212,160,23,0.7)' }}>Your Prophecy</h2>
          {hasProphecy ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', background: 'rgba(212,160,23,0.06)', borderRadius: 4, borderLeft: '3px solid #d4a017' }}>
              <span style={{ fontSize: 24, fontWeight: 700, color: '#f59e0b', minWidth: 40, textAlign: 'center' }} aria-hidden>#{prophecyId}</span>
              <div>
                <p style={{ margin: 0, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.4)' }}>Destiny #{prophecyId}</p>
                <p style={{ margin: '2px 0 0', fontSize: 14, fontWeight: 600, color: '#f0dfa0' }}>{prophecyTitle}</p>
              </div>
            </div>
          ) : (
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5, margin: 0 }}>
              Consult the Oracle of Fate to reveal your prophecy.
            </p>
          )}
        </section>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {onOpenScrollViewer && foretoldSignpostRealmIds.length > 0 ? (
            <button type="button" onClick={onOpenScrollViewer} style={btnStyle}>Open Scroll Viewer</button>
          ) : null}
          {hasProphecy && onReviewProphecy ? (
            <button type="button" onClick={onReviewProphecy} style={btnStyle}>Review Prophecy Research</button>
          ) : null}
          {hasProphecy && onOpenQuestOfFateWorksheet ? (
            <button type="button" onClick={onOpenQuestOfFateWorksheet} style={{ ...btnStyle, color: '#e8dcc8', borderColor: 'rgba(255,255,255,0.2)' }}>Quest of Fate Worksheet</button>
          ) : null}
        </div>

        <section>
          <h2 style={{ margin: '0 0 10px', fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(212,160,23,0.7)' }}>Progress</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            {[{ label: 'Quests complete', value: completedCount }, { label: 'XP earned', value: player?.xp_total ?? 0 }].map((row) => (
              <div key={row.label} style={{ flex: 1, display: 'flex', justifyContent: 'space-between', padding: '6px 8px', background: 'rgba(255,255,255,0.03)', borderRadius: 3, fontSize: 12 }}>
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>{row.label}</span>
                <span style={{ color: '#f0dfa0', fontWeight: 700 }}>{row.value}</span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 style={{ margin: '0 0 10px', fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(212,160,23,0.7)' }}>Active Quests</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {activeQuests.length > 0 ? (
              activeQuests.slice(0, 8).map((q) => (
                <div key={q.quest_id} style={{ padding: '7px 10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 3 }}>
                  <p style={{ margin: 0, fontSize: 12, color: '#e8dcc8', lineHeight: 1.2, fontWeight: 600 }}>{q.title}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 10, color: 'rgba(255,255,255,0.35)', lineHeight: 1.2 }}>{q.objective_short}</p>
                </div>
              ))
            ) : (
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', margin: 0 }}>No active quests.</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function JourneyReviewTab({ player, exploration }: { player: PlayerSave | null; exploration?: ExplorationLoopState | null }) {
  const ledger       = exploration?.ledger_entries ?? [];
  const encounterLog = exploration?.encounter_log  ?? [];
  const wins         = encounterLog.filter((e) => e.outcome === 'win').length;
  const retreats     = encounterLog.filter((e) => e.outcome === 'retreat').length;
  const encounterXp  = exploration?.session_encounter_xp_awarded ?? 0;

  return (
    <div style={{ padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <section>
        <h2 style={{ margin: '0 0 12px', fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(212,160,23,0.7)' }}>Session Stats</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px,1fr))', gap: 8 }}>
          {[
            { label: 'Total XP',             value: player?.xp_total ?? 0 },
            { label: 'Session XP (encounters)', value: encounterXp },
            { label: 'Encounters won',        value: wins },
            { label: 'Retreats',              value: retreats },
            { label: 'Ledger entries',        value: ledger.length },
            { label: 'Campfire streak',       value: player?.campfire_streak ?? 0 },
          ].map((stat) => (
            <div key={stat.label} style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 3 }}>
              <p style={{ margin: 0, fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{stat.label}</p>
              <p style={{ margin: '4px 0 0', fontSize: 20, fontWeight: 700, color: '#f0dfa0' }}>{stat.value}</p>
            </div>
          ))}
        </div>
      </section>
      {ledger.length > 0 ? (
        <section>
          <h2 style={{ margin: '0 0 12px', fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(212,160,23,0.7)' }}>Recent Ledger Entries</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {ledger.slice(-5).reverse().map((entry) => (
              <div key={entry.id} style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 3 }}>
                <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 700, color: '#e8dcc8' }}>{entry.career_a} vs {entry.career_b}</p>
                <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.45)', lineHeight: 1.4 }}>{entry.note}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function EnemyRecordsTab({ exploration }: { exploration?: ExplorationLoopState | null }) {
  const log = exploration?.encounter_log ?? [];
  if (!log.length) return (
    <div style={{ padding: '20px 24px' }}>
      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>No encounters recorded this session.</p>
    </div>
  );
  return (
    <div style={{ padding: '20px 24px', overflowY: 'auto' }}>
      <h2 style={{ margin: '0 0 14px', fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(212,160,23,0.7)' }}>Encounter Log</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {[...log].reverse().map((entry: EncounterLogEntryV1) => (
          <div key={entry.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 3 }}>
            <span style={{ fontSize: 16 }} aria-hidden>{entry.outcome === 'win' ? '⚔️' : '🌀'}</span>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: 12, color: '#e8dcc8' }}>
                {entry.kind === 'combat_encounter' ? 'Lost Echo' : 'Knowledge Battle'}{' — '}
                <span style={{ color: entry.outcome === 'win' ? '#86efac' : '#fca5a5' }}>
                  {entry.outcome === 'win' ? 'Victory' : 'Retreat'}
                </span>
              </p>
              {entry.target_quest_id ? <p style={{ margin: '2px 0 0', fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>Quest: {entry.target_quest_id}</p> : null}
            </div>
            {entry.xp_awarded > 0 ? <span style={{ fontSize: 11, color: '#f59e0b', fontWeight: 700 }}>+{entry.xp_awarded} XP</span> : null}
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>
              {new Date(entry.at_iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RealmNotesTab({ allRealms, realmProgress }: { allRealms: readonly RealmDefinition[]; realmProgress?: RealmProgressMap }) {
  const visited = Object.entries(realmProgress ?? {}).filter(([, e]) => e?.entered);
  if (!visited.length) return (
    <div style={{ padding: '20px 24px' }}>
      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>No realms visited yet.</p>
    </div>
  );
  return (
    <div style={{ padding: '20px 24px', overflowY: 'auto' }}>
      <h2 style={{ margin: '0 0 14px', fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(212,160,23,0.7)' }}>Realm Notes</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {visited.map(([realmId, entry]) => {
          const realm = allRealms.find((r) => r.realm_id === realmId);
          return (
            <div key={realmId} style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 3 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#f0dfa0' }}>{realm?.display_name ?? realmId}</p>
                {entry.research_complete ? <span style={{ fontSize: 10, color: '#86efac', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Researched</span> : null}
              </div>
              {entry.learned_notes ? (
                <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>{entry.learned_notes}</p>
              ) : (
                <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.25)', fontStyle: 'italic' }}>No notes recorded.</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MementosTab({ player }: { player: PlayerSave | null }) {
  if (!player) return <div style={{ padding: '20px 24px' }}><p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>No player loaded.</p></div>;
  const inventory    = parseSatchelInventory(player.satchel_inventory_json);
  const { unlocked_titles, unlocked_badges } = inventory.cosmetics;
  const streak      = player.campfire_streak ?? 0;
  const activeTitle = player.active_title ?? inventory.cosmetics.active_title;
  const hasMementos = unlocked_titles.length > 0 || unlocked_badges.length > 0 || inventory.mementos.length > 0;

  return (
    <div style={{ padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {activeTitle ? (
        <section>
          <h2 style={{ margin: '0 0 8px', fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(212,160,23,0.7)' }}>Active Title</h2>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', background: 'rgba(212,160,23,0.1)', border: '1px solid rgba(212,160,23,0.3)', borderRadius: 12 }}>
            <span>📜</span>
            <span style={{ fontSize: 13, color: '#f0dfa0', fontWeight: 700 }}>{getTitleLabel(activeTitle)}</span>
          </div>
        </section>
      ) : null}

      <section>
        <h2 style={{ margin: '0 0 10px', fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(212,160,23,0.7)' }}>Campfire Streak Milestones</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {CAMPFIRE_STREAK_MILESTONES.map((m) => {
            const earned = streak >= m.streak;
            return (
              <div key={m.streak} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: earned ? 'rgba(212,160,23,0.06)' : 'rgba(255,255,255,0.02)', border: earned ? '1px solid rgba(212,160,23,0.2)' : '1px solid rgba(255,255,255,0.05)', borderRadius: 3, opacity: earned ? 1 : 0.4 }}>
                <span style={{ fontSize: 18 }} aria-hidden>{earned ? '✅' : '○'}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 12, color: earned ? '#f0dfa0' : 'rgba(232,220,200,0.5)', fontWeight: 700 }}>{m.reward_label}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{m.description}</p>
                </div>
                <span style={{ fontSize: 11, color: 'rgba(212,160,23,0.6)' }}>Streak {m.streak}</span>
              </div>
            );
          })}
        </div>
      </section>

      {(unlocked_titles.length > 0 || unlocked_badges.length > 0) ? (
        <section>
          <h2 style={{ margin: '0 0 10px', fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(212,160,23,0.7)' }}>Earned Honors</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {unlocked_titles.map((id) => (
              <span key={id} style={{ padding: '4px 12px', background: 'rgba(212,160,23,0.1)', border: '1px solid rgba(212,160,23,0.25)', borderRadius: 12, fontSize: 11, color: '#f0dfa0' }}>
                📜 {getTitleLabel(id)}
              </span>
            ))}
            {unlocked_badges.filter((b) => b !== 'VISUAL_AMBER_FLAME').map((id) => {
              const m = CAMPFIRE_STREAK_MILESTONES.find((ms) => ms.reward_id === id);
              return m ? (
                <span key={id} style={{ padding: '4px 12px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 12, fontSize: 11, color: '#fbbf24' }}>
                  🏅 {m.reward_label}
                </span>
              ) : null;
            })}
          </div>
        </section>
      ) : null}

      {inventory.mementos.length > 0 ? (
        <section>
          <h2 style={{ margin: '0 0 12px', fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(212,160,23,0.7)' }}>Mementos</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px,1fr))', gap: 8 }}>
            {inventory.mementos.map((m) => (
              <div key={m.item_id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '10px 8px', background: 'rgba(212,160,23,0.05)', border: '1px solid rgba(212,160,23,0.15)', borderRadius: 4, textAlign: 'center' }}>
                <span style={{ fontSize: 28 }} aria-hidden>{m.icon_emoji ?? '🏅'}</span>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#f0dfa0', lineHeight: 1.2 }}>{m.label}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {!hasMementos ? (
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5, margin: 0 }}>
          Complete quests, explore guilds, and maintain your campfire streak to collect mementos and titles.
        </p>
      ) : null}
    </div>
  );
}

function ReflectionArchiveTab({ player }: { player: PlayerSave | null }) {
  const streak   = player?.campfire_streak ?? 0;
  const lastIso  = player?.last_campfire_iso;
  const lastScore = player?.last_campfire_score;
  const tier     = player?.rested_readiness_tier;

  return (
    <div style={{ padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <section>
        <h2 style={{ margin: '0 0 12px', fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(212,160,23,0.7)' }}>Reflection Record</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px,1fr))', gap: 8 }}>
          {[
            { label: 'Current Streak', value: streak > 0 ? `🔥 ${streak}` : '—' },
            { label: 'Last Session',   value: lastIso ? new Date(lastIso).toLocaleDateString() : '—' },
            { label: 'Last Reflection', value: lastScore != null ? `${lastScore}/5` : '—' },
            { label: 'Rested Readiness', value: tier ? tier.replace(/_/g, ' ') : '—' },
          ].map((stat) => (
            <div key={stat.label} style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 3 }}>
              <p style={{ margin: 0, fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{stat.label}</p>
              <p style={{ margin: '4px 0 0', fontSize: 16, fontWeight: 700, color: '#f0dfa0', textTransform: 'capitalize' }}>{stat.value}</p>
            </div>
          ))}
        </div>
      </section>
      <section>
        <h2 style={{ margin: '0 0 10px', fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(212,160,23,0.7)' }}>About the Codex</h2>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, margin: 0 }}>
          Your campfire reflections are recorded in the Codex and reviewed by your teacher. A strong reflection
          earns a higher Rested Readiness tier, which increases the XP multiplier at the start of your next session.
          Maintain your streak to unlock titles and honors.
        </p>
      </section>
    </div>
  );
}

// ── Journal Shell (tabs view) ─────────────────────────────────────────────

function JournalShell({
  player, quests, allRealms, foretoldSignpostRealmIds, oracleDraft, riasecScores,
  exploration, realmProgress, onSave, onEndSession, onOpenQuestLog, onOpenRealmAtlas,
  onOpenInventory, onOpenScrollViewer, onReviewProphecy, onOpenQuestOfFateWorksheet,
  onBackToScroll,
}: Props & { onBackToScroll: () => void }) {
  const [activeTab, setActiveTab] = useState<FieldJournalTab>('work_files');

  const TABS: { id: FieldJournalTab; label: string }[] = [
    { id: 'work_files',        label: 'Work Files'       },
    { id: 'journey_review',    label: 'Journey Review'   },
    { id: 'enemy_records',     label: 'Enemy Records'    },
    { id: 'realm_notes',       label: 'Realm Notes'      },
    { id: 'mementos',          label: 'Mementos'         },
    { id: 'reflection_archive', label: 'Reflection Archive' },
  ];

  const journalTabs = (
    <div className="lh-field-journal-tabs">
      {TABS.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          className={`lh-field-journal-tab${activeTab === id ? ' lh-field-journal-tab--active' : ''}`}
          onClick={() => setActiveTab(id)}
        >
          {label}
        </button>
      ))}
    </div>
  );

  const journalFooter = (
    <div style={{ display: 'flex', gap: 8, padding: '8px 20px', flexWrap: 'wrap' }}>
      {[
        { label: 'Quest Log',   handler: onOpenQuestLog,   highlight: false, dim: false },
        { label: 'World Atlas', handler: onOpenRealmAtlas,  highlight: false, dim: false },
        { label: 'Satchel',     handler: onOpenInventory,   highlight: false, dim: false },
        { label: 'Make Camp',   handler: onSave,            highlight: true,  dim: false },
        { label: 'End Session', handler: onEndSession,      highlight: false, dim: true  },
      ].map(({ label, handler, highlight, dim }) =>
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
              color: highlight ? '#1a0e00' : dim ? 'rgba(220,180,130,0.6)' : '#e8dcc8',
              border: highlight ? '1px solid #8a6a1a' : dim ? '1px solid rgba(180,120,40,0.25)' : '1px solid rgba(255,255,255,0.12)',
              borderRadius: 3,
              cursor: 'pointer',
              fontWeight: highlight ? 700 : 400,
              opacity: dim ? 0.85 : 1,
            }}
          >
            {label}
          </button>
        ) : null,
      )}
    </div>
  );

  return (
    <ScrollSubMenuShell
      title="Field Journal"
      subtitle="Legendary Horizon"
      onBack={onBackToScroll}
      backLabel="← Back to Scroll"
      ariaLabel="Field Journal"
      zIndex={8500}
      tabs={journalTabs}
      footer={journalFooter}
    >
      {/* Tab content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {activeTab === 'work_files' ? (
          <WorkFilesTab
            player={player} quests={quests} allRealms={allRealms}
            foretoldSignpostRealmIds={foretoldSignpostRealmIds}
            oracleDraft={oracleDraft} riasecScores={riasecScores}
            onOpenScrollViewer={onOpenScrollViewer} onReviewProphecy={onReviewProphecy}
            onOpenQuestOfFateWorksheet={onOpenQuestOfFateWorksheet}
          />
        ) : null}
        {activeTab === 'journey_review'     ? <JourneyReviewTab player={player} exploration={exploration} /> : null}
        {activeTab === 'enemy_records'      ? <EnemyRecordsTab  exploration={exploration} /> : null}
        {activeTab === 'realm_notes'        ? <RealmNotesTab    allRealms={allRealms} realmProgress={realmProgress} /> : null}
        {activeTab === 'mementos'           ? <MementosTab      player={player} /> : null}
        {activeTab === 'reflection_archive' ? <ReflectionArchiveTab player={player} /> : null}
      </div>
    </ScrollSubMenuShell>
  );
}

// ── Main Export ────────────────────────────────────────────────────────────

export function ScrollOfDestinyDisplay(props: Props) {
  const [mode, setMode] = useState<HubMode>('scroll_hub');

  if (!props.open) return null;

  if (mode === 'journal') {
    return (
      <JournalShell
        {...props}
        onBackToScroll={() => setMode('scroll_hub')}
      />
    );
  }

  return (
    <ScrollHubView
      player={props.player}
      quests={props.quests}
      foretoldSignpostRealmIds={props.foretoldSignpostRealmIds}
      allRealms={props.allRealms}
      riasecScores={props.riasecScores}
      onClose={props.onClose}
      onOpenQuestLog={props.onOpenQuestLog}
      onOpenRealmAtlas={props.onOpenRealmAtlas}
      onOpenInventory={props.onOpenInventory}
      onEndSession={props.onEndSession}
      onOpenJournal={() => setMode('journal')}
    />
  );
}
