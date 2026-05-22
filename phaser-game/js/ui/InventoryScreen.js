// =============================================================================
// InventoryScreen.js — Modal inventory overlay (toggle with [I] key)
//
// Lists all items in the Phaser registry's Inventory instance.
// Clicking the Scroll of Destiny opens ScrollOfDestinyViewer.
//
// INTEGRATION_POINT: add new item type rendering in _renderItem().
// INTEGRATION_POINT: equip/use logic goes in the click handlers below.
// =============================================================================

const ITEM_TYPE_ICONS = {
  scroll:     "📜",
  quest:      "❗",
  key:        "🗝️",
  consumable: "🧪",
  misc:       "📦"
};

const ITEM_TYPE_LABELS = {
  scroll:     "Ancient Scroll",
  quest:      "Quest Item",
  key:        "Key Item",
  consumable: "Consumable",
  misc:       "Miscellaneous"
};

class InventoryScreen {
  constructor(scene) {
    this.scene   = scene;
    this.overlay = null;
    this.isOpen  = false;
  }

  toggle() {
    this.isOpen ? this.close() : this.open();
  }

  open() {
    if (this.isOpen) return;
    this.isOpen = true;

    const inventory = this.scene.registry.get("inventory");
    const items     = inventory.getAll();

    this.overlay = document.createElement("div");
    this.overlay.className = "qof-inv-overlay";
    this.overlay.innerHTML = `
      <div class="qof-inv-panel">
        <div class="qof-inv-header">
          <h2 class="qof-inv-title">⚔️ Your Possessions</h2>
          <span class="qof-inv-hint">Press [I] to close</span>
          <button class="qof-inv-close" id="invClose">✕</button>
        </div>

        <div class="qof-inv-body">
          ${items.length === 0
            ? `<p class="qof-inv-empty">Your satchel is empty.</p>`
            : items.map(item => this._renderItem(item)).join("")}
        </div>

        <div class="qof-inv-footer">
          ${items.length} item${items.length !== 1 ? "s" : ""} carried
        </div>
      </div>
    `;
    document.body.appendChild(this.overlay);

    // Close button
    this.overlay.querySelector("#invClose").addEventListener("click", () => this.close());

    // Click backdrop to close
    this.overlay.addEventListener("click", e => {
      if (e.target === this.overlay) this.close();
    });

    // Item click handlers
    this.overlay.querySelectorAll(".qof-inv-item[data-action='view-scroll']").forEach(el => {
      el.addEventListener("click", () => {
        this.close();
        const viewer = new ScrollOfDestinyViewer(this.scene);
        viewer.open(() => this.open());  // reopen inventory after closing viewer
      });
    });

    // INTEGRATION_POINT: add data-action handlers for other item types here
    // e.g. data-action='use-consumable', data-action='equip-key'
  }

  _renderItem(item) {
    const icon       = item.icon || ITEM_TYPE_ICONS[item.type] || "📦";
    const typeLabel  = ITEM_TYPE_LABELS[item.type]  || item.type;
    const isScroll   = item.type === "scroll";
    const action     = isScroll ? "data-action='view-scroll'" : "";
    const clickHint  = isScroll ? `<span class="qof-item-action">View Scroll →</span>` : "";
    const highlight  = isScroll ? "qof-inv-item--scroll" : "";

    return `
      <div class="qof-inv-item ${highlight}" ${action} data-id="${item.id}">
        <div class="qof-item-icon">${icon}</div>
        <div class="qof-item-info">
          <div class="qof-item-name">${item.name}</div>
          <div class="qof-item-type">${typeLabel}</div>
          <div class="qof-item-desc">${item.description}</div>
        </div>
        ${clickHint}
      </div>
    `;
  }

  close() {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
    this.isOpen = false;
  }
}
