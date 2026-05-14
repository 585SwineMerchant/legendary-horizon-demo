/**
 * Full-screen helpers for school / Google Sites embeds: margins live on the parent frame,
 * so we request fullscreen on our document (or `#root`) from a click handler.
 */

type FsCapableElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
  msRequestFullscreen?: () => Promise<void> | void;
};

function fullscreenElement(): Element | null {
  return (
    document.fullscreenElement ??
    (document as unknown as { webkitFullscreenElement?: Element | null }).webkitFullscreenElement ??
    (document as unknown as { msFullscreenElement?: Element | null }).msFullscreenElement ??
    null
  );
}

export function isLhFullscreenActive(): boolean {
  return Boolean(fullscreenElement());
}

export async function requestLhEmbedFullscreen(root: HTMLElement | null = document.getElementById('root')): Promise<void> {
  const target = (root ?? document.documentElement) as FsCapableElement;
  if (target.requestFullscreen) {
    await target.requestFullscreen({ navigationUI: 'hide' });
    return;
  }
  if (target.webkitRequestFullscreen) {
    await Promise.resolve(target.webkitRequestFullscreen());
    return;
  }
  if (target.msRequestFullscreen) {
    await Promise.resolve(target.msRequestFullscreen());
    return;
  }
  throw new Error('Fullscreen is not supported in this browser.');
}

export async function exitLhEmbedFullscreen(): Promise<void> {
  if (!fullscreenElement()) return;
  if (document.exitFullscreen) {
    await document.exitFullscreen();
    return;
  }
  const doc = document as Document & {
    webkitExitFullscreen?: () => Promise<void> | void;
    msExitFullscreen?: () => Promise<void> | void;
  };
  if (doc.webkitExitFullscreen) {
    await Promise.resolve(doc.webkitExitFullscreen());
    return;
  }
  if (doc.msExitFullscreen) {
    await Promise.resolve(doc.msExitFullscreen());
    return;
  }
}
