type Props = {
  label?: string;
  /** Visually hidden label for assistive tech when `label` is shown visually */
  ariaLabel?: string;
};

/**
 * Milestone 12 — shared loading affordance (`aria-busy` on parent recommended).
 */
export function LoadingSpinner({ label, ariaLabel }: Props) {
  return (
    <div className="lh-loading-spinner" role="status" aria-live="polite" aria-label={ariaLabel ?? label ?? 'Loading'}>
      <span className="lh-loading-spinner__dot" aria-hidden />
      <span className="lh-loading-spinner__dot" aria-hidden />
      <span className="lh-loading-spinner__dot" aria-hidden />
      {label ? <span className="lh-loading-spinner__label">{label}</span> : null}
    </div>
  );
}
