import type { RealmDefinition } from '../types';

type Props = {
  /** Up to three canon realm IDs from the Manifest Scroll (Foretold Signposts). */
  foretoldSignpostRealmIds: readonly string[];
  /** Full realm catalogue — used to resolve IDs to display names. */
  allRealms: readonly RealmDefinition[];
  /**
   * Draft for `mod_oracle_of_fate` — when present and contains `prophecy_id`,
   * a "Your Prophecy" section is rendered below the signposts.
   */
  oracleDraft?: Record<string, string>;
  /** Optional handler to open the BLS link for the prophecy. */
  onReviewProphecy?: () => void;
  /** Optional handler to open the Quest of Fate Worksheet module. */
  onOpenQuestOfFate?: () => void;
  /** Optional close / back handler for overlay contexts. */
  onClose?: () => void;
};

function resolveRealmName(id: string, allRealms: readonly RealmDefinition[]): string {
  return allRealms.find((r) => r.realm_id === id)?.display_name ?? id;
}

/**
 * ScrollOfDestinyViewer — live viewer for a player's Scroll of Destiny.
 *
 * Shows:
 *  1. Foretold Signpost realms (up to 3) from the Manifest Scroll.
 *  2. "Your Prophecy" section — only when `oracleDraft` contains a `prophecy_id`.
 *
 * Used anywhere the player can review their running destiny record (e.g. the
 * Exploration HUD, a dedicated scroll overlay, or a teacher-tools preview pane).
 */
export function ScrollOfDestinyViewer({
  foretoldSignpostRealmIds,
  allRealms,
  oracleDraft,
  onReviewProphecy,
  onOpenQuestOfFate,
  onClose,
}: Props) {
  const hasSignposts = foretoldSignpostRealmIds.length > 0;

  const prophecyId = oracleDraft?.prophecy_id ? Number(oracleDraft.prophecy_id) : 0;
  const prophecyTitle = oracleDraft?.prophecy_title ?? '';
  const hasProphecy = prophecyId > 0 && prophecyTitle.length > 0;

  return (
    <div className="lh-scroll-reveal">
      <header className="lh-scroll-reveal__header">
        <p className="lh-eyebrow">Scroll of Destiny</p>
        <h2 className="lh-scroll-reveal__title">Your destiny record</h2>
        <p className="lh-scroll-reveal__lede">
          The paths ahead are written here. Signposts were chosen from your Manifest; your Oracle prophecy was woven
          when you consulted the Oracle of Fate.
        </p>
      </header>

      <div className="lh-scroll-reveal__seal" aria-hidden>
        LH
      </div>

      {/* Foretold Signposts */}
      <section className="lh-scroll-reveal__panel" aria-label="Foretold signposts">
        <h3 className="lh-heading-sm lh-scroll-reveal__section-title">Foretold signposts</h3>
        {hasSignposts ? (
          <div className="lh-scroll-reveal__signposts">
            {foretoldSignpostRealmIds.map((id, index) => (
              <article key={id} className="lh-scroll-reveal__signpost">
                <span className="lh-scroll-reveal__signpost-index">0{index + 1}</span>
                <h4>{resolveRealmName(id, allRealms)}</h4>
                <p className="lh-world-map__meta" style={{ margin: 0 }}>
                  Realm to explore and compare
                </p>
              </article>
            ))}
          </div>
        ) : (
          <p className="lh-world-map__meta">
            Signposts appear here after you complete the Manifest of the Seal of Destiny (Act I).
          </p>
        )}
      </section>

      {/* Prophecy section — conditional on oracle draft */}
      <section className="lh-scroll-reveal__panel" aria-label="Oracle prophecy">
        <h3 className="lh-heading-sm lh-scroll-reveal__section-title">Your prophecy</h3>
        {hasProphecy ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '12px 16px',
              background: 'rgba(212,160,23,0.1)',
              borderRadius: 6,
              borderLeft: '3px solid #d4a017',
            }}
          >
            <span
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: '#f59e0b',
                minWidth: 48,
                textAlign: 'center',
              }}
              aria-hidden
            >
              #{prophecyId}
            </span>
            <div>
              <p
                className="lh-world-map__meta"
                style={{ margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', opacity: 0.7 }}
              >
                Destiny #{prophecyId}
              </p>
              <p
                className="lh-scroll-reveal__title"
                style={{ margin: 0, fontSize: 16 }}
              >
                {prophecyTitle}
              </p>
            </div>
          </div>
        ) : (
          <p className="lh-world-map__meta">
            Your prophecy appears here after you consult the Oracle of Fate (Act II — Realm Archives of Ascension).
          </p>
        )}
        
        {hasProphecy && (onReviewProphecy || onOpenQuestOfFate) ? (
          <div className="lh-stack lh-stack--horizontal" style={{ marginTop: 24 }}>
            {onReviewProphecy && (
              <button type="button" className="lh-button lh-button--primary" onClick={onReviewProphecy}>
                Review Prophecy Research
              </button>
            )}
            {onOpenQuestOfFate && (
              <button type="button" className="lh-button lh-button--secondary" onClick={onOpenQuestOfFate}>
                Quest of Fate Worksheet
              </button>
            )}
          </div>
        ) : null}
      </section>

      {onClose ? (
        <div className="lh-stack lh-stack--horizontal lh-scroll-reveal__actions">
          <button type="button" className="lh-button lh-button--ghost" onClick={onClose}>
            Close scroll
          </button>
        </div>
      ) : null}
    </div>
  );
}
