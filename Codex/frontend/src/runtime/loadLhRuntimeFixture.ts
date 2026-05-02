import playerJson from '@samples/player_save.json';
import questsJson from '@samples/quests.json';
import realmJson from '@samples/realm_definition.json';
import rosterJson from '@samples/roster_entry.json';
import assetsJson from '@samples/media_assets.json';
import tiledMapJson from '@maps/aethelwood_demo.json';

import type {
  LhRuntimeFixture,
  QuestDefinition,
  RealmDefinition,
  RosterStudentRecord,
  PlayerSave,
  MediaAssetRecord,
} from '../domain/lh-contract';

/** Deep-clone JSON-backed shapes so downstream systems can mutate without aliasing fixtures. */
function lhCloneFixture<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/**
 * Canonical Day 2 loader — centralises SPA binding + Apps Script parity testing fixtures.
 */
export function loadLhRuntimeFixture(): LhRuntimeFixture {
  const realm = lhCloneFixture(realmJson as RealmDefinition);
  const mapFile = realm.map_tiled_export ?? 'aethelwood_demo.json';

  return {
    player: lhCloneFixture(playerJson as PlayerSave),
    quests: lhCloneFixture(questsJson as QuestDefinition[]),
    realm,
    roster_student: lhCloneFixture(rosterJson as RosterStudentRecord),
    media_assets: lhCloneFixture(assetsJson as MediaAssetRecord[]),
    tiled_demo_map_relative_path: mapFile,
    tiled_map_payload: lhCloneFixture(tiledMapJson as unknown),
  };
}
