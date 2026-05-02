import academicTasksJson from '@samples/academic_worksheet_tasks.json';
import dialogueCatalogJson from '@samples/dialogue_catalog.json';
import npcRegistryJson from '@samples/npc_registry.json';
import playerJson from '@samples/player_save.json';
import questsJson from '@samples/quests.json';
import realmRegistryJson from '@samples/realm_registry.json';
import rosterJson from '@samples/roster_entry.json';
import assetsJson from '@samples/media_assets.json';
import tiledMapJson from '@maps/aethelwood_demo.json';

import type {
  LhRuntimeFixture,
  RealmDefinition,
  RosterStudentRecord,
  PlayerSave,
  MediaAssetRecord,
} from '../domain/lh-contract';
import type { LhDialogueCatalogV1, LhNpcRegistryV1 } from '../domain/lh-dialogue';

import { loadAcademicWorksheetCatalog } from '../academic/academicCatalog';
import { loadQuestDefinitionsFromJson, reconcileQuestPrerequisites } from '../quests/questEngine';
import { resolveActiveRealm } from '../realm/realmRegistry';

/** Deep-clone JSON-backed shapes so downstream systems can mutate without aliasing fixtures. */
function lhCloneFixture<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/**
 * Canonical loader — centralises SPA binding + Apps Script parity testing fixtures.
 */
export function loadLhRuntimeFixture(): LhRuntimeFixture {
  const realms = lhCloneFixture(realmRegistryJson as RealmDefinition[]);
  const player = lhCloneFixture(playerJson as PlayerSave);
  const realm = resolveActiveRealm(realms, player.current_realm_id);
  const mapFile = realm.map_tiled_export ?? 'aethelwood_demo.json';

  return {
    player,
    quests: reconcileQuestPrerequisites(loadQuestDefinitionsFromJson(lhCloneFixture(questsJson))),
    realm,
    realms,
    roster_student: lhCloneFixture(rosterJson as RosterStudentRecord),
    media_assets: lhCloneFixture(assetsJson as MediaAssetRecord[]),
    npc_registry: lhCloneFixture(npcRegistryJson as LhNpcRegistryV1),
    dialogue_catalog: lhCloneFixture(dialogueCatalogJson as LhDialogueCatalogV1),
    academic_worksheet_tasks: loadAcademicWorksheetCatalog(lhCloneFixture(academicTasksJson)),
    tiled_demo_map_relative_path: mapFile,
    tiled_map_payload: lhCloneFixture(tiledMapJson as unknown),
  };
}
