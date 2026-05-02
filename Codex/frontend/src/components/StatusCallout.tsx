import type { ReactNode } from 'react';

type Tone = 'error' | 'success' | 'info';

type Props = {
  tone: Tone;
  title?: string;
  children: ReactNode;
  role?: 'alert' | 'status';
};

/**
 * Milestone 12 — inline error / success / info pattern (title screens, forms).
 */
export function StatusCallout({ tone, title, children, role }: Props) {
  const r = role ?? (tone === 'error' ? 'alert' : 'status');
  return (
    <div className={`lh-status-callout lh-status-callout--${tone}`} role={r}>
      {title ? <p className="lh-status-callout__title">{title}</p> : null}
      <div className="lh-status-callout__body">{children}</div>
    </div>
  );
}
