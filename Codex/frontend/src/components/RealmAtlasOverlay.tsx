import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';

import { useEscapeToClose } from '../hooks/useEscapeToClose';
import { GuildRealmInfoOverlay } from './GuildRealmInfoOverlay';
import { LH_MEDIA_ASSET_ID_FOG_CLEARING, LH_MEDIA_ASSET_ID_SCROLL_UNFURLING } from '../lib/mediaConstants';
import { tryPlayCatalogAudioAsset } from '../lib/lhCatalogAudio';
import type { ClassroomToolHandlers } from '../services/classroomToolLaunches';
import type { MediaAssetRecord, QuestDefinition, RealmDefinition } from '../types';
import { buildRealmAtlasImageSrcCandidates, getAtlasPinPlacementForRealm } from '../realm/atlasWorldMap';
import { sortRealmsCanon } from '../realm/realmRegistry';
import type { RealmProgressMap } from '../realm/realmProgress';

function hash32(input: string): number {
  // FNV-1a 32-bit
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

type FogBlobCircle = { dxPct: number; dyPct: number; rPct: number; delayMs?: number };

function buildFogBlob(seedKey: string, kind: 'static' | 'reveal'): FogBlobCircle[] {
  const rand = mulberry32(hash32(`${seedKey}:${kind}`));
  const count = kind === 'reveal' ? 9 : 7;
  const circles: FogBlobCircle[] = [];
  for (let i = 0; i < count; i += 1) {
    const a = rand() * Math.PI * 2;
    const dist = (kind === 'reveal' ? 3.8 : 3.1) * Math.pow(rand(), 0.7); // cluster toward center
    const dxPct = Math.cos(a) * dist;
    const dyPct = Math.sin(a) * dist;
    const rPct = (kind === 'reveal' ? 2.8 : 2.4) + rand() * (kind === 'reveal' ? 6.4 : 5.8);
    const delayMs = kind === 'reveal' ? Math.round(rand() * 260) : undefined;
    circles.push({ dxPct, dyPct, rPct, delayMs });
  }
  return circles;
}

type Props = {
  open: boolean;
  onClose: () => void;
  realms: RealmDefinition[];
  currentRealmId: string;
  quests: QuestDefinition[];
  mediaCatalog: readonly MediaAssetRecord[];
  realmProgress: RealmProgressMap;
  /** Guild HQ `realm_id`s charted on the atlas (persisted); unfogged pins are interactive. */
  guildHqAtlasRevealedRealmIds: readonly string[];
  /** Scroll of Destiny — Foretold Signposts (canon `realm_id`s); emphasizes revealed pins. */
  foretoldSignpostRealmIds?: readonly string[];
  /** External research / classroom shortcuts (journal layer only). */
  classroomTools: ClassroomToolHandlers | null;
  /**
   * When the World Atlas opens, optionally show this realm’s Guild Info full-screen first (must already be revealed).
   * Parent should clear via `onInitialGuildInfoConsumed` after mount so reopening the atlas does not replay the sheet.
   */
  initialGuildInfoRealmId?: string | null;
  onInitialGuildInfoConsumed?: () => void;
  /** After Guild Research closes, lift atlas fog from this hall’s waypoint while audio plays. */
  fogRevealRealmId?: string | null;
  onFogRevealConsumed?: () => void;
};

function truncateLabel(name: string, max = 22): string {
  const t = name.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

export function RealmAtlasOverlay({
  open,
  onClose,
  realms,
  currentRealmId,
  quests,
  mediaCatalog,
  realmProgress,
  guildHqAtlasRevealedRealmIds,
  foretoldSignpostRealmIds = [],
  classroomTools,
  initialGuildInfoRealmId = null,
  onInitialGuildInfoConsumed,
  fogRevealRealmId = null,
  onFogRevealConsumed,
}: Props) {
  const ordered = useMemo(() => sortRealmsCanon(realms), [realms]);
  const revealedSet = useMemo(
    () => new Set(guildHqAtlasRevealedRealmIds.map((id) => String(id || '').trim()).filter(Boolean)),
    [guildHqAtlasRevealedRealmIds],
  );
  const signpostSet = useMemo(
    () => new Set(foretoldSignpostRealmIds.map((id) => String(id || '').trim()).filter(Boolean)),
    [foretoldSignpostRealmIds],
  );
  const [guildInfoRealmId, setGuildInfoRealmId] = useState<string | null>(null);
  const [fogLiftFinished, setFogLiftFinished] = useState(false);
  const [fogLiftAnimating, setFogLiftAnimating] = useState(false);
  const [fogAnimProgress, setFogAnimProgress] = useState(0);
  const initialGuildInfoHandledRef = useRef(false);
  const fogLiftKickoffOnceRef = useRef(false);
  const fogAnimStartRef = useRef<number>(0);
  const atlasSrcCandidates = useMemo(() => buildRealmAtlasImageSrcCandidates(), []);
  const [atlasSrcIndex, setAtlasSrcIndex] = useState(0);

  const frId = String(fogRevealRealmId ?? '').trim();

  const fogPinPlacement = useMemo(() => {
    const total = ordered.length || 1;
    // If the atlas just opened from a trigger, `revealedSet` can briefly lag the intent;
    // still aim the lift at the canonical placement so the fog reads correctly.
    if (!frId) return { leftPct: 50, topPct: 50 };
    const idx = ordered.findIndex((r) => r.realm_id === frId);
    const i = idx >= 0 ? idx : 0;
    return getAtlasPinPlacementForRealm(frId, i, total);
  }, [frId, revealedSet, ordered]);

  const completeFogReveal = useCallback(() => {
    setFogLiftAnimating(false);
    setFogAnimProgress(1);
    setFogLiftFinished(true);
    onFogRevealConsumed?.();
  }, [onFogRevealConsumed]);

  // Animate the fog reveal over 1.5s using requestAnimationFrame.
  useEffect(() => {
    if (!fogLiftAnimating) return;
    fogAnimStartRef.current = performance.now();
    setFogAnimProgress(0);
    let raf = 0;
    const duration = 1500;
    const tick = () => {
      const elapsed = performance.now() - fogAnimStartRef.current;
      const t = Math.min(elapsed / duration, 1);
      setFogAnimProgress(t);
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        completeFogReveal();
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [fogLiftAnimating, completeFogReveal]);

  const handleGuildInfoClose = useCallback(() => {
    const closing = guildInfoRealmId;
    if (typeof console !== 'undefined') console.info('[FogReveal] handleGuildInfoClose', { closing, frId, hasRealm: revealedSet.has(frId ?? ''), fogLiftFinished, fogLiftAnimating });
    setGuildInfoRealmId(null);
    if (!closing || !frId || closing !== frId) return;
    if (!revealedSet.has(frId) || fogLiftFinished || fogLiftAnimating) return;
    if (typeof console !== 'undefined') console.info('[FogReveal] STARTING fog lift + audio');
    fogLiftKickoffOnceRef.current = true;
    tryPlayCatalogAudioAsset(LH_MEDIA_ASSET_ID_FOG_CLEARING);
    setFogLiftAnimating(true);
  }, [guildInfoRealmId, frId, revealedSet, fogLiftFinished, fogLiftAnimating]);

  // Kickoff: when the atlas opens from the guild trigger, ensure the fog + lift + SFX happens deterministically.
  useEffect(() => {
    if (typeof console !== 'undefined') console.info('[FogReveal] kickoff check', { open, fogLiftKickoffOnce: fogLiftKickoffOnceRef.current, guildInfoRealmId, frId, fogLiftFinished, fogLiftAnimating });
    if (!open) return;
    if (fogLiftKickoffOnceRef.current) return;
    if (guildInfoRealmId) return;
    if (!frId) return;
    if (fogLiftFinished || fogLiftAnimating) return;
    if (typeof console !== 'undefined') console.info('[FogReveal] kickoff FIRING — playing audio + starting animation');
    fogLiftKickoffOnceRef.current = true;
    const t = window.setTimeout(() => {
      tryPlayCatalogAudioAsset(LH_MEDIA_ASSET_ID_FOG_CLEARING);
      setFogLiftAnimating(true);
    }, 180);
    return () => window.clearTimeout(t);
  }, [open, guildInfoRealmId, frId, fogLiftFinished, fogLiftAnimating]);

  useEffect(() => {
    if (!open) {
      initialGuildInfoHandledRef.current = false;
      fogLiftKickoffOnceRef.current = false;
      setGuildInfoRealmId(null);
      setFogLiftFinished(false);
      setFogLiftAnimating(false);
      setFogAnimProgress(0);
      return;
    }
    if (initialGuildInfoHandledRef.current) return;
    const raw = String(initialGuildInfoRealmId ?? '').trim();
    if (!raw || !revealedSet.has(raw)) return;
    initialGuildInfoHandledRef.current = true;
    setGuildInfoRealmId(raw);
    tryPlayCatalogAudioAsset(LH_MEDIA_ASSET_ID_SCROLL_UNFURLING);
    onInitialGuildInfoConsumed?.();
  }, [open, initialGuildInfoRealmId, revealedSet, onInitialGuildInfoConsumed]);

  useEffect(() => {
    if (open) setAtlasSrcIndex(0);
  }, [open]);

  const { chartedCanonCount, charterTrailCanonCount } = useMemo(() => {
    let charted = 0;
    let trail = 0;
    for (const r of ordered) {
      if (revealedSet.has(r.realm_id)) charted += 1;
      if (realmProgress[r.realm_id]?.entered) trail += 1;
    }
    return { chartedCanonCount: charted, charterTrailCanonCount: trail };
  }, [ordered, revealedSet, realmProgress]);

  const guildInfoRealm = useMemo(() => {
    if (!guildInfoRealmId) return null;
    return ordered.find((r) => r.realm_id === guildInfoRealmId) ?? null;
  }, [ordered, guildInfoRealmId]);

  useEscapeToClose(open && !guildInfoRealmId, onClose);
  useEscapeToClose(open && Boolean(guildInfoRealmId), handleGuildInfoClose);

  if (!open) return null;

  const revealedCount = revealedSet.size;
  const n = ordered.length;
  const atlasImgSrc = atlasSrcCandidates[Math.min(atlasSrcIndex, atlasSrcCandidates.length - 1)];

  const fogMaskDataUri = useMemo(() => {
    const circles: string[] = [];
    // Static holes for all revealed realms.
    for (const rid of revealedSet) {
      // During animation, skip the animating realm's static blob — we draw it expanding instead.
      if (fogLiftAnimating && rid === frId) continue;
      const idx = ordered.findIndex((r) => r.realm_id === rid);
      const i = idx >= 0 ? idx : 0;
      const { leftPct, topPct } = getAtlasPinPlacementForRealm(rid, i, n || 1);
      const blob = buildFogBlob(rid, 'static');
      for (const c of blob) {
        circles.push(
          `<circle cx="${(leftPct + c.dxPct).toFixed(2)}" cy="${(topPct + c.dyPct).toFixed(2)}" r="${c.rPct.toFixed(2)}" fill="black"/>`,
        );
      }
    }
    // Animated reveal: expand the SAME static blob circles from 0 → full radius.
    if (fogLiftAnimating && frId) {
      const blob = buildFogBlob(frId, 'static');
      for (const c of blob) {
        const r = c.rPct * fogAnimProgress;
        if (r > 0.01) {
          circles.push(
            `<circle cx="${(fogPinPlacement.leftPct + c.dxPct).toFixed(2)}" cy="${(fogPinPlacement.topPct + c.dyPct).toFixed(2)}" r="${r.toFixed(2)}" fill="black"/>`,
          );
        }
      }
    }
    const svg = [
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none">`,
      `<defs><mask id="h"><rect width="100" height="100" fill="white"/>${circles.join('')}</mask></defs>`,
      `<rect width="100" height="100" fill="white" mask="url(#h)"/>`,
      `</svg>`,
    ].join('');
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  }, [revealedSet, ordered, n, fogLiftAnimating, fogAnimProgress, frId, fogPinPlacement]);

  return (
    <div className="lh-overlay lh-overlay--dim lh-overlay--atlas-full" role="dialog" aria-label="World Atlas">
      <div className="lh-world-atlas">
        <header className="lh-world-atlas__header">
          <div>
            <p className="lh-eyebrow">World Atlas</p>
            <h2 className="lh-heading-md">Fog of the Unknown</h2>
            <p className="lh-atlas__meta lh-world-atlas__lede">
              Your illustrated reference map for the whole world. Shrouded markers are halls not yet charted; bright pins
              are unlocked research entries (Act III guild HQs are research hubs only here — not manager trials). Tap a
              revealed pin for the full guild research sheet. Fog applies only on this atlas. Use Pause → Charter & HQ
              ledger for charter focus and notes.
            </p>
            <p className="lh-atlas__meta lh-atlas__journal-strip" aria-live="polite">
              <strong>Expedition record:</strong> {chartedCanonCount} of {n} canon halls charted ·{' '}
              <strong>Charter trail:</strong> {charterTrailCanonCount} realm(s) carry session notes from past focus
            </p>
            {signpostSet.size ? (
              <p className="lh-atlas__meta lh-atlas__signpost-strip" role="note">
                <strong>Foretold Signposts (Scroll):</strong>{' '}
                {foretoldSignpostRealmIds
                  .map((id) => ordered.find((r) => r.realm_id === id)?.display_name ?? id)
                  .join(' · ')}
                . Chart these halls on the atlas first when they appear.
              </p>
            ) : null}
          </div>
          <button type="button" className="lh-button lh-button--ghost" onClick={onClose}>
            Close
          </button>
        </header>

        <div className="lh-atlas__map-shell lh-atlas__map-shell--world-fill">
          <div
            className="lh-atlas__map-plate lh-atlas__map-plate--world-art lh-atlas__map-plate--fill-height"
            role="presentation"
            aria-label="Illustrated world atlas with guild hall markers"
          >
            <img
              className="lh-atlas__map-plate-img"
              src={atlasImgSrc}
              alt=""
              aria-hidden
              decoding="async"
              draggable={false}
              referrerPolicy="no-referrer"
              onError={() => {
                setAtlasSrcIndex((i) => (i + 1 < atlasSrcCandidates.length ? i + 1 : i));
              }}
            />
            <div className="lh-atlas__map-plate__veil" aria-hidden="true" />
            {/* Prototype-parity Fog of the Unknown: backdrop-filter + inline SVG data URI mask. */}
            <div
              className="lh-atlas__proto-fog"
              style={{
                WebkitMaskImage: fogMaskDataUri,
                maskImage: fogMaskDataUri,
                WebkitMaskSize: '100% 100%',
                maskSize: '100% 100%',
                WebkitMaskRepeat: 'no-repeat',
                maskRepeat: 'no-repeat',
              } as CSSProperties}
              aria-hidden="true"
            />
            {revealedCount === 0 ? (
              <div className="lh-atlas__map-empty-hint">
                <p className="lh-atlas__map-empty-title">No halls charted yet</p>
                <p className="lh-atlas__map-empty-body">
                  Visit a guild HQ in play to unlock its research entry — you will see the guild sheet first, then this
                  World Atlas opens with the reveal. Until then, align charter focus while exploring or use hall staff
                  encounters when available.
                </p>
              </div>
            ) : null}
            {ordered.map((r, idx) => {
              const { leftPct, topPct } = getAtlasPinPlacementForRealm(r.realm_id, idx, n);
              const slotStyle: CSSProperties = {
                left: `${leftPct}%`,
                top: `${topPct}%`,
              };
              const revealed = revealedSet.has(r.realm_id);
              const isCurrent = r.realm_id === currentRealmId;
              const infoOpen = guildInfoRealmId === r.realm_id;

              if (!revealed) {
                return (
                  <div key={r.realm_id} className="lh-atlas-pin-slot lh-atlas-pin-slot--fog" style={slotStyle}>
                    <div
                      role="presentation"
                      className="lh-atlas-pin lh-atlas-pin--fog"
                      title="Not charted in your expedition save yet"
                    >
                      <span className="lh-atlas-pin__fog-core" />
                    </div>
                  </div>
                );
              }

              return (
                <div key={r.realm_id} className="lh-atlas-pin-slot" style={slotStyle}>
                  <button
                    type="button"
                    role="listitem"
                    className={`lh-atlas-pin lh-atlas-pin--revealed ${infoOpen ? 'lh-atlas-pin--selected' : ''} ${isCurrent ? 'lh-atlas-pin--charter' : ''} ${signpostSet.has(r.realm_id) ? 'lh-atlas-pin--signpost' : ''}`}
                    title={`${r.display_name} — ${r.guild_headquarters}`}
                    onClick={() => setGuildInfoRealmId(r.realm_id)}
                  >
                    <span className="lh-atlas-pin__glyph" aria-hidden="true" />
                    <span className="lh-atlas-pin__label">{truncateLabel(r.display_name)}</span>
                    {isCurrent ? <span className="lh-atlas-pin__ribbon">Charter</span> : null}
                    {signpostSet.has(r.realm_id) ? (
                      <span className="lh-atlas-pin__ribbon lh-atlas-pin__ribbon--signpost">Scroll</span>
                    ) : null}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <GuildRealmInfoOverlay
        open={Boolean(guildInfoRealm)}
        realm={guildInfoRealm}
        onClose={handleGuildInfoClose}
        quests={quests}
        mediaCatalog={mediaCatalog}
        realmProgress={realmProgress}
        classroomTools={classroomTools}
      />
    </div>
  );
}
