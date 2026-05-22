// =============================================================================
// GameState.js — Single source of truth for all persistent game data
//
// The instance lives in the Phaser registry so every scene can reach it:
//   this.registry.get('gameState')
//
// INTEGRATION_POINT: Add quest/dialogue/NPC state here as the game grows.
// All additions automatically persist through the save() / load() round-trip.
// =============================================================================

class GameState {
  constructor() {
    this.characterSheet  = null;         // CharacterSheet | null
    this.inventory       = new Inventory();
    this.questProgress   = {};           // { [questId]: { status, steps, completedAt } }
    this.visitedScenes   = new Set();    // for fog-of-war / first-visit events
    this.playtime        = 0;            // cumulative seconds
    this.savedAt         = null;         // ISO string of last save
    this._sessionStart   = Date.now();
  }

  // --- Save / Load ---

  save() {
    this._tickPlaytime();

    const payload = {
      characterSheet: this.characterSheet
        ? JSON.parse(this.characterSheet.toJSON())
        : null,
      inventory:     this.inventory.toRaw(),
      questProgress: this.questProgress,
      visitedScenes: [...this.visitedScenes],
      playtime:      this.playtime,
      savedAt:       new Date().toISOString()
    };

    SaveManager.save(payload);
    this.savedAt = payload.savedAt;
    return payload;
  }

  static load() {
    const data = SaveManager.load();
    if (!data) return null;

    const state = new GameState();

    if (data.characterSheet) {
      state.characterSheet = new CharacterSheet().fromJSON(data.characterSheet);
    }

    state.inventory      = Inventory.fromRaw(data.inventory || []);
    state.questProgress  = data.questProgress  || {};
    state.visitedScenes  = new Set(data.visitedScenes || []);
    state.playtime       = data.playtime || 0;
    state.savedAt        = data.savedAt  || null;

    return state;
  }

  // Creates a pristine GameState for a new game
  static fresh() {
    return new GameState();
  }

  // --- Scene tracking (for first-visit dialogue triggers) ---

  markVisited(sceneName) {
    this.visitedScenes.add(sceneName);
  }

  hasVisited(sceneName) {
    return this.visitedScenes.has(sceneName);
  }

  // --- Quest helpers ---
  // INTEGRATION_POINT: called by QuestSystem when a quest changes state
  updateQuest(questId, patch) {
    this.questProgress[questId] = {
      ...(this.questProgress[questId] || {}),
      ...patch,
      updatedAt: new Date().toISOString()
    };
  }

  getQuestStatus(questId) {
    return this.questProgress[questId] || null;
  }

  // --- Utilities ---

  formattedPlaytime() {
    const s = this.playtime + Math.floor((Date.now() - this._sessionStart) / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return h > 0
      ? `${h}h ${m}m`
      : `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }

  _tickPlaytime() {
    const now = Date.now();
    this.playtime += Math.floor((now - this._sessionStart) / 1000);
    this._sessionStart = now;
  }
}
