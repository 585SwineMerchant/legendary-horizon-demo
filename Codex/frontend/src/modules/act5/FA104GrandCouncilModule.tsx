import { useState } from 'react';

import type { ModuleResultPayload } from '../../types';

type Props = {
  draft: Record<string, string>;
  onDraftChange: (patch: Partial<Record<string, string>>) => void;
  onSubmitResult: (payload: ModuleResultPayload) => void;
  realmId: string;
};

/**
 * FA-104 "Present at the Grand Council — Career Fair"
 *
 * This is an in-class event, not an interactive module.
 * The student:
 *   1. Presents their Chronicle of the Horizon to the class
 *   2. Attends other students' presentations
 *
 * Completion: student self-reports both parts, OR teacher marks it complete
 * via the dashboard (teacher flag sets quest to turned_in).
 *
 * Both "I presented" + "I attended" must be checked before the confirm
 * button activates.
 */

function nowIso(): string {
  return new Date().toISOString();
}

export function FA104GrandCouncilModule({
  draft,
  onDraftChange,
  onSubmitResult,
  realmId,
}: Props) {
  const [presented, setPresented] = useState(draft.fa104_presented === 'true');
  const [attended, setAttended] = useState(draft.fa104_attended === 'true');
  const [confirmed, setConfirmed] = useState(draft.fa104_submitted_iso != null);

  const canSubmit = presented && attended;

  if (confirmed) {
    return (
      <div className="lh-world-map__layout">
        <section className="lh-world-map__realms" aria-label="Grand Council complete">
          <div
            className="lh-panel"
            style={{ padding: 24, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}
          >
            <div style={{ fontSize: 48 }} aria-hidden>🏆</div>
            <h3 className="lh-heading-sm" style={{ marginTop: 0 }}>
              Grand Council — Complete
            </h3>
            <p className="lh-world-map__hint" style={{ maxWidth: 460 }}>
              The Grand Council has convened. Your voice was heard among your
              peers. The realm remembers what you have shared, and what you have
              learned from others.
            </p>
            <p className="lh-world-map__meta" style={{ fontStyle: 'italic', color: '#f59e0b' }}>
              "Your story is now part of the Chronicle of this realm."
            </p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="lh-world-map__layout">
      <section className="lh-world-map__realms" aria-label="Grand Council — Career Fair">
        <h3 className="lh-heading-sm">The Grand Council</h3>
        <p className="lh-world-map__hint">
          The Grand Council is your class career fair — a gathering of Travelers
          who will each share their Chronicle of the Horizon. This is not just a
          presentation. It is a ceremony. Your research, your path, your voice.
        </p>

        <div className="lh-panel" style={{ padding: 16, marginTop: 10, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h4 className="lh-heading-sm" style={{ marginTop: 0 }}>What happens at the Grand Council</h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              {
                icon: '🎤',
                title: 'You Present Your Chronicle',
                desc: 'Walk your classmates and teacher through your 6-slide Chronicle of the Horizon. Share your True Path, your research, and what you learned from your real-world interview.',
              },
              {
                icon: '👂',
                title: 'You Listen to Other Travelers',
                desc: 'Attend your peers\' presentations. You may discover careers you hadn\'t considered, paths that overlap with yours, and stories from other Travelers\' research.',
              },
            ].map((item) => (
              <div
                key={item.title}
                style={{
                  display: 'flex',
                  gap: 12,
                  padding: '12px 14px',
                  background: 'rgba(245,158,11,0.06)',
                  border: '1px solid rgba(245,158,11,0.18)',
                  borderRadius: 6,
                }}
              >
                <span style={{ fontSize: 28, flexShrink: 0 }}>{item.icon}</span>
                <div>
                  <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: '0.9em' }}>{item.title}</p>
                  <p className="lh-world-map__meta" style={{ margin: 0, fontSize: '0.84em' }}>
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Self-report checkboxes */}
        <div className="lh-panel" style={{ padding: 16, marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h4 className="lh-heading-sm" style={{ marginTop: 0 }}>
            After the Grand Council, confirm your participation:
          </h4>

          <label
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              cursor: 'pointer',
              padding: '10px 12px',
              background: presented ? 'rgba(34,197,94,0.08)' : 'rgba(148,163,184,0.06)',
              border: `1px solid ${presented ? 'rgba(34,197,94,0.3)' : 'rgba(148,163,184,0.15)'}`,
              borderRadius: 6,
              transition: 'all 0.2s',
            }}
          >
            <input
              type="checkbox"
              checked={presented}
              onChange={(e) => {
                setPresented(e.target.checked);
                onDraftChange({ fa104_presented: e.target.checked ? 'true' : 'false' });
              }}
              style={{ marginTop: 2, flexShrink: 0 }}
            />
            <div>
              <p style={{ margin: '0 0 2px', fontWeight: 600, fontSize: '0.9em' }}>
                I presented my Chronicle of the Horizon to the class
              </p>
              <p className="lh-world-map__meta" style={{ margin: 0, fontSize: '0.82em' }}>
                I shared my True Path, research, and what I learned during this journey.
              </p>
            </div>
          </label>

          <label
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              cursor: 'pointer',
              padding: '10px 12px',
              background: attended ? 'rgba(34,197,94,0.08)' : 'rgba(148,163,184,0.06)',
              border: `1px solid ${attended ? 'rgba(34,197,94,0.3)' : 'rgba(148,163,184,0.15)'}`,
              borderRadius: 6,
              transition: 'all 0.2s',
            }}
          >
            <input
              type="checkbox"
              checked={attended}
              onChange={(e) => {
                setAttended(e.target.checked);
                onDraftChange({ fa104_attended: e.target.checked ? 'true' : 'false' });
              }}
              style={{ marginTop: 2, flexShrink: 0 }}
            />
            <div>
              <p style={{ margin: '0 0 2px', fontWeight: 600, fontSize: '0.9em' }}>
                I attended and listened to other Travelers' presentations
              </p>
              <p className="lh-world-map__meta" style={{ margin: 0, fontSize: '0.82em' }}>
                I was present and engaged during the career fair.
              </p>
            </div>
          </label>
        </div>

        <div className="lh-world-map__actions" style={{ marginTop: 12 }}>
          <button
            type="button"
            className="lh-button lh-button--primary"
            disabled={!canSubmit}
            onClick={() => {
              const completedAt = nowIso();
              onDraftChange({ fa104_submitted_iso: completedAt });
              setConfirmed(true);
              onSubmitResult({
                module_id: 'mod_fa104_grand_council',
                quest_id: 'fa-104',
                realm_id: realmId,
                status: 'submitted',
                artifacts: {
                  presented: 'true',
                  attended: 'true',
                  submitted_at: completedAt,
                },
                completed_at_iso: completedAt,
              });
            }}
          >
            Seal the Grand Council record ✓
          </button>
        </div>

        {!canSubmit && (
          <p className="lh-world-map__meta" style={{ marginTop: 6, fontSize: '0.82em' }}>
            Check both boxes after participating in the Grand Council to confirm.
          </p>
        )}
      </section>
    </div>
  );
}
