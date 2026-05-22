// =============================================================================
// BootScene.js — First scene. Checks for an existing save and routes accordingly.
//
// Flow:
//   save exists  → restore GameState → MainGameScene
//   no save      → CharacterCreationScene
//
// INTEGRATION_POINT: Add asset preloading (tilesets, audio, sprites) here.
// INTEGRATION_POINT: Add a loading progress bar in create() before the route.
// =============================================================================

class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "BootScene" });
  }

  preload() {
    // INTEGRATION_POINT: preload shared assets here before any scene renders
    // this.load.image('tileset', 'assets/tileset.png');
    // this.load.audio('ambient', 'assets/audio/ambient.mp3');
  }

  create() {
    if (SaveManager.exists()) {
      const state = GameState.load();

      if (state && state.characterSheet) {
        // Valid save — restore and go to game
        this._mountState(state);
        console.log(
          `[BootScene] Restored save for "${state.characterSheet.getDisplayName()}" ` +
          `(playtime: ${state.formattedPlaytime()}, saved: ${state.savedAt})`
        );
        this.scene.start("MainGameScene");
        return;
      }

      // Save exists but has no characterSheet — treat as corrupted / incomplete
      console.warn("[BootScene] Save found but characterSheet missing — starting fresh.");
      SaveManager.clear();
    }

    this.scene.start("CharacterCreationScene");
  }

  _mountState(state) {
    // Populate Phaser registry so every scene can access these without imports
    this.registry.set("gameState",       state);
    this.registry.set("characterSheet",  state.characterSheet);
    this.registry.set("inventory",       state.inventory);
  }
}
