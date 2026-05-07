import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type AnimationEvent,
  type CSSProperties,
} from 'react';

import { useEscapeToClose } from '../hooks/useEscapeToClose';
import { GuildRealmInfoOverlay } from './GuildRealmInfoOverlay';
import { LH_MEDIA_ASSET_ID_ATLAS_FOG_REVEAL } from '../lib/mediaConstants';
import { tryPlayCatalogAudioAsset } from '../lib/lhCatalogAudio';
import type { ClassroomToolHandlers } from '../services/classroomToolLaunches';
import type { MediaAssetRecord, QuestDefinition, RealmDefinition } from '../types';
import { buildRealmAtlasImageSrcCandidates, getAtlasPinPlacementForRealm } from '../realm/atlasWorldMap';
import { sortRealmsCanon } from '../realm/realmRegistry';
import type { RealmProgressMap } from '../realm/realmProgress';

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
  const initialGuildInfoHandledRef = useRef(false);
  const atlasSrcCandidates = useMemo(() => buildRealmAtlasImageSrcCandidates(), []);
  const [atlasSrcIndex, setAtlasSrcIndex] = useState(0);

  const frId = String(fogRevealRealmId ?? '').trim();

  const fogPinPlacement = useMemo(() => {
    const total = ordered.length || 1;
    if (!frId || !revealedSet.has(frId)) return { leftPct: 50, topPct: 50 };
    const idx = ordered.findIndex((r) => r.realm_id === frId);
    const i = idx >= 0 ? idx : 0;
    return getAtlasPinPlacementForRealm(frId, i, total);
  }, [frId, revealedSet, ordered]);

  const handleFogLiftEnd = useCallback(
    (e: AnimationEvent<HTMLDivElement>) => {
      if (e.target !== e.currentTarget) return;
      if (e.animationName !== 'lh-atlas-fog-lift') return;
      setFogLiftAnimating(false);
      setFogLiftFinished(true);
      onFogRevealConsumed?.();
    },
    [onFogRevealConsumed],
  );

  const handleGuildInfoClose = useCallback(() => {
    const closing = guildInfoRealmId;
    setGuildInfoRealmId(null);
    if (!closing || !frId || closing !== frId) return;
    if (!revealedSet.has(frId) || fogLiftFinished || fogLiftAnimating) return;
    tryPlayCatalogAudioAsset(LH_MEDIA_ASSET_ID_ATLAS_FOG_REVEAL, mediaCatalog);
    setFogLiftAnimating(true);
  }, [guildInfoRealmId, frId, revealedSet, fogLiftFinished, fogLiftAnimating, mediaCatalog]);

  useEffect(() => {
    if (!open) {
      initialGuildInfoHandledRef.current = false;
      setGuildInfoRealmId(null);
      setFogLiftFinished(false);
      setFogLiftAnimating(false);
      return;
    }
    if (initialGuildInfoHandledRef.current) return;
    const raw = String(initialGuildInfoRealmId ?? '').trim();
    if (!raw || !revealedSet.has(raw)) return;
    initialGuildInfoHandledRef.current = true;
    setGuildInfoRealmId(raw);
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
            {open && frId && revealedSet.has(frId) && !fogLiftFinished ? (
              <div
                className={`lh-atlas__map-fog-shroud ${fogLiftAnimating ? 'lh-atlas__map-fog-shroud--lifting' : ''}`}
                style={
                  {
                    '--atlas-fog-x': `${fogPinPlacement.leftPct}%`,
                    '--atlas-fog-y': `${fogPinPlacement.topPct}%`,
                  } as CSSProperties
                }
                aria-hidden="true"
                onAnimationEnd={handleFogLiftEnd}
              />
            ) : null}
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
