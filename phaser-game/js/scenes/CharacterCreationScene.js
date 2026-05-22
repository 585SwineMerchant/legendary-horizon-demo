// =============================================================================
// CharacterCreationScene.js — Embeds the DOM-based character creation ritual
//
// Strategy: hide the Phaser canvas, mount a full-screen DOM overlay, run
// MasterScribeController inside it, capture the completed CharacterSheet,
// then remove the overlay and hand off to MainGameScene.
//
// INTEGRATION_POINT: The `onComplete` callback (line ~55) is where the
// CharacterSheet is first available. Insert any server-sync here before
// calling _onRitualComplete().
// =============================================================================

class CharacterCreationScene extends Phaser.Scene {
  constructor() {
    super({ key: "CharacterCreationScene" });
    this._overlay    = null;
    this._controller = null;
  }

  create() {
    // Hide the canvas — the DOM overlay takes the full viewport
    this.game.canvas.style.display = "none";

    this._overlay = document.createElement("div");
    this._overlay.id = "cc-overlay";
    document.body.appendChild(this._overlay);

    this._controller = new MasterScribeController(this._overlay);

    // INTEGRATION_POINT: swap this onComplete for a Maia API call if needed.
    // The callback receives the fully-populated CharacterSheet.
    this._controller.onComplete = (sheet) => this._onRitualComplete(sheet);

    this._controller.start();
  }

  _onRitualComplete(sheet) {
    // Build initial game state
    const state = GameState.fresh();
    state.characterSheet = sheet;
    state.inventory.addItem(createScrollItem(sheet));

    // Persist immediately — player's first save
    state.save();

    // Populate registry for all future scenes
    this.registry.set("gameState",      state);
    this.registry.set("characterSheet", sheet);
    this.registry.set("inventory",      state.inventory);

    // Tear down the overlay and restore the canvas
    this._cleanup();

    this.scene.start("MainGameScene");
  }

  _cleanup() {
    if (this._overlay) {
      this._overlay.remove();
      this._overlay = null;
    }
    this.game.canvas.style.display = "block";
  }

  // Called if the scene is shut down externally (e.g. dev skip)
  shutdown() {
    this._cleanup();
  }
}
