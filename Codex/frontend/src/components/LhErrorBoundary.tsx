import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = { children: ReactNode };

type State = { error: Error | null };

/**
 * Catches render/lifecycle errors under the tree so a single bad screen does not leave a blank root.
 */
export class LhErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error('[LhErrorBoundary]', error, info.componentStack);
    }
  }

  private handleReload = (): void => {
    window.location.reload();
  };

  override render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="lh-shell lh-error-boundary">
        <main className="lh-main-root" style={{ padding: '2rem', display: 'grid', placeItems: 'center', minHeight: '70vh' }}>
          <div className="lh-panel lh-panel--sheet lh-stack" style={{ gap: '1rem' }}>
            <p className="lh-eyebrow">Unexpected error</p>
            <h1 className="lh-heading-md">Legendary Horizon hit a problem</h1>
            <p className="lh-subtitle" style={{ margin: 0 }}>
              Reload the page to try again. If this keeps happening, note what you were doing and share it with your facilitator.
            </p>
            {import.meta.env.DEV ? (
              <pre
                style={{
                  margin: 0,
                  padding: '0.75rem',
                  borderRadius: 8,
                  background: 'var(--lh-bg-elevated)',
                  border: '1px solid var(--lh-border)',
                  color: 'var(--lh-muted)',
                  fontSize: '0.8rem',
                  overflow: 'auto',
                  maxHeight: '12rem',
                }}
              >
                {error.message}
              </pre>
            ) : null}
            <div className="lh-stack--horizontal" style={{ gap: '0.75rem' }}>
              <button type="button" className="lh-button lh-button--primary" onClick={this.handleReload}>
                Reload page
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }
}
