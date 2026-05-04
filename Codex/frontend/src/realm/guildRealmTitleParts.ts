import type { RealmDefinition } from '../domain/lh-contract';

const HIDDEN_TAGS = new Set(['canon', 'placeholder_map', 'demo_map', 'nature_primary']);

/** Tags shown as “path interests” bullets (Realm Atlas–style traveler hooks). */
export function getRealmPathInterestTags(realm: RealmDefinition): string[] {
  return (realm.tags ?? [])
    .filter((t) => !HIDDEN_TAGS.has(t))
    .map((t) => t.replace(/_/g, ' ').trim())
    .filter(Boolean);
}

/** Guild HQ line split for display: lead + highlighted suffix (mirrors old modal titles). */
export function getGuildRealmTitleParts(realm: RealmDefinition): { lead: string; highlight: string | null } {
  const hq = realm.guild_headquarters.trim();
  const dn = realm.display_name.trim();
  if (dn && hq.toLowerCase().startsWith(dn.toLowerCase() + ' ')) {
    const rest = hq.slice(dn.length).trim();
    return { lead: dn, highlight: rest || null };
  }
  const words = hq.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return { lead: words.slice(0, -1).join(' '), highlight: words[words.length - 1] ?? null };
  }
  return { lead: hq, highlight: null };
}
