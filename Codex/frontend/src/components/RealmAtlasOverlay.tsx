import { useMemo, useState } from 'react';

import { useEscapeToClose } from '../hooks/useEscapeToClose';
import { LhCatalogImage } from './LhCatalogImage';
import { isImageLikeMediaKind } from '../lib/mediaKinds';
import type { MediaAssetRecord, QuestDefinition, RealmDefinition } from '../types';
import {
  countQuestHooksForRealm,
  getCareerClusterLabel,
  getGuildHqLabel,
  getRealmIntroBody,
  sortRealmsCanon,
} from '../realm/realmRegistry';
import { listMediaAssetsForRealm } from '../realm/realmAssets';
import type { RealmProgressMap } from '../realm/realmProgress';

type Props = {
  open: boolean;
  onClose: () => void;
  realms: RealmDefinition[];
  currentRealmId: string;
  quests: QuestDefinition[];
  mediaCatalog: readonly MediaAssetRecord[];
  realmProgress: RealmProgressMap;
};

export function RealmAtlasOverlay({
  open,
  onClose,
  realms,
  currentRealmId,
  quests,
  mediaCatalog,
  realmProgress,
}: Props) {
  const ordered = useMemo(() => sortRealmsCanon(realms), [realms]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = useMemo(
    () => ordered.find((r) => r.realm_id === (selectedId ?? currentRealmId)) ?? ordered[0],
    [ordered, selectedId, currentRealmId],
  );
  useEscapeToClose(open, onClose);

  if (!open) return null;

  const questCount = selected ? countQuestHooksForRealm(quests, selected.realm_id) : 0;
  const mediaHits = selected ? listMediaAssetsForRealm(mediaCatalog, selected.realm_id) : [];
  const visited = selected ? Boolean(realmProgress[selected.realm_id]?.entered) : false;

  return (
    <div className="lh-overlay lh-overlay--dim" role="dialog" aria-label="Realm atlas">
      <div className="lh-panel lh-panel--atlas">
        <header className="lh-atlas__header">
          <div>
            <p className="lh-eyebrow">Milestone 6 — Canon realms</p>
            <h2 className="lh-heading-md">Realm atlas</h2>
          </div>
          <button type="button" className="lh-button lh-button--ghost" onClick={onClose}>
            Close
          </button>
        </header>

        <div className="lh-atlas__layout">
          <div className="lh-atlas__grid" role="list">
            {ordered.map((r) => {
              const isCurrent = r.realm_id === currentRealmId;
              const isSel = r.realm_id === selected.realm_id;
              const wasHere = Boolean(realmProgress[r.realm_id]?.entered);
              return (
                <button
                  key={r.realm_id}
                  type="button"
                  role="listitem"
                  className={`lh-realm-card ${isSel ? 'lh-realm-card--selected' : ''} ${isCurrent ? 'lh-realm-card--current' : ''}`}
                  onClick={() => setSelectedId(r.realm_id)}
                >
                  <span className="lh-realm-card__name">{r.display_name}</span>
                  <span className="lh-realm-card__hq">{r.guild_headquarters}</span>
                  {isCurrent ? <span className="lh-realm-card__badge">Current</span> : null}
                  {wasHere && !isCurrent ? <span className="lh-realm-card__badge lh-realm-card__badge--muted">Visited</span> : null}
                </button>
              );
            })}
          </div>

          {selected ? (
            <aside className="lh-atlas__detail">
              <h3 className="lh-heading-md">{selected.display_name}</h3>
              <p className="lh-atlas__meta">
                <strong>Career cluster:</strong> {getCareerClusterLabel(selected)}
              </p>
              <p className="lh-atlas__meta">
                <strong>Guild headquarters:</strong> {getGuildHqLabel(selected)}
              </p>
              <section className="lh-atlas__intro" aria-label="Realm introduction">
                <h4 className="lh-heading-sm">Realm introduction</h4>
                <p className="lh-atlas__intro-body">{getRealmIntroBody(selected)}</p>
              </section>
              <section className="lh-atlas__hooks" aria-label="Realm hooks">
                <h4 className="lh-heading-sm">Quest hooks</h4>
                <p className="lh-atlas__meta">{questCount} quest definition(s) reference this realm in fixture data.</p>
              </section>
              <section className="lh-atlas__hooks" aria-label="Realm assets">
                <h4 className="lh-heading-sm">Media bundle (fixture)</h4>
                <p className="lh-atlas__meta">
                  {mediaHits.length} catalog row(s) — global assets plus rows tagged for <code className="lh-code-inline">{selected.realm_id}</code>.
                </p>
                {visited ? (
                  <p className="lh-atlas__meta lh-atlas__meta--success">Exploration progress: entered this realm this session.</p>
                ) : (
                  <p className="lh-atlas__meta">Exploration progress: not yet visited this session.</p>
                )}
                {mediaHits.some((m) => isImageLikeMediaKind(m.kind)) ? (
                  <ul className="lh-atlas__media-thumbs" aria-label="Image previews from catalog">
                    {mediaHits
                      .filter((m) => isImageLikeMediaKind(m.kind))
                      .map((m) => (
                        <li key={m.asset_id} className="lh-atlas__media-thumb">
                          <LhCatalogImage
                            assetId={m.asset_id}
                            alt={m.description || m.asset_id}
                            catalog={mediaCatalog}
                            loading="lazy"
                            className="lh-atlas__media-thumb-img"
                          />
                          <span className="lh-atlas__media-thumb-id">{m.asset_id}</span>
                        </li>
                      ))}
                  </ul>
                ) : null}
              </section>
            </aside>
          ) : null}
        </div>
      </div>
    </div>
  );
}
