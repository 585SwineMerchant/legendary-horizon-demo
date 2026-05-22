// =============================================================================
// Inventory.js — Item data model and Inventory container
//
// Items persist inside GameState.save() / GameState.load() automatically.
//
// INTEGRATION_POINT: When future NPCs give items, call:
//   gameState.inventory.addItem(new Item({ id, name, type, description, data }))
//   gameState.save()
// =============================================================================

class Item {
  constructor({ id, name, type, description, icon = "📦", data = {} }) {
    this.id          = id;
    this.name        = name;
    this.type        = type;         // 'scroll' | 'quest' | 'key' | 'consumable' | 'misc'
    this.description = description;
    this.icon        = icon;
    this.data        = data;         // arbitrary payload (e.g. CharacterSheet JSON for scrolls)
    this.acquiredAt  = new Date().toISOString();
  }
}

class Inventory {
  constructor() {
    // Map preserves insertion order, which matters for display
    this._items = new Map();
  }

  // --- Mutations ---

  addItem(item) {
    this._items.set(item.id, item);
    return this;
  }

  removeItem(id) {
    this._items.delete(id);
    return this;
  }

  // --- Queries ---

  getItem(id)            { return this._items.get(id) || null; }
  getItemsByType(type)   { return this.getAll().filter(i => i.type === type); }
  getAll()               { return [...this._items.values()]; }
  hasItem(id)            { return this._items.has(id); }
  size()                 { return this._items.size; }

  // Special accessor — there is exactly one Scroll of Destiny per character
  getScroll() {
    return this.getItemsByType("scroll")[0] || null;
  }

  // INTEGRATION_POINT: future query helpers:
  //   getQuestItems()    → getItemsByType('quest')
  //   getKeyItems()      → getItemsByType('key')
  //   hasQuestItem(id)   → hasItem(id) && getItem(id).type === 'quest'

  // --- Serialization ---

  // Returns a plain array safe for JSON.stringify
  toRaw() {
    return this.getAll();
  }

  static fromRaw(rawArray) {
    const inv = new Inventory();
    (rawArray || []).forEach(raw => inv.addItem(Object.assign(new Item(raw), raw)));
    return inv;
  }
}

// Factory: wraps a completed CharacterSheet as the Scroll of Destiny item
function createScrollItem(sheet) {
  return new Item({
    id:          "scroll_of_destiny",
    name:        "Scroll of Destiny",
    type:        "scroll",
    icon:        "📜",
    description: `The ancient scroll bearing ${sheet.getDisplayName()}'s destined path, inscribed by the Master Scribe.`,
    data:        { sheet: JSON.parse(sheet.toJSON()) }
  });
}
