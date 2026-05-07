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
  | { tone: 'success'; text: string; retryLabel?: string; onRetry?: () => void }
  | { tone: 'error'; text: string; retryLabel?: string; onRetry?: () => void };

type Act3Strip = {
  activeWaypointLabel: string | null;
  fogCleared: number;
  fogTotal: number;
  waypointVisited: number;
  waypointTotal: number;
  /** Distinct Foretold Signpost realms with ≥1 ledger row vs three (when Scroll defines a triad). */
  scrollLedgerMilestone: { covered: number; total: number } | null;
  /** Opens the full-screen World Atlas (Fog map), not the charter / ledger overlay. */
  onOpenWorldAtlas: () => void;
  onMarkWaypoint: () => void;
};

type Props = {
  player: PlayerSave;
  realm: RealmDefinition;
  /** Stable realm prefix for primary-map trigger IDs (independent of guild `realm`). */
  phaserSurfaceTriggerRealmId?: string;
  hotspots: ExplorationHotspot[];
  onActivateHotspot: (interactableId: string) => void;
  parsedMap: ParsedLhMap;
  renderer?: 'hotspots' | 'phaser';
  saveFeedback: SaveFeedback | null;
  maiaHandoffActive?: boolean;
  maiaHandoffPromptActive?: boolean;
  onOpenMaiaHandoff?: () => boolean;
  onReturnFromMaiaHandoff?: () => void;
  onDismissSaveFeedback?: () => void;
  onPause: () => void;
  onOpenQuestLog: () => void;
  onOpenInventory?: () => void;
  onOpenDemoClosing?: () => void;
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
  /** Guild endgame — post–GT-101 breather strip (Phaser path has no sidebar HUD). */
  guildBreatherBanner?: { title: string; body: string } | null;
  /** Scroll of Destiny — Foretold Signpost realm labels (exploration direction). */
  signpostStrip?: { labels: string[] } | null;
};

export function ExplorationScreen({
  player,
  realm,
  phaserSurfaceTriggerRealmId,
  hotspots,
  onActivateHotspot,
  parsedMap,
  renderer = 'hotspots',
  saveFeedback,
  maiaHandoffActive = false,
  maiaHandoffPromptActive = false,
  onOpenMaiaHandoff,
  onReturnFromMaiaHandoff,
  onDismissSaveFeedback,
  onPause,
  onOpenQuestLog,
  onOpenInventory,
  onOpenDemoClosing,
  act3,
  mapDebug,
  activeQuestDefinition,
  questDebug,
  npcDialogue,
  onDismissNpcDialogue,
  activeEncounter,
  onEncounterWin,
  onEncounterRetreat,
  guildBreatherBanner,
  signpostStrip,
}: Props) {
  useEscapeToClose(Boolean(npcDialogue), onDismissNpcDialogue ?? (() => undefined));
  useEscapeToClose(Boolean(activeEncounter), onEncounterRetreat ?? (() => undefined));
  const showTiledHotspots = Boolean(realm.map_tiled_export);
  const usePhaser = renderer === 'phaser';
  const phaserTriggerRealmId = phaserSurfaceTriggerRealmId ?? realm.realm_id;

  return (
    <section className="lh-exploration" style={{ position: 'relative' }}>
      <header className="lh-exploration__topbar" style={usePhaser ? { position: 'relative', zIndex: 10 } : undefined}>
        <div>
          <p className="lh-exploration__eyebrow">Guild focus — {realm.display_name}</p>
          {signpostStrip?.labels?.length ? (
            <p className="lh-exploration__signpost-line" role="note">
              <strong>Scroll signposts:</strong> {signpostStrip.labels.join(' · ')}
            </p>
          ) : null}
          {usePhaser && act3?.scrollLedgerMilestone ? (
            <p className="lh-exploration__scroll-ledger-line" role="status">
              <strong>Scroll ledger:</strong> {act3.scrollLedgerMilestone.covered} / {act3.scrollLedgerMilestone.total}{' '}
              signpost realms documented (world map ledger). Other realms stay explorable.
            </p>
          ) : null}
          <h2 className="lh-heading-lg">{usePhaser ? 'Legendary Horizon' : 'Exploration • Tiled trigger slice'}</h2>
        </div>
        <div className="lh-stack lh-stack--horizontal lh-exploration__actions">
          {act3 ? (
            <button type="button" className="lh-button lh-button--secondary" onClick={act3.onOpenWorldAtlas}>
              World Atlas
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
          {onOpenDemoClosing ? (
            <button type="button" className="lh-button lh-button--secondary" onClick={onOpenDemoClosing}>
              Return to Maia
            </button>
          ) : null}
          <button type="button" className="lh-button lh-button--primary" onClick={onPause}>
            Pause
          </button>
        </div>
      </header>

      {usePhaser && guildBreatherBanner ? (
        <aside className="lh-exploration__breather-strip" role="status" aria-live="polite">
          <p className="lh-exploration__breather-strip-title">{guildBreatherBanner.title}</p>
          <p className="lh-exploration__breather-strip-body">{guildBreatherBanner.body}</p>
        </aside>
      ) : null}

      {usePhaser ? (
        <PhaserExplorationView
          realmId={phaserTriggerRealmId}
          parsedMap={parsedMap}
          hotspots={hotspots}
          onActivateHotspot={onActivateHotspot}
        />
      ) : null}

      {usePhaser && saveFeedback ? (
        <div
          className={`lh-toast lh-toast--${saveFeedback.tone === 'success' ? 'success' : 'error'} lh-exploration__phaser-toast`}
          style={{ position: 'relative', zIndex: 20, margin: '0 1rem 1rem' }}
          role={saveFeedback.tone === 'error' ? 'alert' : 'status'}
        >
          <pre className="lh-toast__preformatted">{saveFeedback.text}</pre>
          <div className="lh-stack lh-stack--horizontal" style={{ justifyContent: 'flex-end', marginTop: 8 }}>
            {saveFeedback.onRetry ? (
              <button
                type="button"
                className="lh-button lh-button--secondary lh-button--small"
                onClick={saveFeedback.onRetry}
              >
                {saveFeedback.retryLabel ?? 'Retry'}
              </button>
            ) : null}
            {onDismissSaveFeedback ? (
              <button
                type="button"
                className="lh-button lh-button--ghost lh-toast__dismiss"
                onClick={onDismissSaveFeedback}
              >
                Dismiss
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {maiaHandoffActive ? (
        <div className="lh-maia-handoff-lock" role="dialog" aria-modal="true" aria-live="polite">
          <div className="lh-maia-handoff-lock__panel">
            <p className="lh-exploration__eyebrow">Mirror of Maia</p>
            <h3 className="lh-heading-md">Maia handoff in progress</h3>
            <p>
              Gameplay is paused while the student completes the Maia step. Close the Maia window, or use the demo
              return when presenting in a browser that blocks new windows.
            </p>
            {onReturnFromMaiaHandoff ? (
              <button type="button" className="lh-button lh-button--secondary" onClick={onReturnFromMaiaHandoff}>
                I closed Maia — return to the game
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {maiaHandoffPromptActive && !maiaHandoffActive ? (
        <div className="lh-maia-handoff-lock" role="dialog" aria-modal="true" aria-live="polite">
          <div className="lh-maia-handoff-lock__panel">
            <p className="lh-exploration__eyebrow">Mirror of Maia</p>
            <h3 className="lh-heading-md">Step through to Maia</h3>
            <p>
              Tap <strong>Open Maia</strong> to sign in (one new tab). If the tab does not appear, allow popups for this
              site and try again.
            </p>
            <div className="lh-maia-handoff-lock__actions">
              {onOpenMaiaHandoff ? (
                <button type="button" className="lh-button lh-button--primary" onClick={() => onOpenMaiaHandoff()}>
                  Open Maia
                </button>
              ) : null}
              {onReturnFromMaiaHandoff ? (
                <button type="button" className="lh-button lh-button--secondary" onClick={onReturnFromMaiaHandoff}>
                  Return to game
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {!usePhaser ? <div className="lh-exploration__body">
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
              {act3.scrollLedgerMilestone ? (
                <div className="lh-act3-strip__row">
                  <span className="lh-act3-strip__label">Scroll ledger</span>
                  <span className="lh-act3-strip__value">
                    {act3.scrollLedgerMilestone.covered} / {act3.scrollLedgerMilestone.total} signpost realms
                  </span>
                </div>
              ) : null}
            </div>
          ) : null}

          {!showTiledHotspots ? (
            <p className="lh-map-caption lh-map-caption--hint">
              This guild row has no optional hotspot export — use the World map for HQ research, or follow objectives in
              the quest log. The shared explorable map uses the primary world export.
            </p>
          ) : hotspots.length === 0 ? (
            <p className="lh-map-caption lh-map-caption--hint">
              No lh_* triggers parsed yet. Export an object layer from Tiled to populate interactions.
            </p>
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
              <div className="lh-stack lh-stack--horizontal" style={{ justifyContent: 'flex-end', marginTop: 8 }}>
                {saveFeedback.onRetry ? (
                  <button
                    type="button"
                    className="lh-button lh-button--secondary lh-button--small"
                    onClick={saveFeedback.onRetry}
                  >
                    {saveFeedback.retryLabel ?? 'Retry'}
                  </button>
                ) : null}
                {onDismissSaveFeedback ? (
                  <button
                    type="button"
                    className="lh-button lh-button--ghost lh-toast__dismiss"
                    onClick={onDismissSaveFeedback}
                  >
                    Dismiss
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </div> : null}

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
