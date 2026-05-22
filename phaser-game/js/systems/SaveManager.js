// =============================================================================
// SaveManager.js — Thin localStorage wrapper for all game persistence
//
// Save slot key: 'questOfFate_save'
// Save format version is stamped on every write so future migrations can detect
// when saved data was produced by an older build.
// =============================================================================

const SaveManager = (() => {
  const KEY     = "questOfFate_save";
  const VERSION = 1;

  return {
    save(data) {
      const payload = { _v: VERSION, ...data };
      try {
        localStorage.setItem(KEY, JSON.stringify(payload));
        return true;
      } catch (e) {
        console.error("SaveManager.save failed:", e);
        return false;
      }
    },

    load() {
      try {
        const raw = localStorage.getItem(KEY);
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        console.error("SaveManager.load failed — corrupted save?", e);
        return null;
      }
    },

    exists() {
      return !!localStorage.getItem(KEY);
    },

    clear() {
      localStorage.removeItem(KEY);
    },

    // Returns the raw JSON string — useful for sharing/debugging
    export() {
      return localStorage.getItem(KEY) || "";
    },

    // Validates and imports a JSON string as the current save
    import(jsonString) {
      try {
        const parsed = JSON.parse(jsonString);
        if (!parsed || typeof parsed !== "object") return false;
        localStorage.setItem(KEY, jsonString);
        return true;
      } catch {
        return false;
      }
    },

    getVersion() {
      const data = this.load();
      return data ? (data._v || 0) : null;
    }
  };
})();
