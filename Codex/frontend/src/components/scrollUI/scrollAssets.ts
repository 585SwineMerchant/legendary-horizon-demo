/**
 * Scroll image asset path constants.
 * All paths use import.meta.env.BASE_URL so they resolve correctly both on
 * localhost (Vite dev server) and on GitHub Pages (base: '/legendary-horizon-demo/').
 * Never use root-relative '/assets/...' strings here — they omit the sub-path prefix.
 */

// Evaluated at build time by Vite; resolves to '/legendary-horizon-demo/' in prod.
const _base = import.meta.env.BASE_URL;

/**
 * Side nav medallion button assets (left rail / right rail).
 * Drop PNG files at:
 *   public/assets/nav/field_journal_button_clean.png  (etc.)
 */
export const NAV_BTN_ASSETS = {
  // Left rail — cleaned transparent PNGs (white background removed, RGBA alpha)
  fieldJournal: `${_base}assets/nav/field_journal_button_clean.png`,
  questLog:     `${_base}assets/nav/quest_log_button_clean.png`,
  satchel:      `${_base}assets/nav/satchel_button_clean.png`,
  // Right rail — cleaned transparent PNGs
  worldAtlas:   `${_base}assets/nav/world_atlas_button_clean.png`,
  makeCamp:     `${_base}assets/nav/make_camp_button_clean.png`,
  returnToGame: `${_base}assets/nav/return_to_game_button_clean.png`,
};

/**
 * Rune medallion assets — glowing amber runes on dark stone circles.
 * Cleaned transparent PNGs (white background removed, RGBA alpha).
 * Keyed by realm_id matching guildRunes.ts.
 */
export const RUNE_ASSETS: Record<string, string> = {
  realm_aethelwood:              `${_base}assets/runes/rune_01_clean.png`,
  realm_aurora_apothecary:       `${_base}assets/runes/rune_02_clean.png`,
  realm_archives_ascension:      `${_base}assets/runes/rune_03_clean.png`,
  realm_etheric_nexus:           `${_base}assets/runes/rune_04_clean.png`,
  realm_chroniclers_spire:       `${_base}assets/runes/rune_05_clean.png`,
  realm_empaths_enclave:         `${_base}assets/runes/rune_06_clean.png`,
  realm_mercantile_citadel:      `${_base}assets/runes/rune_07_clean.png`,
  realm_monolith_masonry:        `${_base}assets/runes/rune_08_clean.png`,
  realm_odyssey_harbor:          `${_base}assets/runes/rune_09_clean.png`,
  realm_alchemical_observatory:  `${_base}assets/runes/rune_10_clean.png`,
  realm_bards_beacon:            `${_base}assets/runes/rune_11_clean.png`,
  realm_crossroads_haven:        `${_base}assets/runes/rune_12_clean.png`,
  realm_gilded_vault:            `${_base}assets/runes/rune_13_clean.png`,
  realm_vulcanis_forge:          `${_base}assets/runes/rune_14_clean.png`,
  realm_high_council_hall:       `${_base}assets/runes/rune_15_clean.png`,
  realm_valors_watchtower:       `${_base}assets/runes/rune_16_clean.png`,
};

export const SCROLL_ASSETS = {
  /** Full Traveler's Manifest artwork — used for the main pause hub / character sheet. */
  hub: `${_base}assets/scroll/Scroll_Of_Destiny_ready.png`,

  /**
   * Mostly-blank scroll for submenu backgrounds (Quest Log, Satchel, Field Journal).
   * Drop the asset at:  public/assets/scroll/scroll_blank.png
   *
   * Until that file exists, ScrollFrameStage falls back to the hub image via onError,
   * so submenus continue to work and just display the hub scroll art instead.
   */
  submenu: `${_base}assets/scroll/sub map scroll.png`,

  /**
   * Traveler concept art for the circular portrait badge on the hub scroll.
   * Source: Project Documents/Traveler sprite work/traveler on the 45.png
   */
  portrait: `${_base}assets/scroll/traveler_badge_45.png`,
};
