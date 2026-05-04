import { useEffect, useMemo, useState } from 'react';

import { useEscapeToClose } from '../hooks/useEscapeToClose';
import { LhCatalogImage } from './LhCatalogImage';
import { ClassroomToolsButtonRow } from './ClassroomToolsButtonRow';
import type { ClassroomToolHandlers } from '../services/classroomToolLaunches';
import type { MediaAssetRecord, QuestDefinition, RealmDefinition } from '../types';
import { getGuildRealmCareerOneStopUrl } from '../realm/guildRealmCareerOneStopUrl';
import { listGuildGalleryImageAssets, resolveGuildHqHeroAsset } from '../realm/guildHqHeroAsset';
import { getGuildHqWorkbookHeroDisplay } from '../realm/guildHqWorkbookHero';
import { getGuildRealmTitleParts, getRealmPathInterestTags } from '../realm/guildRealmTitleParts';
import {
  filterQuestsForRealm,
  getCareerClusterLabel,
  getRealmIntroBody,
} from '../realm/realmRegistry';
import type { RealmProgressMap } from '../realm/realmProgress';

export type GuildRealmInfoOverlayProps = {
  open: boolean;
  realm: RealmDefinition | null;
  onClose: () => void;
  quests: QuestDefinition[];
  mediaCatalog: readonly MediaAssetRecord[];
  realmProgress: RealmProgressMap;
  classroomTools: ClassroomToolHandlers | null;
};

const SLUG_DECOR: Readonly<Record<string, string>> = {
  aethelwood: '☘',
  'monolith-masonry': '⛰',
  'chroniclers-spire': '🎭',
  'mercantile-citadel': '⚖',
  'archives-ascension': '📜',
  'gilded-vault': '◎',
  'high-council-hall': '🏛',
  'aurora-apothecary': '⚗',
  'crossroads-haven': '☕',
  'empaths-enclave': '💠',
  'etheric-nexus': '◇',
  'valors-watchtower': '🛡',
  'vulcanis-forge': '⚒',
  'bards-beacon': '📣',
  'alchemical-observatory': '✶',
  'odyssey-harbor': '⚓',
};

/**
 * Full-screen guild HQ discovery sheet — presentation aligned with the Realm Atlas HTML prototype
 * (`Project Documents/Fog of the unknown.html`): split lore column + featured HQ art, fantasy-career
 * tiles, and CareerOneStop cluster link.
 */
export function GuildRealmInfoOverlay({
  open,
  realm,
  onClose,
  quests,
  mediaCatalog,
  realmProgress,
  classroomTools,
}: GuildRealmInfoOverlayProps) {
  useEscapeToClose(open, onClose);

  const visited = realm ? Boolean(realmProgress[realm.realm_id]?.entered) : false;
  const workbookHeroDelivery = useMemo(
    () => (realm ? getGuildHqWorkbookHeroDisplay(realm.realm_id) : undefined),
    [realm],
  );
  const workbookTryUrls = workbookHeroDelivery?.try_urls ?? [];
  const [workbookUrlAttempt, setWorkbookUrlAttempt] = useState(0);
  useEffect(() => {
    setWorkbookUrlAttempt(0);
  }, [realm?.realm_id, workbookTryUrls.join('|')]);

  const workbookHeroSrc =
    workbookTryUrls.length > 0 && workbookUrlAttempt < workbookTryUrls.length
      ? workbookTryUrls[workbookUrlAttempt]
      : undefined;

  useEffect(() => {
    if (!import.meta.env.DEV || !realm) return;
    console.log('[GuildInfoHero] delivery', {
      realm_id: realm.realm_id,
      try_urls: workbookTryUrls,
      active_src: workbookHeroSrc,
      attempt: workbookUrlAttempt,
      drive_file_id: workbookHeroDelivery?.drive_file_id ?? null,
      workbook_uc_url: workbookHeroDelivery?.workbook_uc_url ?? null,
    });
  }, [realm, workbookHeroDelivery, workbookHeroSrc, workbookTryUrls, workbookUrlAttempt]);

  const heroAsset = useMemo(
    () => (realm ? resolveGuildHqHeroAsset(realm, mediaCatalog) : null),
    [realm, mediaCatalog],
  );
  const hasHeroVisual = Boolean(workbookHeroSrc || heroAsset);
  const extraImageAssets = useMemo(
    () => (realm ? listGuildGalleryImageAssets(realm, mediaCatalog, heroAsset?.asset_id ?? null) : []),
    [realm, mediaCatalog, heroAsset?.asset_id],
  );
  const pathTags = realm ? getRealmPathInterestTags(realm) : [];
  const realmQuests = realm ? filterQuestsForRealm(quests, realm.realm_id) : [];
  const careerSpotlightUrl = realm ? getGuildRealmCareerOneStopUrl(realm.realm_id) : undefined;
  const titleParts = realm ? getGuildRealmTitleParts(realm) : { lead: '', highlight: null as string | null };
  const decor = realm ? SLUG_DECOR[realm.slug] ?? '✦' : '✦';

  if (!open || !realm) return null;

  const intro = getRealmIntroBody(realm);
  const cluster = getCareerClusterLabel(realm);

  return (
    <div
      className="lh-guild-info-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`${realm.display_name} — guild discovery`}
    >
      <button type="button" className="lh-guild-realm-modal__close" onClick={onClose} aria-label="Close guild discovery">
        ×
      </button>

      <div className="lh-guild-realm-modal">
        <div className="lh-guild-realm-modal__content">
          <p className="lh-guild-realm-modal__eyebrow">Act III — Guild research hub</p>

          {careerSpotlightUrl ? (
            <a href={careerSpotlightUrl} className="lh-guild-realm-modal__header-link" target="_blank" rel="noopener noreferrer">
              <div className="lh-guild-realm-modal__guild-header">
                <div className="lh-guild-realm-modal__guild-icon" aria-hidden="true">
                  {decor}
                </div>
                <h2 className="lh-guild-realm-modal__title">
                  {titleParts.lead}
                  {titleParts.highlight ? (
                    <>
                      {' '}
                      <span className="lh-guild-realm-modal__title-highlight">{titleParts.highlight}</span>
                    </>
                  ) : null}
                </h2>
              </div>
              <span className="lh-guild-realm-modal__header-link-hint">Open real-world career cluster on CareerOneStop ↗</span>
            </a>
          ) : (
            <div className="lh-guild-realm-modal__guild-header">
              <div className="lh-guild-realm-modal__guild-icon" aria-hidden="true">
                {decor}
              </div>
              <h2 className="lh-guild-realm-modal__title">
                {titleParts.lead}
                {titleParts.highlight ? (
                  <>
                    {' '}
                    <span className="lh-guild-realm-modal__title-highlight">{titleParts.highlight}</span>
                  </>
                ) : null}
              </h2>
            </div>
          )}

          {visited ? (
            <p className="lh-guild-realm-modal__badge" role="status">
              Charter trail — this realm appears in your expedition notes
            </p>
          ) : null}

          <p className="lh-guild-realm-modal__lore">{intro}</p>

          <div className="lh-guild-realm-modal__grid">
            <div className="lh-guild-realm-modal__box">
              <h3 className="lh-guild-realm-modal__box-label">Path interests</h3>
              {pathTags.length ? (
                <ul className="lh-guild-realm-modal__diamond-list">
                  {pathTags.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              ) : (
                <p className="lh-guild-realm-modal__box-muted">
                  Realm tags will list explorer hooks as the data set grows — your career cluster below is the anchor.
                </p>
              )}
            </div>

            <div className="lh-guild-realm-modal__box">
              <h3 className="lh-guild-realm-modal__box-label">Stories in play</h3>
              {realmQuests.length ? (
                <ul className="lh-guild-realm-modal__diamond-list">
                  {realmQuests.slice(0, 8).map((q) => (
                    <li key={q.quest_id}>{q.title}</li>
                  ))}
                </ul>
              ) : (
                <p className="lh-guild-realm-modal__box-muted">No quest lines reference this hall in the current fixture slice.</p>
              )}
            </div>

            <div className="lh-guild-realm-modal__box lh-guild-realm-modal__box--wide">
              <h3 className="lh-guild-realm-modal__box-label">Fantasy — career cluster</h3>
              <p className="lh-guild-realm-modal__cluster-line">{cluster}</p>
              {careerSpotlightUrl ? (
                <a
                  className="lh-button lh-button--secondary lh-guild-realm-modal__cluster-cta"
                  href={careerSpotlightUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Explore cluster on CareerOneStop
                </a>
              ) : null}
            </div>
          </div>

          <section className="lh-guild-realm-modal__research" aria-label="Classroom research tools">
            <h3 className="lh-guild-realm-modal__box-label">Your research desk</h3>
            <p className="lh-guild-realm-modal__box-muted">Open classroom tools in a new tab while you read this hall.</p>
            {classroomTools ? <ClassroomToolsButtonRow handlers={classroomTools} layout="pause" /> : null}
          </section>

          {extraImageAssets.length ? (
            <div className="lh-guild-realm-modal__gallery" aria-label="Additional guild artwork from catalog">
              {extraImageAssets.map((m) => (
                <div key={m.asset_id} className="lh-guild-realm-modal__gallery-cell">
                  <LhCatalogImage
                    assetId={m.asset_id}
                    alt={m.description || m.asset_id}
                    catalog={mediaCatalog}
                    loading="lazy"
                    className="lh-guild-realm-modal__gallery-img"
                  />
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div
          className={`lh-guild-realm-modal__visual${hasHeroVisual ? '' : ' lh-guild-realm-modal__visual--empty'}`}
          aria-hidden={!hasHeroVisual}
        >
          {workbookHeroSrc ? (
            <img
              key={`${realm.realm_id}-wb-${workbookUrlAttempt}`}
              src={workbookHeroSrc}
              alt={`${realm.display_name} — guild headquarters`}
              className="lh-guild-realm-modal__visual-img"
              loading="eager"
              decoding="async"
              draggable={false}
              referrerPolicy="no-referrer"
              onError={() => {
                if (import.meta.env.DEV) {
                  console.warn('[GuildInfoHero] img onError — advancing fallback or catalog', {
                    realm_id: realm.realm_id,
                    attempt: workbookUrlAttempt,
                    failed_src: workbookHeroSrc,
                    remaining:
                      workbookTryUrls.length > workbookUrlAttempt + 1
                        ? workbookTryUrls.slice(workbookUrlAttempt + 1)
                        : [],
                    will_use_catalog: workbookUrlAttempt + 1 >= workbookTryUrls.length && Boolean(heroAsset),
                  });
                }
                setWorkbookUrlAttempt((i) => i + 1);
              }}
            />
          ) : heroAsset ? (
            <LhCatalogImage
              assetId={heroAsset.asset_id}
              alt={heroAsset.description || `${realm.display_name} headquarters`}
              catalog={mediaCatalog}
              loading="eager"
              className="lh-guild-realm-modal__visual-img"
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
