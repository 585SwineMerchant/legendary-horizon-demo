import { useState, useMemo } from 'react';

import type { ModuleResultPayload } from '../../types';

type Props = {
  draft: Record<string, string>;
  onDraftChange: (patch: Partial<Record<string, string>>) => void;
  onSubmitResult: (payload: ModuleResultPayload) => void;
  realmId: string;
  /** Player's True Path career cluster — used to highlight aligned courses */
  truePathCareerCluster?: string;
};

/**
 * EP-102 "Course Selection Ritual"
 *
 * The student reviews available 7th-grade elective courses and selects the
 * ones that align with their True Path goals.
 *
 * Design principles:
 *   - Data-driven: ELECTIVE_CATALOG below can be replaced by a Google Sheet /
 *     config JSON once the school's actual course list is finalized.
 *   - Lore-framed: "Each year, new paths open."
 *   - Aligned courses highlighted based on truePathCareerCluster.
 *   - Selections saved to player profile; quest completes on confirm.
 *   - Yearly ritual framing — not a one-time event.
 *
 * PLACEHOLDER: Replace ELECTIVE_CATALOG with the school's actual 7th grade
 * electives. The `alignedClusters` array marks which career clusters benefit
 * most from each course.
 */

type ElectiveCourse = {
  id: string;
  name: string;
  description: string;
  alignedClusters: string[];
};

const ELECTIVE_CATALOG: ElectiveCourse[] = [
  {
    id: 'elective_art_studio',
    name: 'Art Studio',
    description: 'Explore drawing, painting, design, and visual storytelling.',
    alignedClusters: ['Arts, AV & Communications', 'Marketing & Sales'],
  },
  {
    id: 'elective_band',
    name: 'Band / Music',
    description: 'Develop musical performance skills in an ensemble setting.',
    alignedClusters: ['Arts, AV & Communications'],
  },
  {
    id: 'elective_tech_ed',
    name: 'Technology & Engineering',
    description: 'Hands-on design challenges: build, prototype, and solve problems.',
    alignedClusters: ['STEM', 'Manufacturing', 'Construction & Engineering', 'Architecture & Construction'],
  },
  {
    id: 'elective_coding',
    name: 'Introduction to Coding',
    description: 'Learn Python and web basics through projects and games.',
    alignedClusters: ['Information Technology', 'STEM'],
  },
  {
    id: 'elective_health',
    name: 'Health & Wellness',
    description: 'Study nutrition, fitness, mental health, and personal wellness.',
    alignedClusters: ['Health Science', 'Human Services'],
  },
  {
    id: 'elective_business',
    name: 'Business Foundations',
    description: 'Learn entrepreneurship, finance basics, and workplace skills.',
    alignedClusters: ['Finance', 'Marketing & Sales', 'Government & Public Administration'],
  },
  {
    id: 'elective_leadership',
    name: 'Leadership & Community Service',
    description: 'Develop leadership, communication, and community action skills.',
    alignedClusters: ['Government & Public Administration', 'Human Services', 'Education & Training'],
  },
  {
    id: 'elective_culinary',
    name: 'Culinary Arts',
    description: 'Explore cooking techniques, food science, and kitchen safety.',
    alignedClusters: ['Hospitality & Tourism', 'Agriculture & Natural Resources'],
  },
  {
    id: 'elective_drama',
    name: 'Drama & Performance',
    description: 'Develop public speaking, acting, and storytelling through theater.',
    alignedClusters: ['Arts, AV & Communications', 'Education & Training'],
  },
  {
    id: 'elective_media',
    name: 'Digital Media & Journalism',
    description: 'Create videos, podcasts, and articles for school media.',
    alignedClusters: ['Arts, AV & Communications', 'Marketing & Sales', 'Information Technology'],
  },
  {
    id: 'elective_env_science',
    name: 'Environmental Science',
    description: 'Explore ecosystems, sustainability, and conservation.',
    alignedClusters: ['Agriculture & Natural Resources', 'STEM'],
  },
  {
    id: 'elective_spanish',
    name: 'Spanish Language',
    description: 'Develop conversational Spanish and cultural literacy.',
    alignedClusters: ['Hospitality & Tourism', 'Human Services', 'Government & Public Administration'],
  },
];

function nowIso(): string {
  return new Date().toISOString();
}

export function EP102CourseSelectionModule({
  draft,
  onDraftChange,
  onSubmitResult,
  realmId,
  truePathCareerCluster = '',
}: Props) {
  // Parse previously saved selections
  const savedSelections: string[] = useMemo(() => {
    try {
      return JSON.parse(draft.ep102_selected_courses ?? '[]');
    } catch {
      return [];
    }
  }, [draft.ep102_selected_courses]);

  const [selected, setSelected] = useState<Set<string>>(new Set(savedSelections));
  const [confirmed, setConfirmed] = useState(draft.ep102_submitted_iso != null);

  function toggleCourse(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      onDraftChange({ ep102_selected_courses: JSON.stringify([...next]) });
      return next;
    });
  }

  function isAligned(course: ElectiveCourse): boolean {
    if (!truePathCareerCluster) return false;
    return course.alignedClusters.some(
      (c) => c.toLowerCase() === truePathCareerCluster.toLowerCase(),
    );
  }

  if (confirmed) {
    const selectedCourses = ELECTIVE_CATALOG.filter((c) => selected.has(c.id));
    return (
      <div className="lh-world-map__layout">
        <section className="lh-world-map__realms" aria-label="Course Selection complete">
          <div
            className="lh-panel"
            style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' }}
          >
            <div style={{ fontSize: 48 }} aria-hidden>⭐</div>
            <h3 className="lh-heading-sm" style={{ marginTop: 0 }}>
              Course Selection Ritual — Complete
            </h3>
            <p className="lh-world-map__hint" style={{ maxWidth: 440 }}>
              The Codex has recorded your chosen studies for next year. Until the
              next cycle begins, carry what you have learned with you.
            </p>
            {selectedCourses.length > 0 && (
              <div style={{ textAlign: 'left', width: '100%', maxWidth: 360 }}>
                <p style={{ margin: '0 0 8px', fontWeight: 600, fontSize: '0.9em' }}>
                  Your chosen courses:
                </p>
                <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {selectedCourses.map((c) => (
                    <li key={c.id} className="lh-world-map__meta" style={{ fontSize: '0.88em' }}>
                      {c.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <p className="lh-world-map__meta" style={{ fontStyle: 'italic', color: '#f59e0b', marginTop: 8 }}>
              "Each year, new paths open. Until we meet again, Traveler."
            </p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="lh-world-map__layout">
      <section className="lh-world-map__realms" aria-label="Course Selection Ritual">
        <h3 className="lh-heading-sm">Course Selection Ritual</h3>
        <p className="lh-world-map__hint">
          Each year, new paths open — new studies, new skills, new choices. The
          courses you select now will carry you closer to your True Path. Choose
          the studies that serve your journey.
        </p>

        {truePathCareerCluster && (
          <div
            style={{
              padding: '8px 14px',
              background: 'rgba(245,158,11,0.1)',
              border: '1px solid rgba(245,158,11,0.3)',
              borderRadius: 6,
              marginTop: 8,
              fontSize: '0.88em',
            }}
          >
            ⭐{' '}
            <strong>Courses aligned with your True Path</strong>{' '}
            ({truePathCareerCluster}) are highlighted in gold.
          </div>
        )}

        <p
          className="lh-world-map__meta"
          style={{ marginTop: 10, fontSize: '0.85em' }}
        >
          Select one or more electives you would like to take next year. These
          choices help your teacher understand your interests — talk to your
          school counselor to finalize your actual schedule.
        </p>

        {/* Course grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 10,
            marginTop: 12,
          }}
        >
          {ELECTIVE_CATALOG.map((course) => {
            const active = selected.has(course.id);
            const aligned = isAligned(course);
            return (
              <button
                key={course.id}
                type="button"
                onClick={() => toggleCourse(course.id)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  padding: '12px 14px',
                  background: active
                    ? 'rgba(34,197,94,0.1)'
                    : aligned
                      ? 'rgba(245,158,11,0.07)'
                      : 'rgba(17,21,32,0.6)',
                  border: `1px solid ${
                    active
                      ? 'rgba(34,197,94,0.5)'
                      : aligned
                        ? 'rgba(245,158,11,0.35)'
                        : 'rgba(148,163,184,0.12)'
                  }`,
                  borderRadius: 6,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s',
                  position: 'relative',
                }}
                aria-pressed={active}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
                  {aligned && (
                    <span
                      style={{ fontSize: 13, flexShrink: 0 }}
                      title={`Aligned with ${truePathCareerCluster}`}
                    >
                      ⭐
                    </span>
                  )}
                  <p
                    style={{
                      margin: 0,
                      fontWeight: 600,
                      fontSize: '0.9em',
                      color: active ? '#86efac' : '#f1f5f9',
                      flex: 1,
                    }}
                  >
                    {course.name}
                  </p>
                  {active && (
                    <span style={{ fontSize: 16, color: '#22c55e', flexShrink: 0 }}>✓</span>
                  )}
                </div>
                <p
                  className="lh-world-map__meta"
                  style={{ margin: '4px 0 0', fontSize: '0.82em', lineHeight: 1.35 }}
                >
                  {course.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* Selection summary + confirm */}
        <div
          className="lh-panel"
          style={{ padding: 16, marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}
        >
          <p style={{ margin: 0, fontSize: '0.88em' }}>
            <strong>{selected.size}</strong> course{selected.size !== 1 ? 's' : ''} selected
            {selected.size > 0 ? ':' : '.'}
            {selected.size > 0 && (
              <span className="lh-world-map__meta" style={{ marginLeft: 6 }}>
                {[...selected]
                  .map((id) => ELECTIVE_CATALOG.find((c) => c.id === id)?.name ?? id)
                  .join(', ')}
              </span>
            )}
          </p>
          <div className="lh-world-map__actions">
            <button
              type="button"
              className="lh-button lh-button--primary"
              disabled={selected.size === 0}
              onClick={() => {
                const completedAt = nowIso();
                const courseNames = [...selected]
                  .map((id) => ELECTIVE_CATALOG.find((c) => c.id === id)?.name ?? id)
                  .join(', ');
                onDraftChange({
                  ep102_submitted_iso: completedAt,
                  ep102_selected_courses: JSON.stringify([...selected]),
                });
                setConfirmed(true);
                onSubmitResult({
                  module_id: 'mod_ep102_course_selection',
                  quest_id: 'ep-102',
                  realm_id: realmId,
                  status: 'completed',
                  artifacts: {
                    selected_courses: [...selected].join(','),
                    course_names: courseNames,
                    completed_at: completedAt,
                  },
                  completed_at_iso: completedAt,
                });
              }}
            >
              Seal my course selections ✓
            </button>
          </div>
          {selected.size === 0 && (
            <p className="lh-world-map__meta" style={{ margin: 0, fontSize: '0.82em' }}>
              Select at least one course above.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
