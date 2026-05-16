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
import type { MediaAssetRecord, QuestDefinition, RealmDefinition } from '../types';
import { buildRealmAtlasImageSrcCandidates, getAtlasPinPlacementForRealm } from '../realm/atlasWorldMap';
import { sortRealmsCanon } from '../realm/realmRegistry';
import type { RealmProgressMap } from '../realm/realmProgress';

type AtlasRenderedBounds = { width: number; height: number; offsetX: number; offsetY: number };

/** Realm Atlas HTML prototype: `<animate r from="0%" to="8%" dur="1.5s"/>` on a blurred mask hole. */
const FOG_REVEAL_DURATION_MS = 1500;
/** Final hole radius in the same 0–100 user space as `viewBox` (prototype ends at 8%). */
const FOG_HOLE_RADIUS = 8;
/** `#fog-blur` in `Fog of the unknown.html` — `feGaussianBlur stdDeviation="30"`. */
const FOG_MASK_BLUR = 30;
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

/** `encodeURIComponent(svg)` breaks internal `url(#id)` refs (# → %23). Base64 keeps masks valid. */
function svgMaskDataUrl(svg: string): string {
  try {
    if (typeof btoa !== 'undefined') {
      return `url("data:image/svg+xml;base64,${btoa(svg)}")`;
    }
  } catch {
    /* fall through */
  }
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
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

  const fogMaskDataUri = useMemo(() => {
    const fmt = (v: number) => v.toFixed(4);
    /** Prototype-style soft holes: black + heavy Gaussian blur in mask space. */
    const filterDef = `<filter id="lhfog" filterUnits="userSpaceOnUse" x="-80" y="-80" width="260" height="260"><feGaussianBlur in="SourceGraphic" stdDeviation="${FOG_MASK_BLUR}"/></filter>`;

    const staticHoles: string[] = [];
    for (const rid of revealedSet) {
      if (fogLiftAnimating && rid === frId) continue;
      const idx = ordered.findIndex((r) => r.realm_id === rid);
      const i = idx >= 0 ? idx : 0;
      const { leftPct, topPct } = getAtlasPinPlacementForRealm(rid, i, n || 1);
      staticHoles.push(
        `<circle cx="${fmt(leftPct)}" cy="${fmt(topPct)}" r="${FOG_HOLE_RADIUS}" fill="black" filter="url(#lhfog)"/>`,
      );
    }

    let animFragment = '';
    if (fogLiftAnimating && frId) {
      const idx = ordered.findIndex((r) => r.realm_id === frId);
      const i = idx >= 0 ? idx : 0;
      const { leftPct, topPct } = getAtlasPinPlacementForRealm(frId, i, n || 1);
      const te = easeOutCubic(fogAnimProgress);
      const r = FOG_HOLE_RADIUS * te;
      animFragment = `<circle cx="${fmt(leftPct)}" cy="${fmt(topPct)}" r="${fmt(r)}" fill="black" filter="url(#lhfog)"/>`;
    }

    const svg = [
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none">`,
      `<defs>${filterDef}<mask id="lfm"><rect width="100" height="100" fill="white"/>${staticHoles.join('')}${animFragment}</mask></defs>`,
      `<rect width="100" height="100" fill="white" mask="url(#lfm)"/>`,
      `</svg>`,
    ].join('');
    return svgMaskDataUrl(svg);
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
            {/* Prototype-parity Fog of the Unknown: backdrop-filter + inline SVG data URI mask. */}
            <div
              className="lh-atlas__proto-fog"
              style={{
                ...atlasLayerStyle,
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
                <button type="button" className="lh-button lh-button--primary" onClick={dismissAtlasIntro}>
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
