import type { ComparisonLedgerEntry, RitualDraftsV1 } from '../domain/lh-contract';

/** In-progress ledger row on the world map (all strings for controlled inputs). */
export type LedgerDraftFields = {
  career_a: string;
  career_b: string;
  education_a: string;
  education_b: string;
  salary_a: string;
  salary_b: string;
  career_cluster_a: string;
  career_cluster_b: string;
  pathway_a: string;
  pathway_b: string;
  note: string;
};

export function emptyLedgerDraft(): LedgerDraftFields {
  return {
    career_a: '',
    career_b: '',
    education_a: '',
    education_b: '',
    salary_a: '',
    salary_b: '',
    career_cluster_a: '',
    career_cluster_b: '',
    pathway_a: '',
    pathway_b: '',
    note: '',
  };
}

function trimOpt(s: string): string | undefined {
  const t = s.trim();
  return t ? t : undefined;
}

/** Build a persisted ledger row from the form (optional fields omitted when empty). */
export function buildLedgerEntryPayload(
  realmId: string,
  draft: LedgerDraftFields,
): Omit<ComparisonLedgerEntry, 'id' | 'created_iso'> {
  const realm = String(realmId || '').trim();
  const base: Omit<ComparisonLedgerEntry, 'id' | 'created_iso'> = {
    realm_id: realm,
    career_a: draft.career_a.trim(),
    career_b: draft.career_b.trim(),
    note: draft.note.trim(),
  };
  const education_a = trimOpt(draft.education_a);
  const education_b = trimOpt(draft.education_b);
  const salary_a = trimOpt(draft.salary_a);
  const salary_b = trimOpt(draft.salary_b);
  const career_cluster_a = trimOpt(draft.career_cluster_a);
  const career_cluster_b = trimOpt(draft.career_cluster_b);
  const pathway_a = trimOpt(draft.pathway_a);
  const pathway_b = trimOpt(draft.pathway_b);
  if (education_a) base.education_a = education_a;
  if (education_b) base.education_b = education_b;
  if (salary_a) base.salary_a = salary_a;
  if (salary_b) base.salary_b = salary_b;
  if (career_cluster_a) base.career_cluster_a = career_cluster_a;
  if (career_cluster_b) base.career_cluster_b = career_cluster_b;
  if (pathway_a) base.pathway_a = pathway_a;
  if (pathway_b) base.pathway_b = pathway_b;
  return base;
}

/** Maps autosave / manual-save ritual draft columns to the in-memory form. */
export function ledgerDraftFromRitualDrafts(d: RitualDraftsV1 | undefined): Partial<LedgerDraftFields> {
  if (!d) return {};
  return {
    career_a: d.ledger_career_a ?? '',
    career_b: d.ledger_career_b ?? '',
    education_a: d.ledger_education_a ?? '',
    education_b: d.ledger_education_b ?? '',
    salary_a: d.ledger_salary_a ?? '',
    salary_b: d.ledger_salary_b ?? '',
    career_cluster_a: d.ledger_cluster_a ?? '',
    career_cluster_b: d.ledger_cluster_b ?? '',
    pathway_a: d.ledger_pathway_a ?? '',
    pathway_b: d.ledger_pathway_b ?? '',
    note: d.ledger_note ?? '',
  };
}

export function ritualDraftsFromLedgerDraft(d: LedgerDraftFields): RitualDraftsV1 {
  const out: RitualDraftsV1 = {};
  if (d.career_a.trim()) out.ledger_career_a = d.career_a.trim();
  if (d.career_b.trim()) out.ledger_career_b = d.career_b.trim();
  if (d.note.trim()) out.ledger_note = d.note.trim();
  if (d.education_a.trim()) out.ledger_education_a = d.education_a.trim();
  if (d.education_b.trim()) out.ledger_education_b = d.education_b.trim();
  if (d.salary_a.trim()) out.ledger_salary_a = d.salary_a.trim();
  if (d.salary_b.trim()) out.ledger_salary_b = d.salary_b.trim();
  if (d.career_cluster_a.trim()) out.ledger_cluster_a = d.career_cluster_a.trim();
  if (d.career_cluster_b.trim()) out.ledger_cluster_b = d.career_cluster_b.trim();
  if (d.pathway_a.trim()) out.ledger_pathway_a = d.pathway_a.trim();
  if (d.pathway_b.trim()) out.ledger_pathway_b = d.pathway_b.trim();
  return out;
}

/** Normalizes one JSON row from `exploration_loop.ledger_entries` (backward compatible). */
export function coerceLedgerRow(raw: unknown): ComparisonLedgerEntry | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const id = typeof r.id === 'string' ? r.id.trim() : '';
  const realm_id = typeof r.realm_id === 'string' ? r.realm_id.trim() : '';
  if (!id || !realm_id) return null;
  const s = (k: string): string | undefined => {
    const v = r[k];
    return typeof v === 'string' && v.trim() ? v.trim() : undefined;
  };
  const career_a = typeof r.career_a === 'string' ? r.career_a : '';
  const career_b = typeof r.career_b === 'string' ? r.career_b : '';
  const note = typeof r.note === 'string' ? r.note : '';
  const created_iso = typeof r.created_iso === 'string' && r.created_iso.trim() ? r.created_iso : new Date().toISOString();
  const row: ComparisonLedgerEntry = {
    id,
    realm_id,
    career_a,
    career_b,
    note,
    created_iso,
  };
  const education_a = s('education_a');
  const education_b = s('education_b');
  const salary_a = s('salary_a');
  const salary_b = s('salary_b');
  const career_cluster_a = s('career_cluster_a');
  const career_cluster_b = s('career_cluster_b');
  const pathway_a = s('pathway_a');
  const pathway_b = s('pathway_b');
  if (education_a) row.education_a = education_a;
  if (education_b) row.education_b = education_b;
  if (salary_a) row.salary_a = salary_a;
  if (salary_b) row.salary_b = salary_b;
  if (career_cluster_a) row.career_cluster_a = career_cluster_a;
  if (career_cluster_b) row.career_cluster_b = career_cluster_b;
  if (pathway_a) row.pathway_a = pathway_a;
  if (pathway_b) row.pathway_b = pathway_b;
  return row;
}

/** Compact secondary line for quest log / map list (optional fields only when present). */
export function summarizeLedgerEntryExtras(row: ComparisonLedgerEntry): string {
  const bits: string[] = [];
  if (row.education_a || row.education_b) {
    bits.push(`Education: ${row.education_a?.trim() || '—'} / ${row.education_b?.trim() || '—'}`);
  }
  if (row.salary_a || row.salary_b) {
    bits.push(`Salary: ${row.salary_a?.trim() || '—'} / ${row.salary_b?.trim() || '—'}`);
  }
  if (row.career_cluster_a || row.career_cluster_b) {
    bits.push(`Cluster: ${row.career_cluster_a?.trim() || '—'} / ${row.career_cluster_b?.trim() || '—'}`);
  }
  if (row.pathway_a || row.pathway_b) {
    bits.push(`Pathway: ${row.pathway_a?.trim() || '—'} / ${row.pathway_b?.trim() || '—'}`);
  }
  return bits.join(' · ');
}

