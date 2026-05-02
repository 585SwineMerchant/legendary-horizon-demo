import { useEscapeToClose } from '../hooks/useEscapeToClose';
import type { PlayerSave } from '../types';

type Props = {
  open: boolean;
  onClose: () => void;
  player: PlayerSave;
};

export function InventoryOverlay({ open, onClose, player }: Props) {
  useEscapeToClose(open, onClose);
  if (!open) return null;

  const inv = player.inventory_summary;
  const items = inv.items ?? [];

  return (
    <div className="lh-overlay lh-overlay--dim" role="presentation">
      <div className="lh-panel lh-panel--inventory" role="dialog" aria-labelledby="inv-title">
        <header className="lh-panel__header">
          <h2 id="inv-title" className="lh-heading-md">
            Inventory
          </h2>
          <button type="button" className="lh-button lh-button--ghost" onClick={onClose}>
            Close
          </button>
        </header>
        <p className="lh-inventory__player">{player.display_name}</p>
        <div className="lh-inventory__coins">
          <span className="lh-inventory__coins-label">Coins</span>
          <span className="lh-inventory__coins-value">{inv.coins.toLocaleString()}</span>
        </div>
        {inv.notes_for_teacher_preview ? (
          <section className="lh-inventory__notes" aria-label="Teacher notes preview">
            <h3 className="lh-heading-sm">Notes for facilitator</h3>
            <p className="lh-inventory__notes-body">{inv.notes_for_teacher_preview}</p>
          </section>
        ) : null}
        <section className="lh-inventory__items" aria-label="Items carried">
          <h3 className="lh-heading-sm">Items</h3>
          {items.length === 0 ? (
            <p className="lh-inventory__empty">No items recorded yet — quest rewards and pickups will appear here.</p>
          ) : (
            <ul className="lh-inventory__list">
              {items.map((row) => (
                <li key={row.item_id} className="lh-inventory__row">
                  <span className="lh-inventory__name">{row.label ?? row.item_id}</span>
                  <span className="lh-inventory__qty">×{row.qty}</span>
                  <span className="lh-inventory__id">{row.item_id}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
