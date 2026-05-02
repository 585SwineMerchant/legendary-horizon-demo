import type { CSSProperties } from 'react';

import { summarizeInventoryBrief } from '../lib/formatInventoryBrief';

import type { PlayerSave, RealmDefinition } from '../types';

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

type Props = {
  player: PlayerSave;
  realm: RealmDefinition;
  hotspots: ExplorationHotspot[];
  onActivateHotspot: (interactableId: string) => void;
  saveFeedback: SaveFeedback | null;
  onDismissSaveFeedback?: () => void;
  onPause: () => void;
  onOpenQuestLog: () => void;
};

export function ExplorationScreen({
  player,
  realm,
  hotspots,
  onActivateHotspot,
  saveFeedback,
  onDismissSaveFeedback,
  onPause,
  onOpenQuestLog,
}: Props) {
  return (
    <section className="lh-exploration">
      <header className="lh-exploration__topbar">
        <div>
          <p className="lh-exploration__eyebrow">{realm.display_name}</p>
          <h2 className="lh-heading-lg">Exploration • Tiled trigger slice</h2>
        </div>
        <div className="lh-stack lh-stack--horizontal">
          <button type="button" className="lh-button lh-button--secondary" onClick={onOpenQuestLog}>
            Quest Log
          </button>
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
          <div className="lh-map-caption">{realm.lore_digest}</div>
          <div className="lh-map-footprint" aria-hidden>
            <span>{realm.map_tiled_export ?? 'aethelwood_demo.json'}</span>
          </div>

          {hotspots.length === 0 ? (
            <p className="lh-map-caption lh-map-caption--hint">
              No lh_* triggers parsed yet. Export an object layer from Tiled to populate interactions.
            </p>
          ) : null}

          {hotspots.map((hotspot) => (
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
          ))}

          <div className="lh-map-caption lh-map-caption--hint">
            Boxes mirror Tiled object bounds scaled to percent width/height. Later pass: sprite layers + occlusion.
          </div>

          {saveFeedback ? (
            <div
              className={
                saveFeedback.tone === 'success' ? 'lh-toast lh-toast--success' : 'lh-toast lh-toast--error'
              }
              role="status"
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
    </section>
  );
}
