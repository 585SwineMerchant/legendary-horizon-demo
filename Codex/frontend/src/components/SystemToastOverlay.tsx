import { useEffect, useMemo, useState } from 'react';

type ToastTone = 'success' | 'error' | 'info';

export type SystemToastMessage = {
  tone: ToastTone;
  text: string;
  retryLabel?: string;
  onRetry?: () => void;
};

type QueueItem = SystemToastMessage & {
  id: number;
};

type Props = {
  message: SystemToastMessage | null;
  onConsumed?: () => void;
};

const AUTO_DISMISS_MS: Record<ToastTone, number> = {
  success: 4200,
  info: 5000,
  error: 7200,
};

export function SystemToastOverlay({ message, onConsumed }: Props) {
  const [queue, setQueue] = useState<QueueItem[]>([]);

  useEffect(() => {
    if (!message) return;
    setQueue((prev) => [...prev.slice(-2), { ...message, id: Date.now() + Math.floor(Math.random() * 1000) }]);
    onConsumed?.();
  }, [message, onConsumed]);

  useEffect(() => {
    if (!queue.length) return;
    const timers = queue.map((item) => {
      const delay = item.onRetry ? Math.max(AUTO_DISMISS_MS[item.tone], 9000) : AUTO_DISMISS_MS[item.tone];
      return window.setTimeout(() => {
        setQueue((prev) => prev.filter((x) => x.id !== item.id));
      }, delay);
    });
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [queue]);

  const liveRole = useMemo(() => (queue.some((item) => item.tone === 'error') ? 'alert' : 'status'), [queue]);

  if (!queue.length) return null;

  return (
    <div className="lh-system-toast-stack" role={liveRole} aria-live={liveRole === 'alert' ? 'assertive' : 'polite'}>
      {queue.map((item) => (
        <div key={item.id} className={`lh-system-toast lh-system-toast--${item.tone}`}>
          <p className="lh-system-toast__text">{item.text}</p>
          {item.onRetry ? (
            <button
              type="button"
              className="lh-button lh-button--ghost lh-button--small"
              onClick={() => {
                item.onRetry?.();
                setQueue((prev) => prev.filter((x) => x.id !== item.id));
              }}
            >
              {item.retryLabel ?? 'Retry'}
            </button>
          ) : null}
        </div>
      ))}
    </div>
  );
}
