/** Window events between React (`useNightOneFlow`) and `PhaserExplorationView` for guild HQ research flow. */
export const LH_WINDOW_PHASER_GUILD_RESEARCH_ABORT = 'lh:phaser-guild-research-abort';
export const LH_WINDOW_PHASER_GUILD_RESEARCH_EXIT = 'lh:phaser-guild-research-exit';

/** Emitted by Phaser every ~10 s and on pause; React listens to persist the spawn point. */
export const LH_WINDOW_PHASER_PLAYER_POSITION = 'lh:phaser-player-position';

export type LhPhaserPlayerPositionDetail = { x: number; y: number };

export type LhPhaserGuildResearchBridgeDetail = {
  interactableId: string;
  /** When `blocked`, keep the trigger latched + apply cooldown so overlap_auto doesn't loop. */
  mode?: 'blocked' | 'abort';
};
