// =============================================================================
// game.js — Phaser.Game config and browser console test hooks
// =============================================================================

const phaserGame = new Phaser.Game({
  type:            Phaser.CANVAS,
  width:           960,
  height:          600,
  backgroundColor: "#0d0905",
  parent:          "game-container",
  scale: {
    mode:       Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [BootScene, CharacterCreationScene, MainGameScene]
});

// =============================================================================
// Browser console test hooks
//
//   _qof.state()          → the live GameState object
//   _qof.sheet()          → the CharacterSheet
//   _qof.inventory()      → the Inventory instance
//   _qof.save()           → manual save
//   _qof.clearSave()      → wipe save and reload (new game)
//   _qof.skipToGame(name) → dev skip: mock sheet → MainGameScene
//   _qof.addItem(opts)    → add a test item to inventory
//   _qof.dumpSave()       → log full save JSON to console
// =============================================================================
window._qof = {
  state()    { return phaserGame.registry.get("gameState"); },
  sheet()    { return phaserGame.registry.get("characterSheet"); },
  inventory(){ return phaserGame.registry.get("inventory"); },

  save() {
    const s = this.state();
    if (!s) return console.warn("No active GameState to save.");
    const payload = s.save();
    console.log("Saved:", payload);
    return payload;
  },

  clearSave() {
    SaveManager.clear();
    console.log("Save cleared — reloading...");
    location.reload();
  },

  // Jump straight to MainGameScene with mock character data (dev shortcut)
  skipToGame(name) {
    const mockSheet = MockData.getSheet(name);
    const state     = GameState.fresh();
    state.characterSheet = mockSheet;
    state.inventory.addItem(createScrollItem(mockSheet));
    state.save();

    phaserGame.registry.set("gameState",      state);
    phaserGame.registry.set("characterSheet", mockSheet);
    phaserGame.registry.set("inventory",      state.inventory);

    // Shut down CC scene overlay if active
    const ccScene = phaserGame.scene.getScene("CharacterCreationScene");
    if (ccScene && ccScene.sys.isActive()) ccScene.shutdown();
    phaserGame.canvas.style.display = "block";

    phaserGame.scene.start("MainGameScene");
    console.log("Skipped to MainGameScene as:", mockSheet.getDisplayName());
  },

  addItem(opts = {}) {
    const inv = this.inventory();
    if (!inv) return console.warn("No inventory loaded.");
    const item = new Item({
      id:          opts.id          || `item_${Date.now()}`,
      name:        opts.name        || "Test Item",
      type:        opts.type        || "misc",
      icon:        opts.icon        || "📦",
      description: opts.description || "A mysterious item added via the console.",
      data:        opts.data        || {}
    });
    inv.addItem(item);
    console.log("Added item:", item);
    return item;
  },

  dumpSave() {
    const raw = SaveManager.export();
    console.log(raw ? JSON.parse(raw) : "(no save)");
    return raw ? JSON.parse(raw) : null;
  }
};

console.log(
  "%c Quest of Fate — Dev Console %c\n" +
  "  _qof.state()         → GameState\n" +
  "  _qof.sheet()         → CharacterSheet\n" +
  "  _qof.inventory()     → Inventory\n" +
  "  _qof.skipToGame()    → jump to game with mock data\n" +
  "  _qof.clearSave()     → wipe save + reload\n" +
  "  _qof.addItem({...})  → add a test item\n" +
  "  _qof.dumpSave()      → log full save JSON",
  "background:#1a0e00;color:#f0d060;font-weight:bold;padding:4px 8px",
  "color:#c9a227"
);
