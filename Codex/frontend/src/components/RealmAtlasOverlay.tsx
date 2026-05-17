import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';

import { useEscapeToClose } from '../hooks/useEscapeToClose';
import { GuildRealmInfoOverlay } from './GuildRealmInfoOverlay';
import { LH_MEDIA_ASSET_ID_FOG_CLEARING, LH_MEDIA_ASSET_ID_SCROLL_UNFURLING } from '../lib/mediaConstants';
import { tryPlayCatalogAudioAsset } from '../lib/lhCatalogAudio';
import type { MediaAssetRecord, QuestDefinition, RealmDefinition } from '../types';
import {
  ATLAS_FOG_BLEED_PCT,
  ATLAS_FOG_EDGE_FADE_WIDTH,
  ATLAS_FOG_MASK_BLUR,
  ATLAS_LANDSCAPE_FRAME_PCT,
  atlasFogHoleRadiusInMaskPct,
  atlasPinPctToFogMask01,
  buildRealmAtlasImageSrcCandidates,
  computeAtlasLandscapeLayerStyle,
  getAtlasPinPlacementForRealm,
} from '../realm/atlasWorldMap';
import { sortRealmsCanon } from '../realm/realmRegistry';
import type { RealmProgressMap } from '../realm/realmProgress';

type AtlasRenderedBounds = { width: number; height: number; offsetX: number; offsetY: number };

/** Realm Atlas HTML prototype: `<animate r from="0%" to="8%" dur="1.5s"/>` on a blurred mask hole. */
const FOG_REVEAL_DURATION_MS = 1500;
/** Final hole radius in full-raster % (prototype ~8%; slightly larger so labels sit inside the clear disc). */
const FOG_HOLE_RADIUS = 9.25;
const ATLAS_FOG_INTRO_DISMISSED_LS = 'lh.worldAtlas.fogIntroDismissed';
const ATLAS_FOG_INTRO_PENDING_SS = 'lh.atlas.introAfterFog';

function readAtlasIntroDismissed(): boolean {
  try {
    return typeof localStorage !== 'undefined' && localStorage.getItem(ATLAS_FOG_INTRO_DISMISSED_LS) === '1';
  } catch {
    return false;
  }
}

function writeAtlasIntroDismissed() {
  try {
    localStorage.setItem(ATLAS_FOG_INTRO_DISMISSED_LS, '1');
  } catch {
    /* ignore */
  }
}

function markAtlasIntroPendingFromFogReveal() {
  try {
    sessionStorage.setItem(ATLAS_FOG_INTRO_PENDING_SS, '1');
  } catch {
    /* ignore */
  }
}

function clearAtlasIntroPending() {
  try {
    sessionStorage.removeItem(ATLAS_FOG_INTRO_PENDING_SS);
  } catch {
    /* ignore */
  }
}

function readAtlasIntroPending(): boolean {
  try {
    return sessionStorage.getItem(ATLAS_FOG_INTRO_PENDING_SS) === '1';
  } catch {
    return false;
  }
}

function easeOutCubic(t: number): number {
  const x = Math.max(0, Math.min(1, t));
  return 1 - (1 - x) ** 3;
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
  const [atlasIntroVisible, setAtlasIntroVisible] = useState(false);
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
    if (!readAtlasIntroDismissed()) {
      markAtlasIntroPendingFromFogReveal();
      setAtlasIntroVisible(true);
    }
  }, [onFogRevealConsumed]);

  // Animate reveal: matches prototype (expanding blurred circle only — no shape handoff).
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

  const dismissAtlasIntro = useCallback(() => {
    writeAtlasIntroDismissed();
    clearAtlasIntroPending();
    setAtlasIntroVisible(false);
  }, []);

  const onAtlasOverlayEscape = useCallback(() => {
    if (guildInfoRealmId) {
      handleGuildInfoClose();
      return;
    }
    if (atlasIntroVisible) {
      dismissAtlasIntro();
      return;
    }
    onClose();
  }, [guildInfoRealmId, atlasIntroVisible, handleGuildInfoClose, dismissAtlasIntro, onClose]);

  // Kickoff: fog + SFX when there is no guild sheet, or when sheet is for a different realm than the fog intent.
  // IMPORTANT: when `initialGuildInfoRealmId === fogRevealRealmId` (HQ flow), we must NOT run here — that effect
  // used to fire on the first frame while `guildInfoRealmId` was still null, so the 1.5s reveal finished *behind*
  // the modal and looked/sounded like it "never triggered". `handleGuildInfoClose` starts fog in that case.
  useEffect(() => {
    if (!open) return;
    if (fogLiftKickoffOnceRef.current) return;
    if (guildInfoRealmId) return;
    if (!frId) return;
    if (fogLiftFinished || fogLiftAnimating) return;
    const initial = String(initialGuildInfoRealmId ?? '').trim();
    if (initial && initial === frId) {
      return;
    }
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.info('[FogReveal] kickoff (no guild sheet blocking)', { frId });
    }
    fogLiftKickoffOnceRef.current = true;
    const t = window.setTimeout(() => {
      tryPlayCatalogAudioAsset(LH_MEDIA_ASSET_ID_FOG_CLEARING);
      setFogLiftAnimating(true);
    }, 0);
    return () => window.clearTimeout(t);
  }, [open, guildInfoRealmId, frId, fogLiftFinished, fogLiftAnimating, initialGuildInfoRealmId]);

  useEffect(() => {
    if (!open) {
      initialGuildInfoHandledRef.current = false;
      fogLiftKickoffOnceRef.current = false;
      setGuildInfoRealmId(null);
      setFogLiftFinished(false);
      setFogLiftAnimating(false);
      setFogAnimProgress(0);
      setAtlasIntroVisible(false);
      return;
    }
    if (!readAtlasIntroDismissed() && readAtlasIntroPending()) {
      setAtlasIntroVisible(true);
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

  const guildInfoRealm = useMemo(() => {
    if (!guildInfoRealmId) return null;
    return ordered.find((r) => r.realm_id === guildInfoRealmId) ?? null;
  }, [ordered, guildInfoRealmId]);

  useEscapeToClose(open, onAtlasOverlayEscape);

  const revealedCount = revealedSet.size;

  const reactId = useId();
  const fogSvgIds = useMemo(() => {
    const s = reactId.replace(/[^a-zA-Z0-9_-]/g, '') || 'fog';
    return {
      grad: `lh-atlas-fog-grad-${s}`,
      mask: `lh-atlas-fog-mask-${s}`,
      soft: `lh-atlas-fog-soft-${s}`,
    };
  }, [reactId]);

  const landscapeLayerStyle = useMemo(
    () =>
      ({
        position: 'absolute',
        zIndex: 2,
        pointerEvents: 'none',
        overflow: 'visible',
        borderRadius: 2,
        ...computeAtlasLandscapeLayerStyle(atlasBounds, { bleed: true }),
      }) as CSSProperties,
    [atlasBounds],
  );

  /** Round holes when the fog mask box is letterboxed inside the atlas art. */
  const fogHoleRyScale = useMemo(() => {
    if (!atlasBounds || atlasBounds.width <= 0 || atlasBounds.height <= 0) return 1;
    const f = ATLAS_LANDSCAPE_FRAME_PCT;
    const b = ATLAS_FOG_BLEED_PCT;
    const w = (atlasBounds.width * (f.width + b.left + b.right)) / 100;
    const h = (atlasBounds.height * (f.height + b.top + b.bottom)) / 100;
    if (h <= 0) return 1;
    return w / h;
  }, [atlasBounds]);

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

  /** Mask holes in 0–1 space so `mask-image: url(#id)` on the blurred img scales with the atlas box. */
  const renderFogHole = useCallback(
    (key: string, fullLeftPct: number, fullTopPct: number, radiusFullPct: number) => {
      const { cx, cy } = atlasPinPctToFogMask01(fullLeftPct, fullTopPct);
      const r = atlasFogHoleRadiusInMaskPct(radiusFullPct) / 100;
      return (
        <ellipse
          key={key}
          cx={cx}
          cy={cy}
          rx={r}
          ry={r * fogHoleRyScale}
          fill={`url(#${fogSvgIds.grad})`}
        />
      );
    },
    [fogHoleRyScale, fogSvgIds.grad],
  );

  const fogEdgeFade = ATLAS_FOG_EDGE_FADE_WIDTH;

  const fogMaskUrl = `url(#${fogSvgIds.mask})`;

  const fogBlurImgStyle = useMemo(() => {
    const f = ATLAS_LANDSCAPE_FRAME_PCT;
    const b = ATLAS_FOG_BLEED_PCT;
    const boxLeft = f.left - b.left;
    const boxTop = f.top - b.top;
    const boxWidth = f.width + b.left + b.right;
    const boxHeight = f.height + b.top + b.bottom;
    return {
      position: 'absolute',
      left: `${-(boxLeft / boxWidth) * 100}%`,
      top: `${-(boxTop / boxHeight) * 100}%`,
      width: `${(100 / boxWidth) * 100}%`,
      height: `${(100 / boxHeight) * 100}%`,
      objectFit: 'fill',
      WebkitMaskImage: fogMaskUrl,
      maskImage: fogMaskUrl,
      WebkitMaskSize: '100% 100%',
      maskSize: '100% 100%',
      WebkitMaskRepeat: 'no-repeat',
      maskRepeat: 'no-repeat',
    } as CSSProperties;
  }, [fogMaskUrl]);

  if (!open) return null;

  return (
    <div className="lh-overlay lh-overlay--dim lh-overlay--atlas-full" role="dialog" aria-label="World Atlas">
      <div className="lh-world-atlas lh-world-atlas--map-focus">
        <div className="lh-world-atlas__chrome">
          <button type="button" className="lh-button lh-button--ghost lh-world-atlas__close-fab" onClick={onClose}>
            Close
          </button>
        </div>

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
            {/*
              Fog: masked blur only inside ATLAS_LANDSCAPE_FRAME_PCT (rectangular border); parchment rollers stay sharp.
            */}
            <div className="lh-atlas__fog-landscape" style={landscapeLayerStyle} aria-hidden>
              <svg className="lh-atlas__fog-mask-defs" aria-hidden width={0} height={0}>
                <defs>
                  <radialGradient id={fogSvgIds.grad} gradientUnits="objectBoundingBox" cx="0.5" cy="0.5" r="0.5">
                    <stop offset="0%" stopColor="#000000" />
                    <stop offset="55%" stopColor="#000000" />
                    <stop offset="100%" stopColor="#ffffff" />
                  </radialGradient>
                  <filter
                    id={fogSvgIds.soft}
                    filterUnits="objectBoundingBox"
                    x="-0.12"
                    y="-0.12"
                    width="1.24"
                    height="1.24"
                  >
                    <feGaussianBlur stdDeviation={ATLAS_FOG_MASK_BLUR} />
                  </filter>
                  <linearGradient id={`${fogSvgIds.mask}-fade-l`} gradientUnits="objectBoundingBox" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0" stopColor="#000000" />
                    <stop offset="1" stopColor="#ffffff" />
                  </linearGradient>
                  <linearGradient id={`${fogSvgIds.mask}-fade-r`} gradientUnits="objectBoundingBox" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0" stopColor="#ffffff" />
                    <stop offset="1" stopColor="#000000" />
                  </linearGradient>
                  <linearGradient id={`${fogSvgIds.mask}-fade-t`} gradientUnits="objectBoundingBox" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#000000" />
                    <stop offset="1" stopColor="#ffffff" />
                  </linearGradient>
                  <linearGradient id={`${fogSvgIds.mask}-fade-b`} gradientUnits="objectBoundingBox" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#ffffff" />
                    <stop offset="1" stopColor="#000000" />
                  </linearGradient>
                  <mask
                    id={fogSvgIds.mask}
                    maskUnits="objectBoundingBox"
                    maskContentUnits="objectBoundingBox"
                    x="0"
                    y="0"
                    width="1"
                    height="1"
                  >
                    <g filter={`url(#${fogSvgIds.soft})`}>
                      <rect width="1" height="1" fill="white" />
                      <rect x="0" y="0" width={fogEdgeFade} height="1" fill={`url(#${fogSvgIds.mask}-fade-l)`} />
                      <rect x={1 - fogEdgeFade} y="0" width={fogEdgeFade} height="1" fill={`url(#${fogSvgIds.mask}-fade-r)`} />
                      <rect x="0" y="0" width="1" height={fogEdgeFade} fill={`url(#${fogSvgIds.mask}-fade-t)`} />
                      <rect x="0" y={1 - fogEdgeFade} width="1" height={fogEdgeFade} fill={`url(#${fogSvgIds.mask}-fade-b)`} />
                      {Array.from(revealedSet).map((rid) => {
                        if (fogLiftAnimating && rid === frId) return null;
                        const idx = ordered.findIndex((r) => r.realm_id === rid);
                        const i = idx >= 0 ? idx : 0;
                        const { leftPct, topPct } = getAtlasPinPlacementForRealm(rid, i, n || 1);
                        return renderFogHole(`hole-${rid}`, leftPct, topPct, FOG_HOLE_RADIUS);
                      })}
                      {fogLiftAnimating && frId
                        ? (() => {
                            const idx = ordered.findIndex((r) => r.realm_id === frId);
                            const i = idx >= 0 ? idx : 0;
                            const { leftPct, topPct } = getAtlasPinPlacementForRealm(frId, i, n || 1);
                            const te = easeOutCubic(fogAnimProgress);
                            const r = FOG_HOLE_RADIUS * Math.max(te, 0.001);
                            return renderFogHole('hole-anim', leftPct, topPct, r);
                          })()
                        : null}
                    </g>
                  </mask>
                </defs>
              </svg>
              <img
                className="lh-atlas__map-plate-img lh-atlas__map-plate-img--fog-blur"
                src={atlasImgSrc}
                alt=""
                aria-hidden
                decoding="async"
                draggable={false}
                referrerPolicy="no-referrer"
                style={fogBlurImgStyle}
              />
            </div>
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
                    className={`lh-atlas-pin lh-atlas-pin--revealed-compact ${infoOpen ? 'lh-atlas-pin--selected' : ''} ${isCurrent ? 'lh-atlas-pin--charter-compact' : ''} ${signpostSet.has(r.realm_id) ? 'lh-atlas-pin--signpost-compact' : ''}`}
                    title={`Open guild research — ${r.guild_headquarters}`}
                    aria-label={`Open guild research for ${r.display_name}, ${r.guild_headquarters}`}
                    onClick={() => setGuildInfoRealmId(r.realm_id)}
                  >
                    <span className="lh-atlas-pin__glyph lh-atlas-pin__glyph--hq" aria-hidden="true" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {atlasIntroVisible ? (
          <div className="lh-world-atlas__intro-stack">
            <button
              type="button"
              className="lh-world-atlas__intro-backdrop"
              aria-label="Dismiss atlas introduction"
              onClick={dismissAtlasIntro}
            />
            <div
              className="lh-world-atlas__intro-panel"
              role="dialog"
              aria-modal="true"
              aria-labelledby="lh-atlas-intro-title"
            >
              <p className="lh-eyebrow lh-world-atlas__intro-eyebrow">Fog of the Unknown</p>
              <h3 id="lh-atlas-intro-title" className="lh-world-atlas__intro-title">
                Charting guild halls on the atlas
              </h3>
              <p className="lh-world-atlas__intro-body lh-atlas__meta">
                Each revealed territory is keyed to a guild headquarters. Tap the amber mark at that hall to reopen the
                guild research hub. The mist only gathers on this map — Pause still holds charter notes elsewhere.
              </p>
              {signpostSet.size ? (
                <p className="lh-atlas__signpost-strip lh-world-atlas__intro-extra" role="note">
                  <strong>Foretold Signposts (Scroll):</strong>{' '}
                  {foretoldSignpostRealmIds
                    .map((rid) => ordered.find((re) => re.realm_id === rid)?.display_name ?? rid)
                    .join(' · ')}
                  .
                </p>
              ) : null}
              <div className="lh-world-atlas__intro-actions">
                <button type="button" className="lh-button lh-button--primary" data-lh-continue onClick={dismissAtlasIntro}>
                  Got it
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <GuildRealmInfoOverlay
        open={Boolean(guildInfoRealm)}
        realm={guildInfoRealm}
        onClose={handleGuildInfoClose}
        quests={quests}
        mediaCatalog={mediaCatalog}
        realmProgress={realmProgress}
      />
    </div>
  );
}
