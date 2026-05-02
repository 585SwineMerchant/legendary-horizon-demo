import { useCallback, useMemo, useState } from 'react';

import { resolveRosterToPlayerSave } from '../runtime/rosterIdentity';
import { loadLhRuntimeFixture } from '../runtime/loadLhRuntimeFixture';
import type { ExplorationHotspot } from '../screens/ExplorationScreen';
import type { ParsedLhTrigger } from '../maps/parseLhTiledMap';
import { makeTriggerInteractableId, parseLhTiledMap } from '../maps/parseLhTiledMap';
import {
  buildManualSaveEnvelope,
  simulateManualSavePersist,
  validatePlayerForManualSave,
} from '../services/manualSaveGateway';
import { proposeExitTicketComposer, composeMockExitTicketDraft } from '../services/exitTicketHandoff';
import { resolveAssetDeliveryUrl } from '../services/assetCatalog';

import { buildResumeDialogBody } from '../lib/buildResumeDialogBody';
import { completeDemoShrineVisit } from '../lib/completeDemoShrineVisit';
import { deepClone } from '../lib/clone';
import type { PlayerSave, QuestDefinition, Screen } from '../types';

const BLUEPRINT = loadLhRuntimeFixture();
const seededPlayerSeed = BLUEPRINT.player;
const seededQuestSeed = BLUEPRINT.quests;

const PARSED_PRIMARY_MAP = BLUEPRINT.tiled_map_payload ? parseLhTiledMap(BLUEPRINT.tiled_map_payload) : null;

export function useNightOneFlow() {
  const mentorPortrait = useMemo(
    () => resolveAssetDeliveryUrl('portrait_mentor_kael_placeholder'),
    [],
  );

  const rosterResolution = useMemo(
    () => resolveRosterToPlayerSave(BLUEPRINT.roster_student, seededPlayerSeed),
    [],
  );

  const realm = BLUEPRINT.realm;

  const [screen, setScreen] = useState<Screen>('title');
  const [player, setPlayer] = useState<PlayerSave | null>(null);
  const [quests, setQuests] = useState<QuestDefinition[]>(() => seededQuestSeed.map(deepClone));

  const [visitedInteractableIds, setVisitedInteractableIds] = useState<string[]>([]);
  const [pauseOpen, setPauseOpen] = useState(false);
  const [questLogOpen, setQuestLogOpen] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<
    | {
        tone: 'success' | 'error';
        text: string;
      }
    | null
  >(null);

  const resumeDialogBody = useMemo(() => {
    if (!player) return '';
    return buildResumeDialogBody(player, realm);
  }, [player, realm]);

  const beginDemo = () => {
    if (!rosterResolution.matched && typeof console !== 'undefined') {
      console.warn(
        '[LhRoster]',
        rosterResolution.reason ?? 'Roster heuristic did not match fixture save — QA only.',
      );
    } else if (typeof console !== 'undefined') {
      console.info('[LhRoster]', 'Matched roster fixture ↔ demo save row:', rosterResolution);
    }

    setPlayer(deepClone(seededPlayerSeed));
    setQuests(seededQuestSeed.map(deepClone));
    setVisitedInteractableIds([]);
    setScreen('instructions');
    setPauseOpen(false);
    setQuestLogOpen(false);
    setSaveFeedback(null);
  };

  const quitToTitle = () => {
    setScreen('title');
    setPauseOpen(false);
    setQuestLogOpen(false);
    setPlayer(null);
    setSaveFeedback(null);
  };

  const handleTriggerActivation = (interactableId: string, triggerMeta: ParsedLhTrigger) => {
    if (!player || visitedInteractableIds.includes(interactableId)) {
      return;
    }

    if (
      triggerMeta.kind !== 'quest_advance' ||
      !triggerMeta.target_quest_id ||
      triggerMeta.target_quest_id !== player.active_main_quest_id
    ) {
      console.warn('[LhTriggers]', `Unsupported trigger configuration for demo slice: ${triggerMeta.kind}`);
      return;
    }

    const { nextPlayer, nextQuests } = completeDemoShrineVisit(
      player,
      quests,
      seededPlayerSeed.active_main_quest_id,
    );

    setPlayer(nextPlayer);
    setQuests(nextQuests);
    setVisitedInteractableIds((curr) =>
      curr.includes(interactableId) ? curr : [...curr, interactableId],
    );
  };

  const explorationHotspots: ExplorationHotspot[] = useMemo(() => {
    if (!PARSED_PRIMARY_MAP?.triggers.length) {
      return [];
    }

    const { footprint, triggers } = PARSED_PRIMARY_MAP;

    const widthDen = footprint.width_px || 1;
    const heightDen = footprint.height_px || 1;

    const relevant = triggers.filter((hit) => hit.kind === 'quest_advance');

    return relevant.map((trigger) => {
      const interactableId = makeTriggerInteractableId(realm.realm_id, trigger.tiled_object_id);
      const completed = visitedInteractableIds.includes(interactableId);
      const { bounds } = trigger;

      return {
        interactable_id: interactableId,
        label_active: trigger.interaction_label_active,
        label_complete: trigger.interaction_label_complete,
        completed,
        style: {
          position: 'absolute',
          left: `${Math.max((bounds.x / widthDen) * 100, 0)}%`,
          top: `${Math.max((bounds.y / heightDen) * 100, 0)}%`,
          width: `${Math.min((bounds.width / widthDen) * 100, 100)}%`,
          height: `${Math.min((bounds.height / heightDen) * 100, 100)}%`,
        },
      };
    });
  }, [realm.realm_id, visitedInteractableIds]);

  const hotspotIndex = useMemo(() => {
    const map = new Map<string, ParsedLhTrigger>();
    (PARSED_PRIMARY_MAP?.triggers ?? []).forEach((trigger) => {
      map.set(makeTriggerInteractableId(realm.realm_id, trigger.tiled_object_id), trigger);
    });
    return map;
  }, [realm.realm_id]);

  const handleManualSave = useCallback(async () => {
    if (!player) return;

    const validation = validatePlayerForManualSave(player);
    if (validation.length) {
      setSaveFeedback({ tone: 'error', text: validation.join('\n') });
      return;
    }

    const envelope = buildManualSaveEnvelope({
      player,
      questsSnapshot: quests,
      realmId: realm.realm_id,
      visitedTriggerInteractableIds: visitedInteractableIds,
    });

    const persist = await simulateManualSavePersist(envelope);
    setPauseOpen(false);

    if (!persist.ok || !persist.revision) {
      setSaveFeedback({
        tone: 'error',
        text: persist.message + (persist.errors ? `\n${persist.errors.join('\n')}` : ''),
      });
      return;
    }

    const mergedPlayer: PlayerSave = {
      ...player,
      revision_token: persist.revision ?? player.revision_token,
      last_manual_save_iso: envelope.saved_at_iso,
    };

    setPlayer(mergedPlayer);

    const exitDraft = composeMockExitTicketDraft({
      player: mergedPlayer,
      roster_student: BLUEPRINT.roster_student,
      envelope,
    });

    proposeExitTicketComposer(exitDraft);

    setSaveFeedback({
      tone: 'success',
      text: [
        persist.message,
        '',
        exitDraft.summary,
        '',
        'Next: wire SaveService ⇄ Sheets, then GmailApp templating replaces mailto scaffolding.',
      ].join('\n'),
    });
  }, [player, quests, realm.realm_id, visitedInteractableIds]);

  const dismissSaveFeedback = () => setSaveFeedback(null);

  return {
    screen,
    realm,
    player,
    quests,
    mentorPortrait,
    resumeDialogBody,
    rosterResolution,
    visitedInteractableIds,
    pauseOpen,
    questLogOpen,
    saveFeedback,
    explorationHotspots,

    navigate: {
      beginDemo,
      quitToTitle,
      proceedInstructions: () => setScreen('resume'),
      resumeToExplore: () => setScreen('explore'),
      openPause: () => setPauseOpen(true),
      closePause: () => setPauseOpen(false),
      openQuestLog: () => setQuestLogOpen(true),
      closeQuestLog: () => setQuestLogOpen(false),
      dismissSaveFeedback,
    },

    hotspotControls: {
      activate: (interactableId: string) => {
        const triggerMeta = hotspotIndex.get(interactableId);
        if (!triggerMeta) return;
        handleTriggerActivation(interactableId, triggerMeta);
      },
    },

    handleManualSave,
  };
}
