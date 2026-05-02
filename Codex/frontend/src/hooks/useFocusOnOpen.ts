import { type RefObject, useLayoutEffect } from 'react';

/**
 * Milestone 13 — when `open` becomes true, focus the first `[data-lh-autofocus]` inside `containerRef`.
 */
export function useFocusOnOpen(open: boolean, containerRef: RefObject<HTMLElement | null>): void {
  useLayoutEffect(() => {
    if (!open || !containerRef.current) return;
    const el = containerRef.current.querySelector<HTMLElement>('[data-lh-autofocus]');
    queueMicrotask(() => el?.focus());
  }, [open, containerRef]);
}
