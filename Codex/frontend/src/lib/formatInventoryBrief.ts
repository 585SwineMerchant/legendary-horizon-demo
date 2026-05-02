import type { InventorySummary } from '../domain/lh-contract';

export function summarizeInventoryBrief(summary?: InventorySummary, maxLines = 3): string {
  if (!summary) return '—';
  const lines = summary.items.slice(0, maxLines).map((row) => {
    const title = row.label ?? row.item_id;
    return `${title} ×${row.qty}`;
  });
  const overflow = summary.items.length > maxLines ? '… +' + (summary.items.length - maxLines) : '';
  const coinBits = `${summary.coins} coin${summary.coins === 1 ? '' : 's'}`;
  return [coinBits, ...lines].filter(Boolean).join(' · ') + (overflow ? ` ${overflow}` : '');
}
