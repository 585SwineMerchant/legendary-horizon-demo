/** Hole in 0–1 mask texture space (matches fog mask box on the raster). */
export type AtlasFogMaskHole01 = { cx: number; cy: number; r: number; ry?: number };

/**
 * Raster fog mask: soft white mist with feathered outer edge + soft circular holes.
 * More reliable than SVG mask + CSS on production builds.
 */
export function buildAtlasFogMaskDataUrl(
  holes: readonly AtlasFogMaskHole01[],
  opts?: { width?: number; height?: number; edgeMargin?: number; edgeBlurPx?: number },
): string {
  const w = opts?.width ?? 640;
  const h = opts?.height ?? 496;
  const margin = opts?.edgeMargin ?? 0.05;
  const edgeBlur = opts?.edgeBlurPx ?? 36;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  ctx.shadowColor = '#ffffff';
  ctx.shadowBlur = edgeBlur;
  ctx.fillStyle = '#ffffff';
  const mx = margin * w;
  const my = margin * h;
  ctx.fillRect(mx, my, w - mx * 2, h - my * 2);
  ctx.restore();

  ctx.globalCompositeOperation = 'destination-out';
  for (const hole of holes) {
    const hx = hole.cx * w;
    const hy = hole.cy * h;
    const rx = hole.r * w;
    const ry = (hole.ry ?? hole.r) * h;
    const grad = ctx.createRadialGradient(hx, hy, 0, hx, hy, Math.max(rx, ry));
    grad.addColorStop(0, 'rgba(0,0,0,1)');
    grad.addColorStop(0.5, 'rgba(0,0,0,0.92)');
    grad.addColorStop(0.82, 'rgba(0,0,0,0.35)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(hx, hy, Math.max(0.001, rx), Math.max(0.001, ry), 0, 0, Math.PI * 2);
    ctx.fill();
  }

  return canvas.toDataURL('image/png');
}
