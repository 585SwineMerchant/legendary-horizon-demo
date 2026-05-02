import { useMemo, useState } from 'react';

import type { ModuleResultPayload } from '../../types';

type Props = {
  draft: Record<string, string>;
  onDraftChange: (patch: Partial<Record<string, string>>) => void;
  onSubmitResult: (payload: ModuleResultPayload) => void;
};

type ScoreRow = {
  field: string;
  pts: number;
  max: number;
  rating: 'green' | 'yellow' | 'red';
  msg: string;
};

const requiredKeys = [
  'period',
  'fname',
  'lname',
  'email',
  'position',
  'school',
  'grade',
  'avail_days_csv',
  'whyjob',
  'refname',
] as const;

function pctComplete(draft: Record<string, string>): number {
  const have = requiredKeys.filter((k) => Boolean(String(draft[k] ?? '').trim())).length;
  return Math.round((have / requiredKeys.length) * 100);
}

function scoreDraft(draft: Record<string, string>): { score: number; rows: ScoreRow[]; pct: number; msg: string } {
  const email = String(draft.email ?? '').trim();
  const school = String(draft.school ?? '').trim();
  const grade = String(draft.grade ?? '').trim();
  const availCount = String(draft.avail_days_csv ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean).length;
  const why = String(draft.whyjob ?? '').trim();
  const star = String(draft.star ?? '').trim();
  const refname = String(draft.refname ?? '').trim();
  const phone = String(draft.phone ?? '').trim();
  const startdate = String(draft.startdate ?? '').trim();
  const position = String(draft.position ?? '').trim();

  const rows: ScoreRow[] = [];
  let score = 0;

  const funnyEmail = /gamer|killer|swag|cool69|sexy|420|xX/i.test(email);
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const eS = !funnyEmail && validEmail ? 2 : 0;
  score += eS;
  rows.push({
    field: 'Email address',
    pts: eS,
    max: 2,
    rating: eS === 2 ? 'green' : 'red',
    msg: eS === 2 ? 'Professional, valid email address.' : funnyEmail ? 'Unprofessional email — employers notice these.' : 'Email does not appear valid.',
  });

  const edS = school.length > 4 && grade ? 2 : school.length > 4 || grade ? 1 : 0;
  score += edS;
  rows.push({
    field: 'Education',
    pts: edS,
    max: 2,
    rating: edS === 2 ? 'green' : edS === 1 ? 'yellow' : 'red',
    msg: edS === 2 ? 'School and grade both filled in.' : edS === 1 ? 'Make sure both school name and grade are completed.' : 'Education section incomplete.',
  });

  const aS = availCount >= 4 ? 2 : availCount >= 2 ? 1 : 0;
  score += aS;
  rows.push({
    field: 'Availability',
    pts: aS,
    max: 2,
    rating: aS === 2 ? 'green' : aS === 1 ? 'yellow' : 'red',
    msg: aS === 2 ? 'Great availability.' : aS === 1 ? 'Reasonable — more flexibility helps.' : 'Very limited availability listed.',
  });

  const whyLow = /money|cash|bored|nothing else|my mom|my dad|friend made/i.test(why);
  const whyShort = why.split(/\s+/).filter(Boolean).length < 10;
  const wS = !whyLow && !whyShort ? 3 : whyLow ? 0 : 1;
  score += wS;
  rows.push({
    field: '"Why this job?"',
    pts: wS,
    max: 3,
    rating: wS === 3 ? 'green' : wS === 1 ? 'yellow' : 'red',
    msg: wS === 3 ? 'Strong answer — focused on the role.' : wS === 0 ? 'Mentioning money/pressure hurts your application.' : 'Too brief — add specific reasons tied to the role.',
  });

  const sw = star.split(/\s+/).filter(Boolean).length;
  const hasI = /\bI\b/.test(star);
  const hasResult = /grade|won|finished|helped|solved|learned|result|outcome|success|improved/i.test(star);
  const stS = !star ? 0 : sw >= 15 && hasI && hasResult ? 3 : sw >= 10 ? 1 : 0;
  score += stS;
  rows.push({
    field: 'Problem-solving example',
    pts: stS,
    max: 3,
    rating: stS === 3 ? 'green' : stS === 1 ? 'yellow' : 'red',
    msg: !star ? 'Left blank — missed opportunity.' : stS === 3 ? 'Excellent STAR method.' : stS === 1 ? 'Good start — add more detail and outcome.' : 'Too brief — use STAR: Situation → Action → Result.',
  });

  const isFamily = /mom|dad|mother|father|grandma|grandpa|aunt|uncle|parent|brother|sister/i.test(refname);
  const rS = !isFamily && refname ? 2 : 0;
  score += rS;
  rows.push({
    field: 'Reference',
    pts: rS,
    max: 2,
    rating: rS === 2 ? 'green' : 'red',
    msg: rS === 2 ? 'Appropriate non-family reference.' : isFamily ? 'Family members cannot be references.' : 'Reference was left blank.',
  });

  const comp = Boolean(phone && startdate && position);
  const cS = comp ? 2 : phone || startdate ? 1 : 0;
  score += cS;
  rows.push({
    field: 'Completeness',
    pts: cS,
    max: 2,
    rating: cS === 2 ? 'green' : cS === 1 ? 'yellow' : 'red',
    msg: cS === 2 ? 'All key fields filled in.' : cS ? 'Some fields left blank.' : 'Several optional fields left blank.',
  });

  const pct = Math.round((score / 16) * 100);
  const msg =
    pct >= 85
      ? 'Excellent work! Your application is thorough and professional.'
      : pct >= 60
        ? 'Solid effort! Stronger answers in the key sections would make this stand out more.'
        : 'Good first attempt! Review each feedback point below and revise for professionalism.';

  return { score, rows, pct, msg };
}

function runeId(): string {
  return `gt101_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function EnrollmentRuneModule({ draft, onDraftChange, onSubmitResult }: Props) {
  const [submitted, setSubmitted] = useState<null | { score: number; pct: number; msg: string; rows: ScoreRow[] }>(
    null,
  );

  const completePct = useMemo(() => pctComplete(draft), [draft]);
  const canSubmit = completePct === 100;

  const update = (key: string, value: string) => onDraftChange({ [key]: value });
  const toggleAvail = (day: string, checked: boolean) => {
    const set = new Set(
      String(draft.avail_days_csv ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    );
    if (checked) set.add(day);
    else set.delete(day);
    update('avail_days_csv', [...set].join(', '));
  };

  if (submitted) {
    return (
      <div className="lh-world-map__side">
        <h3 className="lh-heading-md">Application Submitted</h3>
        <p className="lh-world-map__meta">{submitted.msg}</p>
        <div className="lh-panel" style={{ marginTop: 12 }}>
          <p className="lh-world-map__meta">
            <strong>Score:</strong> {submitted.score} / 16 ({submitted.pct}%)
          </p>
          <ul className="lh-world-map__fog-list" aria-label="Feedback">
            {submitted.rows.map((r) => (
              <li key={r.field} className="lh-world-map__fog-row">
                <span>
                  <strong>{r.field}</strong> ({r.pts}/{r.max}) — {r.msg}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="lh-world-map__actions" style={{ marginTop: 12 }}>
          <button
            type="button"
            className="lh-button lh-button--primary"
            onClick={() => {
              const now = new Date().toISOString();
              onSubmitResult({
                module_id: 'mod_gt101_enrollment_rune',
                quest_id: 'gq_gt101_enrollment_rune',
                realm_id: 'realm_crossroads_haven',
                status: 'submitted',
                score: submitted.score,
                artifacts: {
                  application: { submission_id: runeId(), storage: 'local', created_iso: now },
                },
                unlocks: [{ kind: 'unlock_module', target_id: 'mod_gt102_trial_of_tongues' }],
                completed_at_iso: now,
              });
            }}
          >
            Seal the rune & return
          </button>
          <button type="button" className="lh-button lh-button--ghost" onClick={() => setSubmitted(null)}>
            Review / edit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="lh-world-map__layout">
      <section className="lh-world-map__realms" aria-label="Enrollment form">
        <h3 className="lh-heading-sm">Employment Application (Guild Trial)</h3>
        <p className="lh-world-map__hint">
          Complete required fields to unlock submission. Progress: <strong>{completePct}%</strong>
        </p>
        <div className="lh-panel" style={{ padding: 12, marginTop: 8 }}>
          <label className="lh-world-map__label">
            Class period (required)
            <select className="lh-input" value={draft.period ?? ''} onChange={(e) => update('period', e.target.value)}>
              <option value="">-- Select --</option>
              {['Green', 'Blue', 'Yellow', 'Purple', 'Orange'].map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <label className="lh-world-map__label">
              First name (required)
              <input className="lh-input" value={draft.fname ?? ''} onChange={(e) => update('fname', e.target.value)} />
            </label>
            <label className="lh-world-map__label">
              Last name (required)
              <input className="lh-input" value={draft.lname ?? ''} onChange={(e) => update('lname', e.target.value)} />
            </label>
          </div>

          <label className="lh-world-map__label">
            Email (required)
            <input className="lh-input" value={draft.email ?? ''} onChange={(e) => update('email', e.target.value)} />
          </label>

          <label className="lh-world-map__label">
            Phone
            <input className="lh-input" value={draft.phone ?? ''} onChange={(e) => update('phone', e.target.value)} />
          </label>

          <label className="lh-world-map__label">
            Position applying for (required)
            <input
              className="lh-input"
              value={draft.position ?? ''}
              onChange={(e) => update('position', e.target.value)}
              placeholder="e.g. Host / Dishwasher"
            />
          </label>

          <label className="lh-world-map__label">
            Current school (required)
            <input className="lh-input" value={draft.school ?? ''} onChange={(e) => update('school', e.target.value)} />
          </label>

          <label className="lh-world-map__label">
            Grade (required)
            <select className="lh-input" value={draft.grade ?? ''} onChange={(e) => update('grade', e.target.value)}>
              <option value="">-- Select --</option>
              {['6th', '7th', '8th', '9th', '10th', '11th', '12th'].map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </label>

          <label className="lh-world-map__label">
            Days available (required)
            <div className="lh-stack" style={{ gap: 6 }}>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => {
                const set = new Set(
                  String(draft.avail_days_csv ?? '')
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean),
                );
                const checked = set.has(d);
                return (
                  <label key={d} className="lh-a11y-toggle">
                    <input type="checkbox" checked={checked} onChange={(e) => toggleAvail(d, e.target.checked)} />
                    {d}
                  </label>
                );
              })}
            </div>
          </label>

          <label className="lh-world-map__label">
            Earliest start date
            <input
              className="lh-input"
              value={draft.startdate ?? ''}
              onChange={(e) => update('startdate', e.target.value)}
              placeholder="e.g. June 2"
            />
          </label>

          <label className="lh-world-map__label">
            Why do you want this job? (required)
            <textarea
              className="lh-input lh-input--textarea"
              rows={3}
              value={draft.whyjob ?? ''}
              onChange={(e) => update('whyjob', e.target.value)}
            />
          </label>

          <label className="lh-world-map__label">
            Problem-solving example (STAR method)
            <textarea
              className="lh-input lh-input--textarea"
              rows={3}
              value={draft.star ?? ''}
              onChange={(e) => update('star', e.target.value)}
            />
          </label>

          <label className="lh-world-map__label">
            Reference name (required)
            <input
              className="lh-input"
              value={draft.refname ?? ''}
              onChange={(e) => update('refname', e.target.value)}
              placeholder="Teacher, coach, neighbor…"
            />
          </label>
        </div>

        <div className="lh-world-map__actions" style={{ marginTop: 12 }}>
          <button
            type="button"
            className="lh-button lh-button--primary"
            disabled={!canSubmit}
            onClick={() => {
              const scored = scoreDraft(draft);
              setSubmitted(scored);
            }}
          >
            Submit application
          </button>
          {!canSubmit ? <p className="lh-world-map__meta">Fill all required fields to submit.</p> : null}
        </div>
      </section>
    </div>
  );
}

