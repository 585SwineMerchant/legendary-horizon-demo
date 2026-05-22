// =============================================================================
// MainGameScene.js — The persistent game world. Loaded after character creation.
//
// INTEGRATION_POINT: Replace the placeholder world with Tiled map, sprites,
// NPC dialogue system, etc. The character data and inventory are already
// available via this.registry.
// =============================================================================

const SIGNPOST_COLORS = [0xf0d060, 0xc0c8d0, 0xa07860];  // gold, silver, bronze
const SIGNPOST_LABELS = ["Primary Path", "Secondary Path", "Hidden Path"];

class MainGameScene extends Phaser.Scene {
  constructor() {
    super({ key: "MainGameScene" });
    this._inventoryScreen = null;
    this._autoSaveTimer   = null;
    this._saveIndicator   = null;
    this._playtimeText    = null;
  }

  create() {
    const state = this.registry.get("gameState");
    const sheet = this.registry.get("characterSheet");

    state.markVisited("MainGameScene");

    const W = this.scale.width;
    const H = this.scale.height;

    this._buildBackground(W, H);
    this._buildStarField(W, H);
    this._buildUI(sheet, W, H);
    this._buildSignposts(sheet, W, H);
    this._buildHUD(state, W, H);
    this._setupInput();
    this._startAutoSave(state);

    // INTEGRATION_POINT: initialize dialogue system, quest system, NPC manager
    // e.g. this.dialogueSystem = new DialogueSystem(this, state);
    //      this.npcManager     = new NPCManager(this, state);

    console.log(
      `[MainGameScene] Loaded for "${sheet.getDisplayName()}" | ` +
      `Signposts: ${sheet.foretoldSignposts.join(" · ")}`
    );
  }

  update() {
    if (this._playtimeText) {
      const state = this.registry.get("gameState");
      this._playtimeText.setText(`⏱ ${state.formattedPlaytime()}`);
    }
  }

  // --- World building ---

  _buildBackground(W, H) {
    const g = this.add.graphics();

    // Dark sky gradient (drawn as stacked horizontal bands)
    const bands = 20;
    for (let i = 0; i < bands; i++) {
      const t      = i / bands;
      const r      = Math.floor(Phaser.Math.Linear(0x0d, 0x1a, t));
      const g2     = Math.floor(Phaser.Math.Linear(0x09, 0x0e, t));
      const b      = Math.floor(Phaser.Math.Linear(0x05, 0x00, t));
      const color  = (r << 16) | (g2 << 8) | b;
      g.fillStyle(color, 1);
      g.fillRect(0, (H / bands) * i, W, H / bands + 1);
    }

    // Ground plane
    const ground = this.add.graphics();
    ground.fillStyle(0x1a0e00, 1);
    ground.fillRect(0, H * 0.72, W, H * 0.28);
    ground.fillStyle(0x2a1800, 1);
    ground.fillRect(0, H * 0.72, W, 2);

    // Distant misty hills silhouette
    const hills = this.add.graphics();
    hills.fillStyle(0x120b00, 0.9);
    [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9].forEach((x, i) => {
      const hh = 60 + Math.sin(i * 1.3) * 30;
      hills.fillEllipse(W * x + 60, H * 0.73, 180, hh);
    });
  }

  _buildStarField(W, H) {
    const stars = this.add.graphics();
    const seed  = 42;
    for (let i = 0; i < 120; i++) {
      // Deterministic "random" so stars don't jump on update()
      const x    = ((seed * 9301 + i * 49297 + 233) % W);
      const y    = ((seed * 4923 + i * 11371 + 157) % (H * 0.72));
      const size = (i % 7 === 0) ? 1.5 : 0.8;
      const a    = 0.4 + (i % 5) * 0.12;
      stars.fillStyle(0xffffff, a);
      stars.fillCircle(x, y, size);
    }

    // Gentle twinkle effect — vary alpha of a Graphics object over time
    this.tweens.add({
      targets:  stars,
      alpha:    { from: 0.7, to: 1 },
      duration: 3000,
      ease:     "Sine.easeInOut",
      yoyo:     true,
      repeat:   -1
    });
  }

  _buildUI(sheet, W, H) {
    // Character name
    this.add.text(W / 2, 48, sheet.getDisplayName(), {
      fontSize:   "28px",
      color:      "#f0d060",
      fontFamily: "Palatino Linotype, Georgia, serif",
      stroke:     "#000",
      strokeThickness: 3
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(W / 2, 84, "— Your destiny awaits —", {
      fontSize:   "14px",
      color:      "#c9a227",
      fontFamily: "Palatino Linotype, Georgia, serif",
      fontStyle:  "italic"
    }).setOrigin(0.5);
  }

  _buildSignposts(sheet, W, H) {
    const signposts = sheet.foretoldSignposts;
    if (!signposts || signposts.length === 0) return;

    const panelW  = 200;
    const panelH  = 110;
    const spacing = 24;
    const totalW  = signposts.length * panelW + (signposts.length - 1) * spacing;
    const startX  = (W - totalW) / 2;
    const startY  = H * 0.28;

    // Section label
    this.add.text(W / 2, startY - 28, "🔮  Foretold Signposts", {
      fontSize:   "13px",
      color:      "#8a6d1a",
      fontFamily: "Palatino Linotype, Georgia, serif",
      letterSpacing: 3
    }).setOrigin(0.5);

    signposts.forEach((cluster, i) => {
      const x = startX + i * (panelW + spacing);
      const y = startY;

      const g = this.add.graphics();

      // Panel background
      g.fillStyle(0x1a1000, 0.85);
      g.fillRoundedRect(x, y, panelW, panelH, 6);

      // Border — gold for primary, dimmer for others
      const borderCol = i === 0 ? 0xc9a227 : (i === 1 ? 0x7a8890 : 0x6a4c3c);
      g.lineStyle(i === 0 ? 2 : 1, borderCol, i === 0 ? 1 : 0.6);
      g.strokeRoundedRect(x, y, panelW, panelH, 6);

      // Icon
      const icon = CLUSTER_ICONS[cluster] || "✦";
      this.add.text(x + panelW / 2, y + 22, icon, {
        fontSize: "22px"
      }).setOrigin(0.5);

      // Path rank label
      this.add.text(x + panelW / 2, y + 48, SIGNPOST_LABELS[i] || "", {
        fontSize:   "9px",
        color:      "#8a6d1a",
        fontFamily: "Palatino Linotype, Georgia, serif",
        letterSpacing: 2
      }).setOrigin(0.5);

      // Cluster name (wraps)
      this.add.text(x + panelW / 2, y + 65, cluster, {
        fontSize:   "12px",
        color:      i === 0 ? "#f0d060" : "#d4b882",
        fontFamily: "Palatino Linotype, Georgia, serif",
        wordWrap:   { width: panelW - 20 },
        align:      "center"
      }).setOrigin(0.5, 0);

      // Pulse glow on primary signpost
      if (i === 0) {
        const glow = this.add.graphics();
        glow.fillStyle(0xc9a227, 0.08);
        glow.fillRoundedRect(x - 4, y - 4, panelW + 8, panelH + 8, 8);
        this.tweens.add({
          targets:  glow,
          alpha:    { from: 0, to: 1 },
          duration: 2500,
          ease:     "Sine.easeInOut",
          yoyo:     true,
          repeat:   -1
        });
      }
    });

    // Top life goal + career value shown beneath signposts
    const infoY = startY + panelH + 28;
    this.add.text(W / 2, infoY, [
      `🎯  ${sheet.lifeGoals[0] || "—"}   ·   ⚖️  ${sheet.careerValues[0] || "—"}`
    ], {
      fontSize:   "13px",
      color:      "#8a7a5a",
      fontFamily: "Palatino Linotype, Georgia, serif",
      fontStyle:  "italic"
    }).setOrigin(0.5);
  }

  _buildHUD(state, W, H) {
    const hudY = H - 38;

    // [I] Inventory
    const invKey = this.add.text(20, hudY, "[I]  Inventory", {
      fontSize:   "13px",
      color:      "#c9a227",
      fontFamily: "Palatino Linotype, Georgia, serif"
    }).setInteractive({ useHandCursor: true });

    invKey.on("pointerover", () => invKey.setColor("#f0d060"));
    invKey.on("pointerout",  () => invKey.setColor("#c9a227"));
    invKey.on("pointerdown", () => this._inventoryScreen.toggle());

    // [S] Save
    const saveKey = this.add.text(150, hudY, "[S]  Save", {
      fontSize:   "13px",
      color:      "#c9a227",
      fontFamily: "Palatino Linotype, Georgia, serif"
    }).setInteractive({ useHandCursor: true });

    saveKey.on("pointerover", () => saveKey.setColor("#f0d060"));
    saveKey.on("pointerout",  () => saveKey.setColor("#c9a227"));
    saveKey.on("pointerdown", () => this._doSave(state));

    // Auto-save indicator (appears after saves)
    this._saveIndicator = this.add.text(260, hudY, "", {
      fontSize:   "12px",
      color:      "#5a8a5a",
      fontFamily: "Palatino Linotype, Georgia, serif",
      fontStyle:  "italic"
    });

    // Live playtime clock (right-aligned)
    this._playtimeText = this.add.text(W - 16, hudY, "", {
      fontSize:   "12px",
      color:      "#6a6050",
      fontFamily: "Palatino Linotype, Georgia, serif"
    }).setOrigin(1, 0);

    // Separator line above HUD
    const sep = this.add.graphics();
    sep.lineStyle(1, 0x3a2800, 0.8);
    sep.lineBetween(0, H - 48, W, H - 48);
  }

  // --- Input ---

  _setupInput() {
    this._inventoryScreen = new InventoryScreen(this);

    const iKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);
    iKey.on("down", () => this._inventoryScreen.toggle());

    const sKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    sKey.on("down", () => this._doSave(this.registry.get("gameState")));
  }

  // --- Save ---

  _doSave(state) {
    const saved = state.save();
    this._flashSaveIndicator(`✓ Saved — ${new Date(saved.savedAt).toLocaleTimeString()}`);
  }

  _flashSaveIndicator(msg) {
    if (!this._saveIndicator) return;
    this._saveIndicator.setText(msg);
    this._saveIndicator.setAlpha(1);
    this.tweens.add({
      targets:    this._saveIndicator,
      alpha:      0,
      duration:   3000,
      ease:       "Quad.easeIn",
      delay:      1500
    });
  }

  _startAutoSave(state) {
    // Auto-save every 60 seconds
    this._autoSaveTimer = this.time.addEvent({
      delay:    60000,
      callback: () => {
        state.save();
        this._flashSaveIndicator("✓ Auto-saved");
      },
      loop: true
    });

    // Also save when the tab is hidden (user switches away)
    this._visibilityHandler = () => {
      if (document.hidden) state.save();
    };
    document.addEventListener("visibilitychange", this._visibilityHandler);
  }

  shutdown() {
    if (this._visibilityHandler) {
      document.removeEventListener("visibilitychange", this._visibilityHandler);
    }
    if (this._inventoryScreen) {
      this._inventoryScreen.close();
    }
  }
}
