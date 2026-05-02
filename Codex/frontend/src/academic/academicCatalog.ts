import type { AcademicTaskKind, AcademicWorksheetFieldDef, AcademicWorksheetTaskDef } from '../domain/lh-contract';

const KINDS = new Set<string>([
  'quest_of_fate',
  'comparison_ledger',
  'quest_of_choice',
  'manifest',
  'great_transcription',
  'chronicle',
]);

function normalizeField(raw: unknown): AcademicWorksheetFieldDef | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.key !== 'string' || !o.key.trim()) return null;
  const input = o.input === 'choice' ? 'choice' : 'text';
  const options = Array.isArray(o.options)
    ? (o.options as { value?: unknown; label?: unknown }[])
        .map((x) =>
          typeof x?.value === 'string' && typeof x?.label === 'string'
            ? { value: x.value, label: x.label }
            : null,
        )
        .filter(Boolean)
    : [];
  return {
    key: o.key.trim(),
    label: typeof o.label === 'string' ? o.label : o.key,
    placeholder: typeof o.placeholder === 'string' ? o.placeholder : undefined,
    multiline: Boolean(o.multiline),
    input: input === 'choice' && options.length ? 'choice' : 'text',
    options: input === 'choice' && options.length ? (options as { value: string; label: string }[]) : undefined,
  };
}

export function normalizeAcademicWorksheetTaskDef(raw: unknown): AcademicWorksheetTaskDef | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.task_id !== 'string' || !o.task_id.trim()) return null;
  const kindRaw = String(o.kind ?? '').toLowerCase();
  if (!KINDS.has(kindRaw)) return null;
  const kind = kindRaw as AcademicTaskKind;
  const fieldsRaw = Array.isArray(o.fields) ? o.fields : [];
  const fields = fieldsRaw.map(normalizeField).filter(Boolean) as AcademicWorksheetFieldDef[];
  const unlockRaw = o.unlock_after_task_ids;
  const unlock_after_task_ids = Array.isArray(unlockRaw)
    ? unlockRaw.filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
    : undefined;
  return {
    task_id: o.task_id.trim(),
    kind,
    title: typeof o.title === 'string' ? o.title : 'Worksheet',
    intro: typeof o.intro === 'string' ? o.intro : '',
    fields,
    unlock_after_task_ids: unlock_after_task_ids?.length ? unlock_after_task_ids : undefined,
  };
}

export function loadAcademicWorksheetCatalog(raw: unknown): AcademicWorksheetTaskDef[] {
  if (!Array.isArray(raw)) return [];
  const out: AcademicWorksheetTaskDef[] = [];
  for (const row of raw) {
    const d = normalizeAcademicWorksheetTaskDef(row);
    if (d) out.push(d);
  }
  return out;
}
