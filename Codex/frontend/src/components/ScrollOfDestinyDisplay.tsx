import { useState } from 'react';
import type { PlayerSave, QuestDefinition, RealmDefinition } from '../types';
import type { ExplorationLoopState, EncounterLogEntryV1 } from '../domain/lh-contract';
import type { RealmProgressMap } from '../realm/realmProgress';
import { GUILD_RUNES } from '../data/guildRunes';
import type { RiasecScores } from '../modules/act1/signpostAlgorithm';
import { ResolveBar } from './ResolveBar';
import { parseSatchelInventory, getTitleLabel, CAMPFIRE_STREAK_MILESTONES } from '../data/itemCatalog';
import { ScrollSubMenuShell } from './ScrollSubMenuShell';
import { ScrollFrameStage } from './scrollUI/ScrollFrameStage';
import { ScrollSideNavButton } from './scrollUI/ScrollSideNav';
import { SCROLL_ASSETS, RUNE_ASSETS } from './scrollUI/scrollAssets';
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

export const SCROLL_REF = { w: 1280, h: 720 } as const;

export const SCROLL_LAYOUT = {
  // ── Calibrated 2026-06-13 via ?lh_scroll_layout_debug=1 (pass 6) ───────
  portrait:    { left: 578, top: 131, width: 130, height: 130 },
  name:        { left: 548, top: 238, width: 188, height:  21 },
  leftCol:     { left: 252, top: 246, width: 147, height: 268 },
  center:      { left: 431, top: 262, width: 423, height: 241 },
  rightCol:    { left: 881, top: 247, width: 144, height: 265 },
  sigil1:      { left: 374, top: 538, width: 142, height: 112 },
  sigil2:      { left: 570, top: 537, width: 142, height: 112 },
  sigil3:      { left: 757, top: 538, width: 142, height: 112 },
  bannerRow:   { left: 509, top: 509, width: 268, height:  26 },
  oracleSigil: { left: 879, top: 501, width: 150, height: 130 },
  // ── Nav button zones — calibrated via dev tool ────────────────────────
  btnFieldJournal:  { left: -30, top:  95, width: 132, height: 154 },
  btnQuestLog:      { left: -30, top: 300, width: 132, height: 154 },
  btnSatchel:       { left: -30, top: 505, width: 132, height: 154 },
  btnWorldAtlas:    { left: 1180, top:  95, width: 132, height: 154 },
  btnMakeCamp:      { left: 1180, top: 300, width: 132, height: 154 },
  btnReturnToGame:  { left: 1180, top: 505, width: 132, height: 154 },
} as const;

/** Convert a SCROLL_LAYOUT region to absolute-% CSS within the scroll container. */
export function toOverlayCss(
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
const INK_DIM = 'rgba(28,15,0,0.72)';
const INK_LABEL = 'rgba(28,15,0,0.60)';
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
      <span style={{ width: 13, fontSize: '0.70em', fontWeight: 700, color: isTop ? GOLD_INK : INK_LABEL, textAlign: 'center', flexShrink: 0, letterSpacing: '0.04em' }}>
        {meta.short}
      </span>
      <span style={{ width: 68, fontSize: '0.66em', color: isTop ? INK : INK_DIM, letterSpacing: '0.01em', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {meta.full}
      </span>
      <div style={{ flex: 1, height: 4, background: 'rgba(28,15,0,0.08)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: isTop ? '#7a4e00' : 'rgba(28,15,0,0.30)', borderRadius: 2, transition: 'width 0.3s ease' }} />
      </div>
      <span style={{ width: 18, fontSize: '0.70em', fontWeight: isTop ? 700 : 400, color: isTop ? GOLD_INK : INK_LABEL, textAlign: 'right', flexShrink: 0 }}>
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
  exploration,
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
  exploration?: ExplorationLoopState | null;
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

  // Build exactly 3 signpost slots — empty slots show "not yet revealed"
  const signposts = [
    foretoldSignpostRealmIds[0] ?? null,
    foretoldSignpostRealmIds[1] ?? null,
    foretoldSignpostRealmIds[2] ?? null,
  ] as const;
  const sigilRegions = [SCROLL_LAYOUT.sigil1, SCROLL_LAYOUT.sigil2, SCROLL_LAYOUT.sigil3] as const;

  if (import.meta.env.DEV) {
    console.log('[LH_SCROLL_HUB] foretoldSignpostRealmIds at render', {
      ids: [...foretoldSignpostRealmIds],
      count: foretoldSignpostRealmIds.length,
      scroll_reveal_performed: exploration?.scroll_reveal_performed ?? false,
      note: foretoldSignpostRealmIds.length === 0
        ? 'empty — runes will show placeholder text. Check exploration.scroll_reveal_performed and foretold_signpost_realm_ids.'
        : 'populated — rune glyphs should render',
    });
  }

  // Oracle prophecy brand — shown in the Oracle's Prophecy banner when sealed
  const oracleBrandTitle = exploration?.oracle_prophecy_title ?? null;
  const oracleBrandUrl   = exploration?.oracle_prophecy_career_url ?? null;

  return (
    <ScrollFrameStage zIndex={8500} variant="hub">

      {/* ── LEFT SIDE NAV ── Field Journal · Quest Log · Satchel ─── */}
      {/* Positions driven by SCROLL_LAYOUT.btn* zones — calibrate with dev tool */}
      <ScrollSideNavButton label="Field Journal" icon="📜" onClick={onOpenJournal}   layoutRect={SCROLL_LAYOUT.btnFieldJournal}  scrollRef={SCROLL_REF} />
      <ScrollSideNavButton label="Quest Log"     icon="◈"  onClick={onOpenQuestLog}  layoutRect={SCROLL_LAYOUT.btnQuestLog}      scrollRef={SCROLL_REF} />
      <ScrollSideNavButton label="Satchel"       icon="⚗"  onClick={onOpenInventory} layoutRect={SCROLL_LAYOUT.btnSatchel}       scrollRef={SCROLL_REF} />

      {/* ── TRAVELER PORTRAIT — masked into the scroll's circular socket ──── */}
      {/* Layer stack (bottom→top):                                            */}
      {/*   z0  base scroll image (in ScrollFrameStage)                        */}
      {/*   z1  Traveler portrait, clipped to a circle in the socket           */}
      {/*   z2  occluder copies of the scroll art (banner top + nameplate)     */}
      {/*   z3  player name text                                               */}
      {/* The portrait sits BEHIND the occluders so the painted banner above   */}
      {/* and the nameplate below tuck over it — the Traveler reads as embedded */}
      {/* in the socket, not pasted on top.                                    */}
      <div
        style={{
          ...toOverlayCss(SCROLL_LAYOUT.portrait),
          borderRadius: '50%',
          overflow: 'hidden',
          // Warm parchment fill — multiply on the sprite dissolves any light
          // background into this tone so no rectangular/white bounds show.
          background: 'rgba(216,185,122,0.95)',
          // Faint warm rim glow seats the medallion into the socket (outer only).
          boxShadow: '0 0 9px rgba(196,134,28,0.32), 0 0 3px rgba(0,0,0,0.50)',
          zIndex: 1,
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
            userSelect: 'none',
            display: 'block',
            mixBlendMode: 'multiply',
            // Frame the hood/head + torso: scale the figure down slightly and
            // nudge it up so the lower body falls into the nameplate-covered zone.
            transform: 'scale(0.9) translateY(-9px)',
            transformOrigin: 'center center',
          }}
        />
        {/* Inner radial vignette + edge darkening — makes the portrait feel
            recessed inside the medallion rather than flat. Sits above the sprite. */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background:
              'radial-gradient(circle at 50% 42%, rgba(0,0,0,0) 46%, rgba(34,18,2,0.30) 78%, rgba(24,12,0,0.52) 100%)',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* ── OCCLUDERS — clipped copies of the scroll art, layered OVER portrait ── */}
      {/* The scroll background is one flat image, so we re-draw the banner (top)   */}
      {/* and nameplate (bottom) regions on top of the portrait. Using the actual  */}
      {/* art guarantees a pixel-perfect overlap (no colour guessing). Both fill    */}
      {/* the 16:9 frame identically to the base image (objectFit:fill, inset:0).   */}

      {/* Top banner occluder — reveals scroll art from y0 down to ~22% */}
      <img
        src={SCROLL_ASSETS.hub}
        alt=""
        aria-hidden
        draggable={false}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'fill',
          clipPath: 'inset(0 0 78% 0)',
          pointerEvents: 'none',
          userSelect: 'none',
          zIndex: 2,
        }}
      />

      {/* Bottom nameplate occluder — reveals scroll art y31.5–40%, x40–60%.
          Top edge pulled up slightly so the nameplate covers more lower body. */}
      <img
        src={SCROLL_ASSETS.hub}
        alt=""
        aria-hidden
        draggable={false}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'fill',
          clipPath: 'inset(31.5% 40% 60% 40%)',
          pointerEvents: 'none',
          userSelect: 'none',
          zIndex: 2,
        }}
      />

      {/* ── NAME — rendered above the nameplate occluder (z-index:3) ─── */}
      <div
        style={{
          ...toOverlayCss(SCROLL_LAYOUT.name),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 3,
        }}
      >
        <p style={{ margin: 0, fontSize: '1.05em', fontWeight: 700, color: INK, lineHeight: 1, textAlign: 'center', letterSpacing: '0.03em' }}>
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
        <p style={{ margin: '0 0 4px', fontSize: '0.64em', textTransform: 'uppercase', letterSpacing: '0.12em', color: INK_LABEL }}>
          Active Quests
        </p>
        {activeQuests.length > 0 ? (
          activeQuests.map((q) => (
            <div key={q.quest_id} style={{ padding: '3px 0', borderBottom: '1px solid rgba(28,15,0,0.09)' }}>
              <p style={{ margin: 0, fontSize: '0.80em', fontWeight: 700, color: INK, lineHeight: 1.2 }}>{q.title}</p>
              <p style={{ margin: 0, fontSize: '0.69em', color: INK_DIM, lineHeight: 1.2 }}>{q.objective_short}</p>
            </div>
          ))
        ) : (
          <p style={{ margin: 0, fontSize: '0.76em', color: INK_DIM, fontStyle: 'italic' }}>No active quests.</p>
        )}
        <div style={{ margin: '8px 0 5px', height: 1, background: 'rgba(28,15,0,0.11)' }} />
        <p style={{ margin: '0 0 3px', fontSize: '0.64em', textTransform: 'uppercase', letterSpacing: '0.12em', color: INK_LABEL }}>
          Current Directive
        </p>
        <p style={{ margin: 0, fontSize: '0.84em', fontWeight: 700, color: INK, lineHeight: 1.35 }}>
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
        <p style={{ margin: '0 0 4px', fontSize: '0.64em', textTransform: 'uppercase', letterSpacing: '0.12em', color: INK_LABEL }}>
          Maia · Base Stats
        </p>
        {riasecScores && Object.values(riasecScores).some((v) => v > 0) ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {RIASEC_ORDER.map((code) => (
              <RiasecScrollRow key={code} code={code} score={riasecScores[code]} />
            ))}
          </div>
        ) : (
          <p style={{ margin: 0, fontSize: '0.73em', color: INK_DIM, fontStyle: 'italic', lineHeight: 1.45 }}>
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
        <p style={{ margin: '0 0 2px', fontSize: '0.64em', textTransform: 'uppercase', letterSpacing: '0.12em', color: INK_LABEL }}>
          Traveler Record
        </p>
        {[
          { label: 'Experience', value: player ? `${player.xp_total} XP` : '—' },
          { label: 'Rank', value: player ? `Level ${player.level_cached}` : '—' },
        ].map(({ label, value }) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <p style={{ margin: 0, fontSize: '0.71em', color: INK_DIM }}>{label}</p>
            <p style={{ margin: 0, fontSize: '0.78em', fontWeight: 700, color: INK }}>{value}</p>
          </div>
        ))}
        <div style={{ height: 1, background: 'rgba(28,15,0,0.10)', margin: '2px 0' }} />
        {streak > 0 ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <p style={{ margin: 0, fontSize: '0.71em', color: INK_DIM }}>Campfire</p>
            <p style={{ margin: 0, fontSize: '0.78em', fontWeight: 700, color: '#b45309' }}>🔥 {streak}</p>
          </div>
        ) : null}
      </div>

      {/* ── ORACLE'S PROPHECY — label row (center) + burned-in sigil (right) ── */}
      {/* The label row shows "Oracle's Prophecy" or the sealed career title     */}
      {/* centered in the same horizontal band as the hub's oracle area.         */}
      {/* When branded, the sigil PNG is also burned in at the exact position    */}
      {/* used during the Oracle cinematic (right of the rune row, sigil4 slot)  */}
      {/* so it persists on the scroll exactly where the ceremony burned it.     */}
      <div
        style={{
          position: 'absolute',
          left:   `${(SCROLL_LAYOUT.bannerRow.left   / SCROLL_REF.w) * 100}%`,
          top:    `${(SCROLL_LAYOUT.bannerRow.top    / SCROLL_REF.h) * 100}%`,
          width:  `${(SCROLL_LAYOUT.bannerRow.width  / SCROLL_REF.w) * 100}%`,
          height: `${(SCROLL_LAYOUT.bannerRow.height / SCROLL_REF.h) * 100}%`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
        }}
      >
        {/* Left decorative rule */}
        <div aria-hidden style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, rgba(28,15,0,0.30))' }} />
        <span aria-hidden style={{ width: 5, height: 5, background: GOLD_INK, transform: 'rotate(45deg)', flexShrink: 0, opacity: 0.7 }} />

          {/* Banner label — always "Foretold Signposts"; never replaced by URL or career text */}
          <p style={{ margin: 0, fontSize: '0.84em', fontWeight: 700, fontFamily: 'var(--lh-guild-display, "Cinzel", serif)', textTransform: 'uppercase', letterSpacing: '0.20em', color: GOLD_INK, lineHeight: 1, whiteSpace: 'nowrap' }}>
            Foretold Signposts
          </p>

        <span aria-hidden style={{ width: 5, height: 5, background: GOLD_INK, transform: 'rotate(45deg)', flexShrink: 0, opacity: 0.7 }} />
        {/* Right decorative rule */}
        <div aria-hidden style={{ flex: 1, height: 1, background: 'linear-gradient(270deg, transparent, rgba(28,15,0,0.30))' }} />
      </div>

      {/* ── ORACLE SIGIL — burned-in at the ceremony position (right of rune row) */}
      {/* Positioned at the same coordinates used in OracleProphecyReveal.tsx so  */}
      {/* the sigil persists exactly where it was sealed during the cinematic.     */}
      {/* mix-blend-mode: multiply is a TEMPORARY workaround for the white         */}
      {/* background in prophecy_sigil.png — re-export with transparency to fix.  */}
      {oracleBrandTitle ? (
        <div
          role={oracleBrandUrl ? 'link' : undefined}
          aria-label={oracleBrandUrl ? `Open career research: ${oracleBrandTitle}` : undefined}
          title={oracleBrandUrl ? oracleBrandTitle : undefined}
          style={{
            ...toOverlayCss(SCROLL_LAYOUT.oracleSigil),
            overflow: 'visible',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: oracleBrandUrl ? 'pointer' : 'default',
            pointerEvents: 'auto',
          }}
          onClick={() => {
            if (oracleBrandUrl) window.open(oracleBrandUrl, '_blank', 'noopener,noreferrer');
          }}
        >
          <img
            src="assets/oracle/prophecy_sigil.png"
            alt={oracleBrandUrl ? `Oracle sigil — ${oracleBrandTitle}` : ''}
            draggable={false}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              display: 'block',
              filter: 'drop-shadow(0 2px 6px rgba(120,70,0,0.50)) sepia(0.4) saturate(1.3)',
              userSelect: 'none',
            }}
          />
        </div>
      ) : null}

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
                <p style={{ margin: 0, fontSize: '0.65em', fontWeight: 700, color: INK, lineHeight: 1.2, textAlign: 'center' }}>
                  {realm?.display_name ?? realmId}
                </p>
              </>
            ) : (
              <p style={{ margin: 0, fontSize: '0.66em', color: INK_LABEL, fontStyle: 'italic', textAlign: 'center' }}>
                Signpost {i + 1}
              </p>
            )}
          </div>
        );
      })}

      {/* ── RIGHT SIDE NAV ── World Atlas · Make Camp · Return ───── */}
      <ScrollSideNavButton label="World Atlas"     icon="⚑" onClick={onOpenRealmAtlas} layoutRect={SCROLL_LAYOUT.btnWorldAtlas}    scrollRef={SCROLL_REF} />
      <ScrollSideNavButton label="Make Camp"       icon="🔥" onClick={onEndSession}     layoutRect={SCROLL_LAYOUT.btnMakeCamp}     scrollRef={SCROLL_REF} primary />
      <ScrollSideNavButton label="Return to Game"            onClick={onClose}           layoutRect={SCROLL_LAYOUT.btnReturnToGame} scrollRef={SCROLL_REF} primary />

      {/* DEV ONLY — layout calibration overlay. Activate with ?lh_scroll_layout_debug=1 */}
      <ScrollLayoutCalibrator scrollLayout={SCROLL_LAYOUT} scrollRef={SCROLL_REF} />

    </ScrollFrameStage>
  );
}

// ── Journal Tab Components ─────────────────────────────────────────────────

function RuneGlyph({ guildId }: { guildId: string }) {
  const [imgError, setImgError] = useState(false);
  const runeAsset = RUNE_ASSETS[guildId];

  // Prefer the PNG rune medallion asset when available and not broken
  if (runeAsset && !imgError) {
    return (
      <img
        src={runeAsset}
        alt=""
        aria-hidden
        draggable={false}
        onError={() => setImgError(true)}
        style={{
          width: '85%',
          height: '85%',
          objectFit: 'contain',
          display: 'block',
          userSelect: 'none',
          pointerEvents: 'none',
          filter: 'drop-shadow(0 2px 6px rgba(180,100,0,0.45))',
        }}
      />
    );
  }

  // Fallback: inline SVG rune from guildRunes.ts
  const rune = GUILD_RUNES[guildId];
  if (!rune) return null;
  return (
    <svg viewBox="0 0 40 46" width={32} height={37} aria-hidden>
      <path d={rune.path} fill="none" stroke="#d4a017" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {rune.dot ? <circle cx={rune.dot.cx} cy={rune.dot.cy} r={rune.dot.r} fill="#d4a017" /> : null}
    </svg>
  );
}

// ── Work Files — document shelf data ─────────────────────────────────────

type WorkFileStatus = 'available' | 'in_progress' | 'locked';

interface WorkFileEntry {
  id: string;
  fantasyTitle: string;
  realTitle: string;
  loreDesc: string;
  status: WorkFileStatus;
  lockLabel: string | null;
  btnLabel: string;
}

function buildWorkFiles(
  player: PlayerSave | null,
  quests: readonly QuestDefinition[],
): WorkFileEntry[] {
  const hasSave    = player !== null;
  const hasStarted = hasSave && (player.xp_total > 0 || player.current_act > 1);

  // Quest of Fate unlocks when mq-202 (Runes Become Legible) completes, which
  // triggers mq-203 (The Quest of Fate) to become available. Check both so the
  // document appears as soon as the Scribe says it's there.
  const questOfFateUnlocked = quests.some(
    (q) =>
      (['mq-203', 'mq-202'].includes(q.quest_id)) &&
      (q.status === 'active' || q.status === 'available' || q.status === 'completed'),
  );
  if (typeof console !== 'undefined') {
    console.log('[LH_WORKFILES] eligibility checked', { questOfFateUnlocked });
    if (questOfFateUnlocked) console.log('[LH_WORKFILES] visible — Quest of Fate Worksheet unlocked');
  }

  return [
    {
      id: 'scroll_of_destiny',
      fantasyTitle: 'Scroll of Destiny',
      realTitle: 'Career Plan',
      loreDesc: "The Traveler's official save record — your NYS Career Development Plan.",
      status: hasStarted ? 'in_progress' : 'available',
      lockLabel: null,
      btnLabel: hasStarted ? 'Review' : 'Open',
    },
    {
      id: 'mirror_of_maia',
      fantasyTitle: 'Mirror of Maia Findings',
      realTitle: 'Maia Learning Results',
      loreDesc: 'Base stats and signpost evidence revealed by the Mirror of Maia survey.',
      status: 'locked',
      lockLabel: 'Locked — Complete Mirror of Maia',
      btnLabel: 'Locked',
    },
    {
      id: 'quest_of_fate',
      fantasyTitle: 'Quest of Fate Worksheet',
      realTitle: 'Career Research Worksheet',
      loreDesc: 'First guided career prophecy research — your initial path inquiry.',
      status: questOfFateUnlocked ? 'available' : 'locked',
      lockLabel: questOfFateUnlocked ? null : 'Locked — Complete the Oracle\'s Summons',
      btnLabel: questOfFateUnlocked ? 'Open' : 'Coming Soon',
    },
    {
      id: 'comparison_ledger',
      fantasyTitle: 'Comparison Ledger',
      realTitle: 'Career Comparison Notes',
      loreDesc: 'Evidence from three foretold paths — side-by-side career analysis.',
      status: 'locked',
      lockLabel: 'Locked — Act II / III',
      btnLabel: 'Coming Soon',
    },
    {
      id: 'realm_recon',
      fantasyTitle: 'Realm Reconnaissance Notes',
      realTitle: 'Career Cluster Research',
      loreDesc: 'Guild and career cluster research notes from your scouting missions.',
      status: 'locked',
      lockLabel: 'Locked — Act III',
      btnLabel: 'Coming Soon',
    },
    {
      id: 'campfire_reflections',
      fantasyTitle: 'Campfire Reflections',
      realTitle: 'Exit Tickets / Reflection Log',
      loreDesc: 'Fireside reflection records — your session journals and exit tickets.',
      status: hasSave ? 'available' : 'locked',
      lockLabel: hasSave ? null : 'Available after first save',
      btnLabel: hasSave ? 'Open' : 'Locked',
    },
    {
      id: 'enrollment_rune',
      fantasyTitle: 'Enrollment Rune',
      realTitle: 'Job Application',
      loreDesc: 'Guild application draft — your formal career pathway application.',
      status: 'locked',
      lockLabel: 'Locked — Act IV',
      btnLabel: 'Coming Soon',
    },
    {
      id: 'trial_of_tongues',
      fantasyTitle: 'Trial of Tongues Record',
      realTitle: 'Interview Practice',
      loreDesc: 'Interview trial notes and transcript — practice session records.',
      status: 'locked',
      lockLabel: 'Locked — Act IV',
      btnLabel: 'Coming Soon',
    },
    {
      id: 'grand_chronicle',
      fantasyTitle: 'Grand Chronicle',
      realTitle: 'Final Slides / Presentation',
      loreDesc: 'Final path presentation — your completed journey compiled.',
      status: 'locked',
      lockLabel: 'Locked — Act V',
      btnLabel: 'Coming Soon',
    },
  ];
}

function WorkFilesTab({
  player,
  quests,
  exploration,
  onOpenQuestOfFateWorksheet,
}: {
  player: PlayerSave | null;
  quests: readonly QuestDefinition[];
  exploration?: ExplorationLoopState | null;
  onOpenQuestOfFateWorksheet?: () => void;
}) {
  const files = buildWorkFiles(player, quests);

  function handleFileOpen(file: WorkFileEntry) {
    if (file.status === 'locked') return;
    if (file.id === 'quest_of_fate') {
      if (typeof console !== 'undefined') {
        console.log('[LH_WORKFILES] opened', { id: file.id, module: 'mod_quest_of_fate_worksheet' });
      }
      onOpenQuestOfFateWorksheet?.();
    }
  }

  const driveUrl   = exploration?.quest_of_fate_drive_url;
  const syncStatus = exploration?.quest_of_fate_sync_status;

  return (
    <div style={{ padding: '14px 20px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <p style={{ margin: '0 0 10px', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(212,160,23,0.55)' }}>
        Document Shelf — Assignment Archive
      </p>

      {/* Part 8: Drive sync status — shown on Quest of Fate if status is pending/error */}
      {syncStatus && !driveUrl ? (
        <div
          style={{
            padding: '10px 16px',
            background: 'rgba(255,160,0,0.06)',
            border: '1px solid rgba(255,160,0,0.22)',
            borderRadius: 4,
            marginBottom: 4,
          }}
        >
          <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,200,80,0.8)', lineHeight: 1.5 }}>
            {syncStatus === 'error'
              ? '⚠ Drive sync error — contact your teacher to create your Quest of Fate document.'
              : '⏳ Drive copy pending — your teacher will create your personal Quest of Fate document.'}
          </p>
        </div>
      ) : null}
      {driveUrl ? (
        <div
          style={{
            padding: '10px 16px',
            background: 'rgba(134,239,172,0.07)',
            border: '1px solid rgba(134,239,172,0.25)',
            borderRadius: 4,
            marginBottom: 4,
          }}
        >
          <p style={{ margin: '0 0 6px', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(134,239,172,0.6)' }}>
            ✓ Google Drive Copy Ready
          </p>
          <a
            href={driveUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: 11, color: '#86efac', fontFamily: 'serif',
              textDecoration: 'none', letterSpacing: '0.04em',
            }}
          >
            Open my Quest of Fate document ↗
          </a>
        </div>
      ) : null}

      {files.map((file) => {
        const locked = file.status === 'locked';
        return (
          <div
            key={file.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '11px 15px',
              background: locked ? 'rgba(255,255,255,0.02)' : 'rgba(212,160,23,0.07)',
              border: locked ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(212,160,23,0.22)',
              borderRadius: 4,
              opacity: locked ? 0.52 : 1,
            }}
          >
            <span style={{ fontSize: 20, flexShrink: 0 }} aria-hidden>
              {locked ? '🔒' : file.status === 'in_progress' ? '📝' : '📜'}
            </span>

            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: locked ? 'rgba(232,220,200,0.45)' : '#f0dfa0', lineHeight: 1.2 }}>
                {file.fantasyTitle}
              </p>
              <p style={{ margin: '2px 0 0', fontSize: 10, color: locked ? 'rgba(212,160,23,0.32)' : 'rgba(212,160,23,0.65)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                {file.realTitle}
              </p>
              <p style={{ margin: '5px 0 0', fontSize: 11, color: locked ? 'rgba(255,255,255,0.28)' : 'rgba(232,220,200,0.70)', lineHeight: 1.45 }}>
                {file.loreDesc}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 7, flexShrink: 0 }}>
              {file.lockLabel ? (
                <span style={{ fontSize: 9, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.32)', whiteSpace: 'nowrap' }}>
                  {file.lockLabel}
                </span>
              ) : (
                <span style={{ fontSize: 9, letterSpacing: '0.07em', textTransform: 'uppercase', color: file.status === 'in_progress' ? '#f59e0b' : '#86efac', whiteSpace: 'nowrap' }}>
                  {file.status === 'in_progress' ? 'In Progress' : 'Available'}
                </span>
              )}
              <button
                type="button"
                disabled={locked}
                onClick={() => handleFileOpen(file)}
                style={{
                  padding: '5px 14px',
                  background: locked ? 'rgba(255,255,255,0.03)' : 'rgba(212,160,23,0.12)',
                  border: locked ? '1px solid rgba(255,255,255,0.09)' : '1px solid rgba(212,160,23,0.35)',
                  borderRadius: 3,
                  color: locked ? 'rgba(255,255,255,0.28)' : '#d4a017',
                  fontSize: 10,
                  cursor: locked ? 'default' : 'pointer',
                  letterSpacing: '0.05em',
                  fontFamily: 'serif',
                  whiteSpace: 'nowrap',
                }}
              >
                {file.btnLabel}
              </button>
            </div>
          </div>
        );
      })}
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
              <p style={{ margin: 0, fontSize: 10, color: 'rgba(255,255,255,0.60)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{stat.label}</p>
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
                <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.65)', lineHeight: 1.4 }}>{entry.note}</p>
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
      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>No encounters recorded this session.</p>
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
      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>No realms visited yet.</p>
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
  if (!player) return <div style={{ padding: '20px 24px' }}><p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12 }}>No player loaded.</p></div>;
  const inventory    = parseSatchelInventory(player.satchel_inventory_json);
  const { unlocked_titles, unlocked_badges } = inventory.cosmetics;
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
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5, margin: 0 }}>
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

  // If the student has submitted a campfire reflection but the teacher has not yet graded it,
  // show a clear "Awaiting teacher review" state rather than a bare dash.
  const rrValue = tier
    ? tier.replace(/_/g, ' ')
    : lastIso
      ? 'Awaiting teacher review'
      : '—';

  return (
    <div style={{ padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <section>
        <h2 style={{ margin: '0 0 12px', fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(212,160,23,0.7)' }}>Reflection Record</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px,1fr))', gap: 8 }}>
          {[
            { label: 'Current Streak', value: streak > 0 ? `🔥 ${streak}` : '—' },
            { label: 'Last Session',   value: lastIso ? new Date(lastIso).toLocaleDateString() : '—' },
            { label: 'Last Reflection', value: lastScore != null ? `${lastScore}/5` : '—' },
            { label: 'Rested Readiness', value: rrValue },
          ].map((stat) => (
            <div key={stat.label} style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 3 }}>
              <p style={{ margin: 0, fontSize: 10, color: 'rgba(255,255,255,0.60)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{stat.label}</p>
              <p style={{ margin: '4px 0 0', fontSize: 16, fontWeight: 700, color: '#f0dfa0', textTransform: 'capitalize' }}>{stat.value}</p>
            </div>
          ))}
        </div>
      </section>
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
                  <p style={{ margin: '2px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>{m.description}</p>
                </div>
                <span style={{ fontSize: 11, color: 'rgba(212,160,23,0.6)' }}>Streak {m.streak}</span>
              </div>
            );
          })}
        </div>
      </section>
      <section>
        <h2 style={{ margin: '0 0 10px', fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(212,160,23,0.7)' }}>About the Codex</h2>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, margin: 0 }}>
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
  player, quests, allRealms, exploration, realmProgress,
  onOpenQuestOfFateWorksheet,
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

  return (
    <ScrollSubMenuShell
      title="Field Journal"
      subtitle="Legendary Horizon"
      onBack={onBackToScroll}
      backLabel="← Back to Scroll"
      ariaLabel="Field Journal"
      zIndex={8500}
      tabs={journalTabs}
    >
      {/* Tab content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {activeTab === 'work_files' ? (
          <WorkFilesTab
            player={player}
            quests={quests}
            exploration={exploration}
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
      exploration={props.exploration}
      onClose={props.onClose}
      onOpenQuestLog={props.onOpenQuestLog}
      onOpenRealmAtlas={props.onOpenRealmAtlas}
      onOpenInventory={props.onOpenInventory}
      onEndSession={props.onEndSession}
      onOpenJournal={() => setMode('journal')}
    />
  );
}
