/** Draft keys persisted under `module_drafts.mod_manifest_sod` until the Manifest is sealed. */
export const FORETOLD_SIGNPOST_DRAFT_KEYS = [
  'foretold_signpost_realm_1',
  'foretold_signpost_realm_2',
  'foretold_signpost_realm_3',
] as const;

export function signpostsFromManifestDraft(d: Record<string, string>): string[] {
  const out: string[] = [];
  for (const k of FORETOLD_SIGNPOST_DRAFT_KEYS) {
    const id = String(d[k] ?? '').trim();
    if (id && !out.includes(id)) out.push(id);
  }
  return out.slice(0, 3);
}

/** Keep only known canon realm ids, unique, max three (Scroll of Destiny). */
export function normalizeForetoldSignpostRealmIds(raw: readonly string[], allowedRealmIds: ReadonlySet<string>): string[] {
  const out: string[] = [];
  for (const x of raw) {
    const id = String(x ?? '').trim();
    if (!id || !allowedRealmIds.has(id) || out.includes(id)) continue;
    out.push(id);
    if (out.length >= 3) break;
  }
  return out;
}

export type SignpostLedgerMilestone = {
  /**
   * When true, Act III “Fog of the Unknown” ledger milestone expects at least one ledger row
   * saved from **each** Foretold Signpost tile (matched by `ComparisonLedgerEntry.realm_id`).
   */
  guidesMilestone: boolean;
  /** How many distinct signpost realms already have ≥1 ledger entry. */
  covered: number;
  /** `3` when guiding; `0` when the Scroll does not define a full triad. */
  total: number;
  /** All signpost realms have at least one ledger row (only meaningful when `guidesMilestone`). */
  milestoneComplete: boolean;
};

/**
 * Measures Scroll-of-Destiny coverage on the comparison ledger without changing the ledger row shape.
 * Legacy saves: fewer than three stored signposts → do not guide milestone (treat as satisfied for gating).
 */
export function signpostLedgerMilestone(
  ledgerEntries: readonly { realm_id: string }[],
  foretoldSignpostRealmIds: readonly string[] | undefined,
): SignpostLedgerMilestone {
  const raw = (foretoldSignpostRealmIds ?? []).map((x) => String(x ?? '').trim()).filter(Boolean);
  const signposts = [...new Set(raw)].slice(0, 3);
  if (signposts.length < 3) {
    return { guidesMilestone: false, covered: 0, total: 0, milestoneComplete: true };
  }
  const realmsTouched = new Set(ledgerEntries.map((e) => String(e.realm_id || '').trim()).filter(Boolean));
  let covered = 0;
  for (const id of signposts) {
    if (realmsTouched.has(id)) covered += 1;
  }
  const total = signposts.length;
  return {
    guidesMilestone: true,
    covered,
    total,
    milestoneComplete: covered >= total,
  };
}
