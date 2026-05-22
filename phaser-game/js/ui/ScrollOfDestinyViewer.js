// =============================================================================
// ScrollOfDestinyViewer.js — DOM overlay that renders the full CharacterSheet
// Reuses ScrollOfDestiny.render() and character-creation/css/style.css directly.
// =============================================================================

class ScrollOfDestinyViewer {
  constructor(scene) {
    this.scene   = scene;
    this.overlay = null;
  }

  open(onClose) {
    if (this.overlay) return;

    const inventory = this.scene.registry.get("inventory");
    const scrollItem = inventory.getScroll();
    if (!scrollItem) {
      console.warn("ScrollOfDestinyViewer: no scroll in inventory");
      return;
    }

    const sheet = new CharacterSheet().fromJSON(scrollItem.data.sheet);

    this.overlay = document.createElement("div");
    this.overlay.className = "qof-scroll-viewer-overlay";
    this.overlay.innerHTML = `
      <div class="qof-scroll-viewer-inner">
        <div class="qof-scroll-viewer-topbar">
          <button class="qof-btn-back" id="svBack">← Back to Inventory</button>
        </div>
        <div id="sv-scroll-container" class="scroll-container"></div>
      </div>
    `;
    document.body.appendChild(this.overlay);

    // Reuse the existing render function — no export buttons needed here
    ScrollOfDestiny.render(
      this.overlay.querySelector("#sv-scroll-container"),
      sheet,
      null   // no "begin journey" button inside the viewer
    );

    // Hide the export controls that render() always adds
    const exportCtrl = this.overlay.querySelector(".export-controls");
    if (exportCtrl) exportCtrl.style.display = "none";

    this.overlay.querySelector("#svBack").addEventListener("click", () => {
      this.close();
      if (onClose) onClose();
    });

    // Click outside the inner panel to go back
    this.overlay.addEventListener("click", e => {
      if (e.target === this.overlay) { this.close(); if (onClose) onClose(); }
    });
  }

  close() {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
  }
}
