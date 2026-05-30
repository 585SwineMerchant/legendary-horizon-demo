import { useMemo, useState } from 'react';

import { normalizeForetoldSignpostRealmIds, signpostsFromManifestDraft } from '../../exploration/foretoldSignposts';
import type { ModuleResultPayload } from '../../types';
import { ScrollOfDestinyViewer } from './ScrollOfDestinyViewer';

type RealmPick = { realm_id: string; label: string };

type Props = {
  draft: Record<string, string>;
  onDraftChange: (patch: Partial<Record<string, string>>) => void;
  onSubmitResult: (payload: ModuleResultPayload) => void;
  /** Canon realms for Scroll of Destiny — three Foretold Signposts (distinct `realm_id`s). */
  canonRealmPickList: readonly RealmPick[];
};

type StepId = 'self' | 'career' | 'skills' | 'goals' | 'export';

function nowIso(): string {
  return new Date().toISOString();
}

function splitTopThree(raw: string): string[] {
  return raw
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 3);
}

function formatTopThree(raw: string): string {
  const ordinals = ['1st', '2nd', '3rd'];
  const items = splitTopThree(raw);
  return items.map((v, i) => `${ordinals[i] ?? `${i + 1}th`}: ${v}`).join('\n');
}

function copyText(text: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard
      .writeText(text)
      .then(() => true)
      .catch(() => false);
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return Promise.resolve(ok);
  } catch {
    return Promise.resolve(false);
  }
}

export function ManifestSodModule({ draft, onDraftChange, onSubmitResult, canonRealmPickList }: Props) {
  const [step, setStep] = useState<StepId>('self');
  const [copyStatus, setCopyStatus] = useState<string>('');
  const [showScrollPreview, setShowScrollPreview] = useState(false);

  const completionPct = useMemo(() => {
    const keys = [
      'student_name',
      'personal_interests',
      'academic_interests',
      'work_preference',
      'abilities_csv',
      'career_interest',
      'career_education',
      'career_skills',
      'career_environment',
      'skill_communication',
      'skill_collaboration',
      'skill_problem_solving',
      'skill_self_management',
      'career_goal',
      'need_to_learn',
      'first_step',
    ];
    const have = keys.filter((k) => Boolean(String(draft[k] ?? '').trim())).length;
    return Math.round((have / keys.length) * 100);
  }, [draft]);

  const mirrorA = useMemo(() => {
    const personal = formatTopThree(String(draft.personal_interests ?? ''));
    const academic = formatTopThree(String(draft.academic_interests ?? ''));
    const pref = String(draft.work_preference ?? '').trim();
    const abilities = String(draft.abilities_csv ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .join(', ');
    const growthArea = String(draft.growth_area ?? '').trim();
    const growthAction = String(draft.growth_action ?? '').trim();
    return { personal, academic, pref, abilities, growthArea, growthAction };
  }, [draft]);

  const mirrorB = useMemo(() => {
    return {
      career: String(draft.career_interest ?? '').trim(),
      education: String(draft.career_education ?? '').trim(),
      skills: String(draft.career_skills ?? '').trim(),
      environment: String(draft.career_environment ?? '').trim(),
    };
  }, [draft]);

  const mirrorC = useMemo(() => {
    return {
      goal: String(draft.career_goal ?? '').trim(),
      eduPlans: String(draft.need_to_learn ?? '').trim(),
      steps: String(draft.first_step ?? '').trim(),
      completed: String(draft.completed_steps ?? 'No').trim() || 'No',
    };
  }, [draft]);

  const mirrorSkills = useMemo(() => {
    const format = (n: unknown) => String(n ?? '').trim();
    return {
      communication: format(draft.skill_communication),
      collaboration: format(draft.skill_collaboration),
      problemSolving: format(draft.skill_problem_solving),
      selfManagement: format(draft.skill_self_management),
      evidence: String(draft.skill_evidence ?? '').trim(),
    };
  }, [draft]);

  const signpostLineForExport = useMemo(() => {
    const byId = new Map(canonRealmPickList.map((x) => [x.realm_id, x.label]));
    const parts = (['foretold_signpost_realm_1', 'foretold_signpost_realm_2', 'foretold_signpost_realm_3'] as const).map(
      (k) => {
        const id = String(draft[k] ?? '').trim();
        if (!id) return '(not chosen)';
        return byId.get(id) ?? id;
      },
    );
    return parts.join(' · ');
  }, [draft, canonRealmPickList]);

  const exportBlocks = useMemo(() => {
    return [
      { label: 'A1a Out-of-school Activities', value: mirrorA.personal },
      { label: 'A1b Classes/Subjects', value: mirrorA.academic },
      { label: 'A1c Work Preference', value: mirrorA.pref },
      { label: 'A1d Abilities', value: mirrorA.abilities },
      { label: 'A1e Areas to Strengthen', value: mirrorA.growthArea },
      { label: 'A1e Action Steps', value: mirrorA.growthAction },
      { label: 'B Careers of Interest', value: mirrorB.career },
      { label: 'B Education Requirements', value: mirrorB.education },
      { label: 'B Skills I Need', value: mirrorB.skills },
      { label: 'B Work Environment', value: mirrorB.environment },
      {
        label: 'Quest III Skills assessment (1–5)',
        value: [
          `Communication: ${mirrorSkills.communication || '⚠'}`,
          `Collaboration: ${mirrorSkills.collaboration || '⚠'}`,
          `Problem solving: ${mirrorSkills.problemSolving || '⚠'}`,
          `Self-management: ${mirrorSkills.selfManagement || '⚠'}`,
          mirrorSkills.evidence ? `Evidence: ${mirrorSkills.evidence}` : '',
        ]
          .filter(Boolean)
          .join('\n'),
      },
      { label: 'C Goals', value: mirrorC.goal },
      { label: 'C Education Plans', value: mirrorC.eduPlans },
      { label: 'C Action Steps', value: mirrorC.steps },
      { label: 'C Completed Steps', value: mirrorC.completed },
      { label: 'Scroll of Destiny — Foretold Signposts (canon realms)', value: signpostLineForExport },
    ];
  }, [mirrorA, mirrorB, mirrorC, mirrorSkills, signpostLineForExport]);

  const update = (key: string, value: string) => onDraftChange({ [key]: value });

  const fieldStep = useMemo(() => {
    const map: Record<string, StepId> = {
      student_name: 'self',
      personal_interests: 'self',
      academic_interests: 'self',
      work_preference: 'self',
      abilities_csv: 'self',
      growth_area: 'self',
      growth_action: 'self',
      career_interest: 'career',
      career_education: 'career',
      career_skills: 'career',
      career_environment: 'career',
      skill_communication: 'skills',
      skill_collaboration: 'skills',
      skill_problem_solving: 'skills',
      skill_self_management: 'skills',
      skill_evidence: 'skills',
      career_goal: 'goals',
      need_to_learn: 'goals',
      first_step: 'goals',
      completed_steps: 'goals',
      foretold_signpost_realm_1: 'export',
      foretold_signpost_realm_2: 'export',
      foretold_signpost_realm_3: 'export',
    };
    return map;
  }, []);

  const requiredFields: string[] = useMemo(
    () => [
      'student_name',
      'personal_interests',
      'academic_interests',
      'work_preference',
      'abilities_csv',
      'career_interest',
      'career_education',
      'career_skills',
      'career_environment',
      'skill_communication',
      'skill_collaboration',
      'skill_problem_solving',
      'skill_self_management',
      'career_goal',
      'need_to_learn',
      'first_step',
    ],
    [],
  );

  const findFirstMissing = (): string | null => {
    for (const k of requiredFields) {
      if (!String(draft[k] ?? '').trim()) return k;
    }
    return null;
  };

  return (
    <div className="lh-world-map__layout">
      <section className="lh-world-map__realms" aria-label="Manifest module">
        <h3 className="lh-heading-sm">Manifest (Janene’s SOD)</h3>
        <p className="lh-world-map__hint">
          Progress: <strong>{completionPct}%</strong> · Structured steps · Copy/export mirror
        </p>

        <div className="lh-panel" style={{ padding: 12, marginTop: 8 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {(
              [
                { id: 'self', label: 'Quest I: Self Knowledge' },
                { id: 'career', label: 'Quest II: Career Exploration' },
                { id: 'skills', label: 'Quest III: Skills Assessment' },
                { id: 'goals', label: 'Quest IV: Goals' },
                { id: 'export', label: 'Quest Log: Export' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                className={`lh-button lh-button--secondary ${step === t.id ? 'lh-world-realm-tile--selected' : ''}`}
                onClick={() => setStep(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {step === 'self' ? (
          <div className="lh-panel" style={{ padding: 12, marginTop: 12 }}>
            <label className="lh-world-map__label">
              Traveler name
              <input className="lh-input" value={draft.student_name ?? ''} onChange={(e) => update('student_name', e.target.value)} />
            </label>

            <label className="lh-world-map__label">
              Personal interests (top 3, one per line)
              <textarea
                className="lh-input lh-input--textarea"
                rows={3}
                value={draft.personal_interests ?? ''}
                onChange={(e) => update('personal_interests', e.target.value)}
              />
            </label>

            <label className="lh-world-map__label">
              Academic interests (top 3, one per line)
              <textarea
                className="lh-input lh-input--textarea"
                rows={3}
                value={draft.academic_interests ?? ''}
                onChange={(e) => update('academic_interests', e.target.value)}
              />
            </label>

            <label className="lh-world-map__label">
              Work preference (People / Ideas / Things)
              <input className="lh-input" value={draft.work_preference ?? ''} onChange={(e) => update('work_preference', e.target.value)} />
            </label>

            <label className="lh-world-map__label">
              Abilities (comma-separated)
              <input className="lh-input" value={draft.abilities_csv ?? ''} onChange={(e) => update('abilities_csv', e.target.value)} />
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <label className="lh-world-map__label">
                Area to strengthen
                <input className="lh-input" value={draft.growth_area ?? ''} onChange={(e) => update('growth_area', e.target.value)} />
              </label>
              <label className="lh-world-map__label">
                Step I will take
                <input className="lh-input" value={draft.growth_action ?? ''} onChange={(e) => update('growth_action', e.target.value)} />
              </label>
            </div>
          </div>
        ) : null}

        {step === 'career' ? (
          <div className="lh-panel" style={{ padding: 12, marginTop: 12 }}>
            <label className="lh-world-map__label">
              Career of interest
              <input className="lh-input" value={draft.career_interest ?? ''} onChange={(e) => update('career_interest', e.target.value)} />
            </label>
            <label className="lh-world-map__label">
              Education requirements
              <textarea
                className="lh-input lh-input--textarea"
                rows={3}
                value={draft.career_education ?? ''}
                onChange={(e) => update('career_education', e.target.value)}
              />
            </label>
            <label className="lh-world-map__label">
              Skills I need to acquire
              <textarea
                className="lh-input lh-input--textarea"
                rows={3}
                value={draft.career_skills ?? ''}
                onChange={(e) => update('career_skills', e.target.value)}
              />
            </label>
            <label className="lh-world-map__label">
              Work environment
              <textarea
                className="lh-input lh-input--textarea"
                rows={3}
                value={draft.career_environment ?? ''}
                onChange={(e) => update('career_environment', e.target.value)}
              />
            </label>
          </div>
        ) : null}

        {step === 'skills' ? (
          <div className="lh-panel" style={{ padding: 12, marginTop: 12 }}>
            <p className="lh-world-map__meta">
              Rate each skill from <strong>1 (needs work)</strong> to <strong>5 (strong)</strong>. Add one short piece of
              evidence.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {(
                [
                  { key: 'skill_communication', label: 'Communication' },
                  { key: 'skill_collaboration', label: 'Collaboration' },
                  { key: 'skill_problem_solving', label: 'Problem solving' },
                  { key: 'skill_self_management', label: 'Self-management' },
                ] as const
              ).map((s) => (
                <label key={s.key} className="lh-world-map__label">
                  {s.label}
                  <input
                    className="lh-input"
                    type="number"
                    min={1}
                    max={5}
                    value={draft[s.key] ?? ''}
                    onChange={(e) => update(s.key, e.target.value)}
                    placeholder="1–5"
                  />
                </label>
              ))}
            </div>

            <label className="lh-world-map__label" style={{ marginTop: 10 }}>
              Evidence (one sentence)
              <textarea
                className="lh-input lh-input--textarea"
                rows={3}
                value={draft.skill_evidence ?? ''}
                onChange={(e) => update('skill_evidence', e.target.value)}
                placeholder="Example: I collaborated by… / I communicated by…"
              />
            </label>
          </div>
        ) : null}

        {step === 'goals' ? (
          <div className="lh-panel" style={{ padding: 12, marginTop: 12 }}>
            <label className="lh-world-map__label">
              Career goal
              <input className="lh-input" value={draft.career_goal ?? ''} onChange={(e) => update('career_goal', e.target.value)} />
            </label>
            <label className="lh-world-map__label">
              Education plans (courses I need / want)
              <textarea
                className="lh-input lh-input--textarea"
                rows={3}
                value={draft.need_to_learn ?? ''}
                onChange={(e) => update('need_to_learn', e.target.value)}
              />
            </label>
            <label className="lh-world-map__label">
              First action step
              <textarea
                className="lh-input lh-input--textarea"
                rows={3}
                value={draft.first_step ?? ''}
                onChange={(e) => update('first_step', e.target.value)}
              />
            </label>
            <label className="lh-world-map__label">
              Completed steps?
              <select className="lh-input" value={draft.completed_steps ?? 'No'} onChange={(e) => update('completed_steps', e.target.value)}>
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </label>
          </div>
        ) : null}

        {step === 'export' ? (
          <div className="lh-panel" style={{ padding: 12, marginTop: 12 }}>
            {/* Scroll of Destiny preview */}
            <div style={{ marginBottom: 16 }}>
              <button
                type="button"
                className="lh-button lh-button--secondary lh-button--small"
                onClick={() => setShowScrollPreview((v) => !v)}
                style={{ marginBottom: showScrollPreview ? 10 : 0 }}
              >
                {showScrollPreview ? '▲ Hide Scroll Preview' : '▼ View Scroll of Destiny'}
              </button>
              {showScrollPreview && (
                <ScrollOfDestinyViewer
                  playerName={String(draft.student_name ?? '')}
                  foretoldSignpostRealmIds={[
                    String(draft.foretold_signpost_realm_1 ?? ''),
                    String(draft.foretold_signpost_realm_2 ?? ''),
                    String(draft.foretold_signpost_realm_3 ?? ''),
                  ].filter(Boolean)}
                  allRealms={canonRealmPickList.map((x) => ({
                    realm_id: x.realm_id,
                    display_name: x.label,
                  }))}
                  lifeGoals={mirrorA.personal}
                  careerValues={mirrorA.academic}
                  workspacePrefs={mirrorA.pref}
                  skills={mirrorA.abilities}
                  titleDesignation={mirrorB.career}
                  prophecySummary={mirrorC.goal}
                />
              )}
            </div>

            <section className="lh-manifest-scroll" aria-label="Scroll of Destiny signposts">
              <h4 className="lh-heading-sm" style={{ marginTop: 0 }}>
                Scroll of Destiny — three Foretold Signposts
              </h4>
              <p className="lh-world-map__meta">
                After the Mirror of Maia, name the three canon realms that call to you. They anchor your comparison
                ledger and map emphasis in Acts II–III; you may still explore all sixteen later.
              </p>
              {canonRealmPickList.length === 0 ? (
                <p className="lh-world-map__meta lh-world-map__meta--muted">Realm catalog unavailable — cannot seal signposts.</p>
              ) : (
                <div style={{ display: 'grid', gap: 10, marginTop: 10 }}>
                  {(
                    [
                      { key: 'foretold_signpost_realm_1', label: 'First signpost' },
                      { key: 'foretold_signpost_realm_2', label: 'Second signpost' },
                      { key: 'foretold_signpost_realm_3', label: 'Third signpost' },
                    ] as const
                  ).map((row) => (
                    <label key={row.key} className="lh-world-map__label">
                      {row.label}
                      <select
                        className="lh-input"
                        value={draft[row.key] ?? ''}
                        onChange={(e) => update(row.key, e.target.value)}
                      >
                        <option value="">— choose a realm —</option>
                        {canonRealmPickList.map((opt) => (
                          <option key={opt.realm_id} value={opt.realm_id}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>
              )}
            </section>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                type="button"
                className="lh-button lh-button--primary"
                onClick={async () => {
                  const all = exportBlocks.map((b) => `${b.label}\n${b.value || ''}`).join('\n\n');
                  const ok = await copyText(all);
                  setCopyStatus(ok ? 'Copied everything.' : 'Copy failed (clipboard blocked).');
                  window.setTimeout(() => setCopyStatus(''), 1800);
                }}
              >
                Copy everything
              </button>
              {copyStatus ? <span className="lh-world-map__meta">{copyStatus}</span> : null}
            </div>

            <ul className="lh-world-map__fog-list" aria-label="Export blocks" style={{ marginTop: 12 }}>
              {exportBlocks.map((b) => (
                <li key={b.label} className="lh-world-map__fog-row" style={{ alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <strong>{b.label}</strong>
                    <pre style={{ whiteSpace: 'pre-wrap', margin: '8px 0 0', color: '#94a3b8' }}>{b.value || '⚠ Empty'}</pre>
                  </div>
                  {!String(b.value || '').trim() ? (
                    <button
                      type="button"
                      className="lh-button lh-button--secondary lh-button--small"
                      onClick={() => {
                        const missing = findFirstMissing();
                        const target = missing ? fieldStep[missing] ?? 'self' : 'self';
                        setStep(target);
                        setCopyStatus(`Empty fields — jumped to ${target}.`);
                        window.setTimeout(() => setCopyStatus(''), 2200);
                      }}
                    >
                      Jump
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="lh-button lh-button--ghost lh-button--small"
                    onClick={async () => {
                      const ok = await copyText(b.value || '');
                      setCopyStatus(ok ? `Copied: ${b.label}` : 'Copy failed (clipboard blocked).');
                      window.setTimeout(() => setCopyStatus(''), 1800);
                    }}
                    disabled={!String(b.value || '').trim()}
                  >
                    Copy
                  </button>
                </li>
              ))}
            </ul>

            <div className="lh-world-map__actions" style={{ marginTop: 12 }}>
              <button
                type="button"
                className="lh-button lh-button--primary"
                onClick={() => {
                  const missing = findFirstMissing();
                  if (missing) {
                    const target = fieldStep[missing] ?? 'self';
                    setStep(target);
                    setCopyStatus(`Missing required field — jumped to ${target}.`);
                    window.setTimeout(() => setCopyStatus(''), 2200);
                    return;
                  }
                  const allowedIds = new Set(canonRealmPickList.map((x) => x.realm_id));
                  const signIds = normalizeForetoldSignpostRealmIds(signpostsFromManifestDraft(draft), allowedIds);
                  if (signIds.length < 3) {
                    setStep('export');
                    setCopyStatus('Choose three different realms as your Foretold Signposts before sealing.');
                    window.setTimeout(() => setCopyStatus(''), 3200);
                    return;
                  }
                  const created = nowIso();
                  onSubmitResult({
                    module_id: 'mod_manifest_sod',
                    quest_id: 'mq-106',
                    realm_id: 'realm_archives_ascension',
                    status: 'completed',
                    score: completionPct,
                    artifacts: { foretold_signpost_realm_ids: signIds },
                    unlocks: [],
                    completed_at_iso: created,
                  });
                }}
              >
                Seal the manifest & return
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}

