/** SVG rune definition for a single guild. viewBox is always "0 0 40 46". */
export type GuildRune = {
  /** All SVG path data combined into one `d` string (M/L commands, no fill). */
  path: string;
  /** Optional dot/circle mark. */
  dot?: { cx: number; cy: number; r: number };
};

/**
 * Inline SVG rune data for all 16 canon guilds.
 * Keyed by realm_id. stave runs x=20 y=2..44; branches extend from that spine.
 * Stroke weights: stave 2.5, branches 2.0 (applied by renderer).
 */
export const GUILD_RUNES: Record<string, GuildRune> = {
  // Stave full height; symmetric branch pairs at y=11, y=20; root forks at y=31
  realm_aethelwood: {
    path: 'M20,2 L20,44 M8,11 L32,11 M10,20 L30,20 M20,31 L12,40 M20,31 L28,40',
  },
  // Stave full height; diamond shape (branches out at y=16 to x=10/30, meet at y=32)
  realm_aurora_apothecary: {
    path: 'M20,2 L20,44 M20,16 L10,24 L20,32 M20,16 L30,24 L20,32',
  },
  // Stave full height; right branches at y=10,19,28,37 with decreasing reach
  realm_archives_ascension: {
    path: 'M20,2 L20,44 M20,10 L30,10 M20,19 L28,19 M20,28 L25,28 M20,37 L22,37',
  },
  // Stave full height; hourglass (top triangle y=7..20, bottom y=20..33); bar at y=40
  realm_etheric_nexus: {
    path: 'M20,2 L20,44 M8,7 L20,20 L32,7 M20,20 L8,33 M20,20 L32,33 M8,40 L32,40',
  },
  // Two parallel staves at x=14, x=26; diagonal crossbars y=9..17 and y=17..25
  realm_chroniclers_spire: {
    path: 'M14,2 L14,44 M26,2 L26,44 M14,9 L26,17 M26,17 L14,25',
  },
  // Stave full height; diamond outline y=8..30
  realm_empaths_enclave: {
    path: 'M20,2 L20,44 M20,8 L8,19 L20,30 L32,19 Z',
  },
  // Left stave x=14; right bracket from top (y=8) to mid (y=22); bottom bar y=36
  realm_mercantile_citadel: {
    path: 'M14,2 L14,44 M14,8 L30,8 L30,22 L14,22 M14,36 L26,36',
  },
  // Stave full height; rectangle outline y=14..30 (stave bisects it)
  realm_monolith_masonry: {
    path: 'M20,2 L20,44 M8,14 L32,14 L32,30 L8,30 Z',
  },
  // Stave full height; left branch y=18; right branch y=24; left root branch y=36
  realm_odyssey_harbor: {
    path: 'M20,2 L20,44 M20,18 L8,18 M20,24 L32,24 M20,36 L8,36',
  },
  // Stave full height; top triangle (apex y=20 base y=7); bar y=38
  realm_alchemical_observatory: {
    path: 'M20,2 L20,44 M8,7 L32,7 M8,7 L20,20 M32,7 L20,20 M8,38 L32,38',
  },
  // Left stave x=14; two right-pointing chevrons at y=9..19 and y=22..32
  realm_bards_beacon: {
    path: 'M14,2 L14,44 M14,9 L32,14 L14,19 M14,22 L32,27 L14,32',
  },
  // Stave full height; peaked roof y=8..18; walls y=18..32; floor bar y=32
  realm_crossroads_haven: {
    path: 'M20,2 L20,44 M8,18 L20,8 L32,18 M8,18 L8,32 L32,32 L32,18',
  },
  // Stave full height; top bar y=14; sides y=14..28; keystone converge y=36
  realm_gilded_vault: {
    path: 'M20,2 L20,44 M8,14 L32,14 M8,14 L8,28 M32,14 L32,28 M8,28 L20,36 L32,28',
  },
  // Stave full height; X cross y=12..32; horizontal bar y=22
  realm_vulcanis_forge: {
    path: 'M20,2 L20,44 M8,12 L32,32 M32,12 L8,32 M8,22 L32,22',
  },
  // Stave full height; rectangle y=12..28; pendant bar y=38
  realm_high_council_hall: {
    path: 'M20,2 L20,44 M8,12 L32,12 M32,12 L32,28 M32,28 L8,28 M8,28 L8,12 M14,38 L26,38',
  },
  // Stave full height; peaked triangle apex y=4 base y=18; base bar; dot at y=28
  realm_valors_watchtower: {
    path: 'M20,2 L20,44 M8,18 L20,4 L32,18 M8,18 L32,18',
    dot: { cx: 20, cy: 28, r: 2.5 },
  },
};

/** Render a rune as an inline SVG element. */
export function renderRuneSvg(
  guildId: string,
): { path: string; dot?: { cx: number; cy: number; r: number } } | null {
  const rune = GUILD_RUNES[guildId];
  if (!rune) return null;
  return rune;
}
