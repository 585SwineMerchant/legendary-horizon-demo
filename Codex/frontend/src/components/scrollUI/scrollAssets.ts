/**
 * Scroll image asset path constants.
 * Update these paths if you rename or relocate the source images.
 */
/**
 * Side nav medallion button assets (left rail).
 * Drop PNG files at:
 *   public/assets/nav/btn-field-journal.png
 *   public/assets/nav/btn-quest-log.png
 *   public/assets/nav/btn-satchel.png
 *
 * Each image has:
 *   - An ornate medallion circle (top ~57 % of image) with the function icon inside
 *   - A blank dark stone plaque (bottom ~35 %) where the label text is overlaid
 *   - Full transparency around the frame
 */
export const NAV_BTN_ASSETS = {
  // Left rail — cleaned transparent PNGs (white background removed, RGBA alpha)
  fieldJournal:  '/assets/nav/field_journal_button_clean.png',
  questLog:      '/assets/nav/quest_log_button_clean.png',
  satchel:       '/assets/nav/satchel_button_clean.png',
  // Right rail — cleaned transparent PNGs
  worldAtlas:    '/assets/nav/world_atlas_button_clean.png',
  makeCamp:      '/assets/nav/make_camp_button_clean.png',
  returnToGame:  '/assets/nav/return_to_game_button_clean.png',
} as const;

/**
 * Rune medallion assets — glowing amber runes on dark stone circles.
 * Cleaned transparent PNGs (white background removed, RGBA alpha).
 * Keyed by realm_id matching guildRunes.ts.
 */
export const RUNE_ASSETS: Record<string, string> = {
  realm_aethelwood:              '/assets/runes/rune_01_clean.png',
  realm_aurora_apothecary:       '/assets/runes/rune_02_clean.png',
  realm_archives_ascension:      '/assets/runes/rune_03_clean.png',
  realm_etheric_nexus:           '/assets/runes/rune_04_clean.png',
  realm_chroniclers_spire:       '/assets/runes/rune_05_clean.png',
  realm_empaths_enclave:         '/assets/runes/rune_06_clean.png',
  realm_mercantile_citadel:      '/assets/runes/rune_07_clean.png',
  realm_monolith_masonry:        '/assets/runes/rune_08_clean.png',
  realm_odyssey_harbor:          '/assets/runes/rune_09_clean.png',
  realm_alchemical_observatory:  '/assets/runes/rune_10_clean.png',
  realm_bards_beacon:            '/assets/runes/rune_11_clean.png',
  realm_crossroads_haven:        '/assets/runes/rune_12_clean.png',
  realm_gilded_vault:            '/assets/runes/rune_13_clean.png',
  realm_vulcanis_forge:          '/assets/runes/rune_14_clean.png',
  realm_high_council_hall:       '/assets/runes/rune_15_clean.png',
  realm_valors_watchtower:       '/assets/runes/rune_16_clean.png',
};

export const SCROLL_ASSETS = {
  /** Full Traveler's Manifest artwork — used for the main pause hub / character sheet. */
  hub: '/assets/scroll/Scroll_Of_Destiny_ready.png',

  /**
   * Mostly-blank scroll for submenu backgrounds (Quest Log, Satchel, Field Journal).
   * Drop the asset at:  public/assets/scroll/scroll_blank.png
   *
   * Until that file exists, ScrollFrameStage falls back to the hub image via onError,
   * so submenus continue to work and just display the hub scroll art instead.
   */
  submenu: '/assets/scroll/sub map scroll.png',

  /**
   * Traveler concept art for the circular portrait badge on the hub scroll.
   * Source: Project Documents/Traveler sprite work/traveler on the 45.png
   */
  portrait: '/assets/scroll/traveler_badge_45.png',
} as const;
