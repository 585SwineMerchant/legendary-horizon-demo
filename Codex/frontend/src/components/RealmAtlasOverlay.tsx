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
import { atlasFogRevealCirclePiece, resolveRealmFogPiece } from '../realm/atlasFogPieces';
import { sortRealmsCanon } from '../realm/realmRegistry';
import type { RealmProgressMap } from '../realm/realmProgress';

type AtlasRenderedBounds = { width: number; height: number; offsetX: number; offsetY: number };

const FOG_REVEAL_DURATION_MS = 3400;

function easeOutPow(t: number, power = 3): number {
  const x = Math.max(0, Math.min(1, t));
  return 1 - (1 - x) ** power;
}

function fogPieceOrFallback(realmId: string, indexInCanonOrder: number, totalRealms: number) {
  return (
    resolveRealmFogPiece(realmId) ??
    atlasFogRevealCirclePiece(
      getAtlasPinPlacementForRealm(realmId, indexInCanonOrder, totalRealms).leftPct,
      getAtlasPinPlacementForRealm(realmId, indexInCanonOrder, totalRealms).topPct,
    )
  );
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
  const mapPlateRef = useRef<HTMLDivElement | null>(null);
  const mapImageRef = useRef<HTMLImageElement | null>(null);
  const [atlasBounds, setAtlasBounds] = useState<AtlasRenderedBounds | null>(null);
  const atlasSrcCandidates = useMemo(() => buildRealmAtlasImageSrcCandidates(), []);
  const [atlasSrcIndex, setAtlasSrcIndex] = useState(0);

  const frId = String(fogRevealRealmId ?? '').trim();
  const n = ordered.length;
  const atlasImgSrc = atlasSrcCandidates[Math.min(atlasSrcIndex, atlasSrcCandidates.length - 1)];

  const updateAtlasBounds = useCallback(() => {
    const plate = mapPlateRef.current;
    const img = mapImageRef.current;
    if (!plate || !img) return;
    const plateRect = plate.getBoundingClientRect();
    const naturalW = img.naturalWidth || 0;
    const naturalH = img.naturalHeight || 0;
    if (plateRect.width <= 0 || plateRect.height <= 0 || naturalW <= 0 || naturalH <= 0) return;
    const scale = Math.min(plateRect.width / naturalW, plateRect.height / naturalH);
    const width = naturalW * scale;
    const height = naturalH * scale;
    const next = {
      width,
      height,
      offsetX: (plateRect.width - width) / 2,
      offsetY: (plateRect.height - height) / 2,
    };
    setAtlasBounds((prev) => {
      if (
        prev &&
        Math.abs(prev.width - next.width) < 0.5 &&
        Math.abs(prev.height - next.height) < 0.5 &&
        Math.abs(prev.offsetX - next.offsetX) < 0.5 &&
        Math.abs(prev.offsetY - next.offsetY) < 0.5
      ) {
        return prev;
      }
      return next;
    });
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.info('[LH atlas] rendered image bounds', {
        plate: { width: Math.round(plateRect.width), height: Math.round(plateRect.height) },
        natural: { width: naturalW, height: naturalH },
        rendered: {
          width: Math.round(width),
          height: Math.round(height),
          offsetX: Math.round(next.offsetX),
          offsetY: Math.round(next.offsetY),
        },
      });
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    updateAtlasBounds();
    const plate = mapPlateRef.current;
    if (!plate || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => updateAtlasBounds());
    ro.observe(plate);
    return () => ro.disconnect();
  }, [open, atlasImgSrc, updateAtlasBounds]);

  const completeFogReveal = useCallback(() => {
    setFogLiftAnimating(false);
    setFogAnimProgress(1);
    setFogLiftFinished(true);
    onFogRevealConsumed?.();
  }, [onFogRevealConsumed]);

  // Animate reveal: longer ease-out + soft edge (mask blur in SVG) + gentle drift (see component style).
  useEffect(() => {
    if (!fogLiftAnimating) return;
    fogAnimStartRef.current = performance.now();
    setFogAnimProgress(0);
    let raf = 0;
    const tick = () => {
      const elapsed = performance.now() - fogAnimStartRef.current;
      const t = Math.min(elapsed / FOG_REVEAL_DURATION_MS, 1);
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
    }, 260);
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

  const revealedCount = revealedSet.size;

  const fogMaskDataUri = useMemo(() => {
    const fmt = (v: number) => v.toFixed(4);
    const staticHoles: string[] = [];
    for (const rid of revealedSet) {
      if (fogLiftAnimating && rid === frId) continue;
      const idx = ordered.findIndex((r) => r.realm_id === rid);
      const i = idx >= 0 ? idx : 0;
      const piece = fogPieceOrFallback(rid, i, n || 1);
      staticHoles.push(`<path fill="black" d="${piece.pathD}"/>`);
    }

    const te = easeOutPow(fogAnimProgress);
    const blur = 6.6 * (1 - te) ** 1.15 + 0.45;
    const scaleStart = 0.07;
    const s = scaleStart + (1 - scaleStart) * te;
    const fillOp = 0.18 + 0.82 * te;

    let animFragment = '';
    let filterDef = '';
    if (fogLiftAnimating && frId) {
      const idx = ordered.findIndex((r) => r.realm_id === frId);
      const i = idx >= 0 ? idx : 0;
      const pc = fogPieceOrFallback(frId, i, n || 1);
      filterDef = `<filter id="lhfbr" filterUnits="userSpaceOnUse" x="-40" y="-40" width="180" height="180"><feGaussianBlur in="SourceGraphic" stdDeviation="${fmt(blur)}"/></filter>`;
      animFragment = `<g transform="translate(${fmt(pc.cx)} ${fmt(pc.cy)}) scale(${fmt(s)}) translate(${fmt(-pc.cx)} ${fmt(-pc.cy)})"><path fill="black" fill-opacity="${fmt(fillOp)}" filter="url(#lhfbr)" d="${pc.pathD}"/></g>`;
    }

    const svg = [
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none">`,
      `<defs>${filterDef}<mask id="lfm"><rect width="100" height="100" fill="white"/>${staticHoles.join('')}${animFragment}</mask></defs>`,
      `<rect width="100" height="100" fill="white" mask="url(#lfm)"/>`,
      `</svg>`,
    ].join('');
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  }, [revealedSet, ordered, n, fogLiftAnimating, fogAnimProgress, frId]);

  const atlasLayerStyle = atlasBounds
    ? ({
        left: `${atlasBounds.offsetX}px`,
        top: `${atlasBounds.offsetY}px`,
        width: `${atlasBounds.width}px`,
        height: `${atlasBounds.height}px`,
      } as CSSProperties)
    : ({ inset: 0 } as CSSProperties);

  const mapPctToRenderedStyle = useCallback(
    (leftPct: number, topPct: number): CSSProperties => {
      if (!atlasBounds) {
        return { left: `${leftPct}%`, top: `${topPct}%` };
      }
      return {
        left: `${atlasBounds.offsetX + (atlasBounds.width * leftPct) / 100}px`,
        top: `${atlasBounds.offsetY + (atlasBounds.height * topPct) / 100}px`,
      };
    },
    [atlasBounds],
  );

  const breezeX = fogLiftAnimating ? 2.4 * Math.sin(fogAnimProgress * Math.PI * 2.15) : 0;
  const breezeY = fogLiftAnimating ? -1.65 * Math.sin(fogAnimProgress * Math.PI * 1.55) : 0;

  if (!open) return null;

  return (
    <div className="lh-overlay lh-overlay--dim lh-overlay--atlas-full" role="dialog" aria-label="World Atlas">
      <div className="lh-world-atlas">
        <header className="lh-world-atlas__toolbar">
          <div className="lh-world-atlas__toolbar-text">
            <p className="lh-eyebrow lh-world-atlas__toolbar-eyebrow">World Atlas</p>
            <h2 className="lh-world-atlas__title">Fog of the Unknown</h2>
            <p className="lh-world-atlas__tagline lh-atlas__meta">
              Charted guild halls shine as pins. What is still masked is Fog of the Unknown — only on this atlas.
            </p>
          </div>
          <button type="button" className="lh-button lh-button--ghost lh-world-atlas__close" onClick={onClose}>
            Close
          </button>
        </header>

        <details className="lh-world-atlas__guide lh-atlas__meta">
          <summary className="lh-world-atlas__guide-summary">Atlas guide · expedition notes</summary>
          <div className="lh-world-atlas__guide-body">
            <p className="lh-world-atlas__lede">
              Your illustrated reference for the whole world. Shrouded markers are not yet chartered; revealed pins unlock
              the guild research sheet (Act&nbsp;III hubs are journals here — manager trials stay in play spaces). Pause →
              Charter &amp; HQ ledger holds charter-focused notes elsewhere.
            </p>
            <p className="lh-atlas__journal-strip" aria-live="polite">
              <strong>Expedition record:</strong> {chartedCanonCount} of {n} canon halls charted ·{' '}
              <strong>Charter trail:</strong> {charterTrailCanonCount} realm(s) carry session notes from past focus
            </p>
            {signpostSet.size ? (
              <p className="lh-atlas__signpost-strip" role="note">
                <strong>Foretold Signposts (Scroll):</strong>{' '}
                {foretoldSignpostRealmIds
                  .map((id) => ordered.find((r) => r.realm_id === id)?.display_name ?? id)
                  .join(' · ')}
                . Chart these halls first when they appear on your Scroll.
              </p>
            ) : null}
          </div>
        </details>

        <div className="lh-atlas__map-shell lh-atlas__map-shell--world-fill">
          <div
            ref={mapPlateRef}
            className="lh-atlas__map-plate lh-atlas__map-plate--world-art lh-atlas__map-plate--fill-height"
            role="presentation"
            aria-label="Illustrated world atlas with guild hall markers"
          >
            <img
              ref={mapImageRef}
              className="lh-atlas__map-plate-img"
              src={atlasImgSrc}
              alt=""
              aria-hidden
              decoding="async"
              draggable={false}
              referrerPolicy="no-referrer"
              onLoad={updateAtlasBounds}
              onError={() => {
                setAtlasSrcIndex((i) => (i + 1 < atlasSrcCandidates.length ? i + 1 : i));
              }}
            />
            <div className="lh-atlas__map-plate__veil" aria-hidden="true" />
            {/* Prototype-parity Fog of the Unknown: backdrop-filter + inline SVG data URI mask. */}
            <div
              className={`lh-atlas__proto-fog${fogLiftAnimating ? ' lh-atlas__proto-fog--drifting' : ''}`}
              style={{
                ...atlasLayerStyle,
                transform: `translate(${breezeX}px, ${breezeY}px)`,
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
              const slotStyle = mapPctToRenderedStyle(leftPct, topPct);
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
