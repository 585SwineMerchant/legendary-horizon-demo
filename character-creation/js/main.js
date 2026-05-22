// =============================================================================
// main.js — Entry point. Boots the MasterScribeController on DOM ready.
// =============================================================================

document.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("game-root");
  if (!root) {
    console.error("Could not find #game-root element.");
    return;
  }

  const controller = new MasterScribeController(root);
  controller.start();

  // Expose controller on window for dev console access
  window._scribe = controller;
  // Dev helpers:
  //   window._scribe.devSkipToScroll()          — jump straight to scroll with mock data
  //   window._scribe.devSkipToScroll("Aela")    — skip with a specific name
  //   window._scribe.sheet                      — inspect the current CharacterSheet
  //   MockData.getSheet()                        — generate a standalone mock sheet
});
