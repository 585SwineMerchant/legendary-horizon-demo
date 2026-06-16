import { useState } from 'react';

import { getGuildById } from '../data/guildData';
import { useEscapeToClose } from '../hooks/useEscapeToClose';

type Props = {
  open: boolean;
  realmId: string | null;
  onClose: () => void;
  onBeginApplication: () => void;
};

/**
 * Functional v1 of the guild recruitment brochure: front = recruitment ad,
 * back = the Enrollment Rune framing. Full parchment art treatment (matching
 * ScrollOfDestinyDisplay) is a future pass — structure here intentionally
 * mirrors that two-sided metaphor so the art can be dropped in later without
 * changing the flow.
 */
export function GuildBrochureModal({ open, realmId, onClose, onBeginApplication }: Props) {
  const [side, setSide] = useState<'front' | 'back'>('front');
  useEscapeToClose(open, onClose);

  if (!open || !realmId) return null;

  const guild = getGuildById(realmId);
  const guildName = guild?.name ?? 'This Guild';
  const cluster = guild?.career_cluster ?? 'Skilled Trade';
  const descriptor = guild?.thematic_descriptor ?? '';

  return (
    <div className="lh-overlay lh-overlay--dim" role="dialog" aria-label="Guild Recruitment Brochure">
      <div className="lh-panel lh-panel--world-map" style={{ maxWidth: 640 }}>
        <header className="lh-world-map__header">
          <div>
            <p className="lh-eyebrow">Guild recruitment brochure</p>
            <h2 className="lh-heading-md">{guildName}</h2>
          </div>
          <button type="button" className="lh-button lh-button--ghost" onClick={onClose}>
            Close
          </button>
        </header>

        <div
          className="lh-panel"
          style={{ padding: 16, marginTop: 8, overflowY: 'auto', maxHeight: '60vh' }}
        >
          {side === 'front' ? (
            <div className="lh-stack" style={{ gap: 10 }}>
              <p className="lh-eyebrow">{cluster}</p>
              {descriptor ? <p className="lh-world-map__meta" style={{ fontStyle: 'italic' }}>{descriptor}</p> : null}
              <h3 className="lh-heading-sm">Now recruiting apprentices</h3>
              <p className="lh-world-map__meta">
                {guildName} welcomes Travelers ready to learn the entry-level work of our trade — the duties
                a true apprentice takes on from their very first day.
              </p>
              <ul className="lh-world-map__fog-list">
                <li className="lh-world-map__fog-row">
                  <span><strong>Entry-level role:</strong> apprentice-tier positions within {cluster}.</span>
                </li>
                <li className="lh-world-map__fog-row">
                  <span><strong>Beginner responsibilities:</strong> learning core tools, assisting senior members, and building reliable habits.</span>
                </li>
                <li className="lh-world-map__fog-row">
                  <span><strong>Growth & advancement:</strong> apprentices who show steady effort are trusted with greater responsibility over time.</span>
                </li>
                <li className="lh-world-map__fog-row">
                  <span><strong>Readiness:</strong> we do not expect mastery — we expect honesty, curiosity, and a willingness to begin.</span>
                </li>
              </ul>
            </div>
          ) : (
            <div className="lh-stack" style={{ gap: 10 }}>
              <h3 className="lh-heading-sm">The Enrollment Rune</h3>
              <p className="lh-world-map__meta">
                Every apprentice begins with an Enrollment Rune. Read our guild&rsquo;s call carefully. If this
                path still speaks to you, complete the application on the back and submit it to the Council.
              </p>
              <p className="lh-world-map__meta">
                The application asks who you are, what you bring, and why this path is yours. There is no
                wrong answer — only an unfinished one.
              </p>
            </div>
          )}
        </div>

        <div className="lh-world-map__actions" style={{ marginTop: 12 }}>
          {side === 'front' ? (
            <button type="button" className="lh-button lh-button--primary" onClick={() => setSide('back')}>
              Turn to the Enrollment Rune
            </button>
          ) : (
            <>
              <button type="button" className="lh-button lh-button--ghost" onClick={() => setSide('front')}>
                Back to brochure
              </button>
              <button type="button" className="lh-button lh-button--primary" onClick={onBeginApplication}>
                Begin Application
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
