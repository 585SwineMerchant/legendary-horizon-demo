import type { CSSProperties } from 'react';

import { DialogueBox } from '../components/DialogueBox';
import { EncounterOverlay, type EncounterLaunchPayload } from '../components/EncounterOverlay';
import { MapDebugPanel } from '../components/MapDebugPanel';
import { QuestDebugPanel } from '../components/QuestDebugPanel';
import type { LhNpcDialogueOverlayModel } from '../dialogue/npcDialogueOverlayModel';
import { useEscapeToClose } from '../hooks/useEscapeToClose';
import { summarizeInventoryBrief } from '../lib/formatInventoryBrief';
import type { ParsedLhMap } from '../maps/parseLhTiledMap';
import { PhaserExplorationView } from '../rendering/PhaserExplorationView';

import type { PlayerSave, QuestDefinition, RealmDefinition } from '../types';

export type ExplorationHotspot = {
  interactable_id: string;
  label_active: string;
  label_complete: string;
  completed: boolean;
  style: CSSProperties;
};

type SaveFeedback =
  | { tone: 'success'; text: string }
  | { tone: 'error'; text: string };

type Act3Strip = {
  activeWaypointLabel: string | null;
  fogCleared: number;
  fogTotal: number;
  waypointVisited: number;
  waypointTotal: number;
  onOpenWorldMap: () => void;
  onMarkWaypoint: () => void;
};

type Props = {
  player: PlayerSave;
  realm: RealmDefinition;
  hotspots: ExplorationHotspot[];
  onActivateHotspot: (interactableId: string) => void;
  parsedMap: ParsedLhMap;
  renderer?: 'hotspots' | 'phaser';
  saveFeedback: SaveFeedback | null;
  onDismissSaveFeedback?: () => void;
  onPause: () => void;
  onOpenQuestLog: () => void;
  onOpenInventory?: () => void;
  /** Milestone 7 — Act III exploration loop summary + world map entry. */
  act3?: Act3Strip | null;
  /** Milestone 4 — when set, shows collapsible parsed Tiled structures (dev / `VITE_LH_MAP_DEBUG`). */
  mapDebug?: { parsed: ParsedLhMap; loadErrors: string[] } | null;
  /** Milestone 10 — active main quest row for prerequisite display. */
  activeQuestDefinition?: QuestDefinition | null;
  /** Milestone 10 — raw quest JSON (dev / `VITE_LH_QUEST_DEBUG`). */
  questDebug?: { quests: QuestDefinition[] } | null;
  /** Milestone 16 — in-world NPC line resolved from dialogue catalog + quest state. */
  npcDialogue?: LhNpcDialogueOverlayModel | null;
  onDismissNpcDialogue?: () => void;
  /** Milestone 17 — combat + vocab micro-encounters from Tiled triggers. */
  activeEncounter?: EncounterLaunchPayload | null;
  onEncounterWin?: (summary: { requestedXp: number }) => void;
  onEncounterRetreat?: () => void;
};

export function ExplorationScreen({
  player,
  realm,
  hotspots,
  onActivateHotspot,
  parsedMap,
  renderer = 'hotspots',
  saveFeedback,
  onDismissSaveFeedback,
  onPause,
  onOpenQuestLog,
  onOpenInventory,
  act3,
  mapDebug,
  activeQuestDefinition,
  questDebug,
  npcDialogue,
  onDismissNpcDialogue,
  activeEncounter,
  onEncounterWin,
  onEncounterRetreat,
}: Props) {
  useEscapeToClose(Boolean(npcDialogue), onDismissNpcDialogue ?? (() => undefined));
  useEscapeToClose(Boolean(activeEncounter), onEncounterRetreat ?? (() => undefined));
  const showTiledHotspots = Boolean(realm.map_tiled_export);
  const usePhaser = renderer === 'phaser' && showTiledHotspots;

  return (
    <section className="lh-exploration">
      <header className="lh-exploration__topbar">
        <div>
          <p className="lh-exploration__eyebrow">{realm.display_name}</p>
          <h2 className="lh-heading-lg">Exploration • Tiled trigger slice</h2>
        </div>
        <div className="lh-stack lh-stack--horizontal lh-exploration__actions">
          {act3 ? (
            <button type="button" className="lh-button lh-button--secondary" onClick={act3.onOpenWorldMap}>
              World map
            </button>
          ) : null}
          <button type="button" className="lh-button lh-button--secondary" onClick={onOpenQuestLog}>
            Quest log
          </button>
          {onOpenInventory ? (
            <button type="button" className="lh-button lh-button--secondary" onClick={onOpenInventory}>
              Inventory
            </button>
          ) : null}
          <button type="button" className="lh-button lh-button--primary" onClick={onPause}>
            Pause
          </button>
        </div>
      </header>

      <div className="lh-exploration__body">
        <aside className="lh-hud-card">
          <h3 className="lh-heading-md">{player.display_name}</h3>
          <dl className="lh-hud-grid">
            <div>
              <dt>Current act</dt>
              <dd>Act {player.current_act}</dd>
            </div>
            <div>
              <dt>Realm</dt>
              <dd>{realm.display_name}</dd>
            </div>
            <div>
              <dt>Experience</dt>
              <dd>
                Lv.&nbsp;{player.level_cached} · {player.xp_total.toLocaleString()} XP
              </dd>
            </div>
            <div>
              <dt>Active quest</dt>
              <dd>{player.active_main_quest_title}</dd>
            </div>
            <div>
              <dt>Directive</dt>
              <dd>{player.required_next_action}</dd>
            </div>
            {activeQuestDefinition?.prerequisite_quest_ids?.length ? (
              <div>
                <dt>Quest prerequisites</dt>
                <dd className="lh-hud-multiline">{activeQuestDefinition.prerequisite_quest_ids.join(', ')}</dd>
              </div>
            ) : null}
            <div>
              <dt>Inventory gist</dt>
              <dd className="lh-hud-multiline">{player.inventory_summary.notes_for_teacher_preview ?? '—'}</dd>
            </div>
            <div>
              <dt>Carrying</dt>
              <dd className="lh-hud-multiline">{summarizeInventoryBrief(player.inventory_summary)}</dd>
            </div>
          </dl>
        </aside>

        <div className="lh-map-board" aria-label="Tiled waypoint board (percent-positioned hotspots)">
          <div className="lh-map-board__chrome lh-density-hide" aria-label="Map legend">
            <div className="lh-map-board__chrome-row">
              <span className="lh-map-board__badge">Map layer</span>
              <span className="lh-map-board__legend">Bright buttons = active · dim = finished</span>
            </div>
            <p className="lh-map-board__file">
              Export: <code className="lh-code-inline">{realm.map_tiled_export ?? '—'}</code>
            </p>
          </div>
          <div className="lh-map-caption">{realm.lore_digest}</div>
          <div className="lh-map-footprint lh-density-hide" aria-hidden>
            <span>Hotspots use the same bounds as object rectangles in Tiled.</span>
          </div>

          {act3 ? (
            <div className="lh-act3-strip" role="region" aria-label="Act III exploration status">
              <div className="lh-act3-strip__row">
                <span className="lh-act3-strip__label">Active waypoint</span>
                <span className="lh-act3-strip__value">
                  {act3.activeWaypointLabel ?? '—'}
                  {act3.waypointTotal > 0 && act3.activeWaypointLabel ? (
                    <button type="button" className="lh-button lh-button--ghost lh-button--small" onClick={act3.onMarkWaypoint}>
                      Mark visited
                    </button>
                  ) : null}
                </span>
              </div>
              <div className="lh-act3-strip__row">
                <span className="lh-act3-strip__label">Fog cleared</span>
                <span className="lh-act3-strip__value">
                  {act3.fogTotal ? `${act3.fogCleared} / ${act3.fogTotal}` : '—'}
                </span>
              </div>
              <div className="lh-act3-strip__row">
                <span className="lh-act3-strip__label">Waypoints logged</span>
                <span className="lh-act3-strip__value">
                  {act3.waypointTotal ? `${act3.waypointVisited} / ${act3.waypointTotal}` : '—'}
                </span>
              </div>
            </div>
          ) : null}

          {!showTiledHotspots ? (
            <p className="lh-map-caption lh-map-caption--hint">
              This realm has no Tiled export bound yet — use the World map to visit another zone or continue narrative
              objectives from the quest log.
            </p>
          ) : hotspots.length === 0 ? (
            <p className="lh-map-caption lh-map-caption--hint">
              No lh_* triggers parsed yet. Export an object layer from Tiled to populate interactions.
            </p>
          ) : null}

          {usePhaser ? (
            <PhaserExplorationView
              realmId={realm.realm_id}
              parsedMap={parsedMap}
              hotspots={hotspots}
              onActivateHotspot={onActivateHotspot}
            />
          ) : null}

          {showTiledHotspots && !usePhaser
            ? hotspots.map((hotspot) => (
                <button
                  key={hotspot.interactable_id}
                  type="button"
                  style={hotspot.style}
                  className={`lh-trigger-hotspot ${hotspot.completed ? 'lh-trigger-hotspot--done' : ''}`}
                  disabled={hotspot.completed}
                  onClick={() => onActivateHotspot(hotspot.interactable_id)}
                >
                  {hotspot.completed ? hotspot.label_complete : hotspot.label_active}
                </button>
              ))
            : null}

          <div className="lh-map-caption lh-map-caption--hint lh-density-hide">
            Boxes mirror Tiled object bounds scaled to percent width/height. Later pass: sprite layers + occlusion.
          </div>

          {mapDebug ? (
            <MapDebugPanel parsedMap={mapDebug.parsed} loadErrors={mapDebug.loadErrors} />
          ) : null}

          {questDebug ? <QuestDebugPanel quests={questDebug.quests} /> : null}

          {saveFeedback ? (
            <div
              className={`lh-toast lh-toast--${saveFeedback.tone === 'success' ? 'success' : 'error'}`}
              role={saveFeedback.tone === 'error' ? 'alert' : 'status'}
            >
              <pre className="lh-toast__preformatted">{saveFeedback.text}</pre>
              {onDismissSaveFeedback ? (
                <button type="button" className="lh-button lh-button--ghost lh-toast__dismiss" onClick={onDismissSaveFeedback}>
                  Dismiss
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {npcDialogue && onDismissNpcDialogue ? (
        <div className="lh-overlay lh-overlay--dim lh-npc-dialogue-overlay" role="presentation">
          <div className="lh-panel lh-panel--npc-dialogue">
            <DialogueBox
              variant="default"
              title={npcDialogue.title}
              speakerLabel={npcDialogue.speakerLabel}
              portraitUrl={npcDialogue.portraitUrl}
              body={npcDialogue.body}
              primaryLabel="Continue"
              onPrimary={onDismissNpcDialogue}
            />
          </div>
        </div>
      ) : null}

      {activeEncounter && onEncounterWin && onEncounterRetreat ? (
        <EncounterOverlay payload={activeEncounter} onWin={onEncounterWin} onRetreat={onEncounterRetreat} />
      ) : null}
    </section>
  );
}
