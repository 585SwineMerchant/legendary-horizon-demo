/**
 * Scroll image asset path constants.
 * Update these paths if you rename or relocate the source images.
 */
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
