import { useEffect, useMemo, useState } from 'react';

import { useEscapeToClose } from '../hooks/useEscapeToClose';
import { LhCatalogImage } from './LhCatalogImage';
import type { MediaAssetRecord, QuestDefinition, RealmDefinition } from '../types';
import { getGuildRealmCareerOneStopUrl } from '../realm/guildRealmCareerOneStopUrl';
import { resolveGuildHqHeroAsset } from '../realm/guildHqHeroAsset';
import { getGuildHqWorkbookHeroDisplay } from '../realm/guildHqWorkbookHero';
import { getGuildRealmTitleParts, getRealmPathInterestTags } from '../realm/guildRealmTitleParts';
import { getRealmResearchBullets } from '../realm/guildRealmResearchBullets';
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
 * (`Project Documents/Fog of the unknown.html`): 16×9 slide, split lore column + HQ art bleed,
 * fantasy tiles, CareerOneStop link on the guild header row.
 */
export function GuildRealmInfoOverlay({
  open,
  realm,
  onClose,
  quests,
  mediaCatalog,
  realmProgress,
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
  const hasHeroVisual = true; // text-card fallback always fills the visual rail
  const pathTags = realm ? getRealmPathInterestTags(realm) : [];
  const realmQuests = realm ? filterQuestsForRealm(quests, realm.realm_id) : [];
  const careerSpotlightUrl = realm ? getGuildRealmCareerOneStopUrl(realm.realm_id) : undefined;
  const titleParts = realm ? getGuildRealmTitleParts(realm) : { lead: '', highlight: null as string | null };
  const decor = realm ? SLUG_DECOR[realm.slug] ?? 'LH' : 'LH';

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

          {false && visited ? (
            <p className="lh-guild-realm-modal__badge" role="status">
              Charter trail — this realm appears in your expedition notes
            </p>
          ) : null}

          <p className="lh-guild-realm-modal__lore">{intro}</p>

          <div className="lh-guild-realm-modal__grid">
            <div className="lh-guild-realm-modal__box">
              <h3 className="lh-guild-realm-modal__box-label">Traveler interests</h3>
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
              <h3 className="lh-guild-realm-modal__box-label">Realm quests</h3>
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
              <h3 className="lh-guild-realm-modal__box-label">Guild professions (careers)</h3>
              <p className="lh-guild-realm-modal__cluster-line">{cluster}</p>
            </div>
            <div className="lh-guild-realm-modal__box lh-guild-realm-modal__box--wide">
              <h3 className="lh-guild-realm-modal__box-label">Research focus</h3>
              <ul className="lh-guild-realm-modal__diamond-list">
                {getRealmResearchBullets(realm.realm_id).map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            </div>
          </div>

          <p className="lh-guild-realm-modal__ledger-status" role="status">
            Prepared in Comparison Ledger — open the ledger from the Atlas to fill in your research.
          </p>
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
          ) : (
            /* Text-card fallback: shown when all Drive/catalog image URLs are unavailable
               (school network firewall blocks drive.google.com). */
            <div className="lh-guild-realm-modal__visual-textcard" aria-hidden="false">
              <div className="lh-guild-realm-modal__visual-textcard-decor" aria-hidden="true">
                {decor}
              </div>
              <p className="lh-guild-realm-modal__visual-textcard-name">{realm.display_name}</p>
              <p className="lh-guild-realm-modal__visual-textcard-cluster">{cluster}</p>
              {careerSpotlightUrl ? (
                <a
                  href={careerSpotlightUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="lh-guild-realm-modal__visual-textcard-link"
                >
                  Explore careers ↗
                </a>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
