const CONTINUE_SELECTORS = [
  '[data-lh-continue]:not([disabled])',
  '.lh-dialogue__actions .lh-button--primary:not([disabled])',
  '.lh-jrpg-battle-root .lh-button--primary:not([disabled])',
  '.lh-encounter-overlay .lh-button--primary:not([disabled])',
].join(', ');

/** Click the topmost visible primary continue control (dialogues, encounters, modules, menus). */
export function activateLhGlobalContinue(): boolean {
  if (typeof document === 'undefined') return false;
  const buttons = Array.from(
    document.querySelectorAll<HTMLButtonElement>(CONTINUE_SELECTORS),
  ).filter((btn) => {
    if (btn.offsetParent === null) return false;
    const r = btn.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  });
  const top = buttons.at(-1);
  if (!top) return false;
  top.click();
  return true;
}
