/**
 * SatchelOverlay — full-screen inventory panel accessible from the pause menu.
 *
 * Three panels via tabs:
 *  1. Satchel      — consumables with use buttons
 *  2. Field Kit    — permanent tools
 *  3. Mementos     — collectible cosmetics grid
 *
 * Dev debug panel available in DEV mode: grant any item instantly.
 */

import { useState } from 'react';
import type { PlayerSave, SatchelInventoryV1, MementoEntryV1 } from '../domain/lh-contract';
import { publicAssetUrl } from '../lib/publicAssetUrl';
import { ScrollSubMenuShell } from './ScrollSubMenuShell';
import {
  parseSatchelInventory,
  SATCHEL_CONSUMABLE_DEFS,
  FIELD_KIT_DEFS,
  getTitleLabel,
  CAMPFIRE_STREAK_MILESTONES,
} from '../data/itemCatalog';

type SatchelTab = 'satchel' | 'field_kit' | 'mementos';

type Props = {
  open: boolean;
  player: PlayerSave;
  onClose: () => void;
  /** Called when player uses a consumable — returns updated player. */
  onUseConsumable?: (itemId: string) => void;
  /** DEV: grant an item for testing. */
  onDevGrant?: (itemId: string, qty: number) => void;
};

function TabButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '8px 20px',
        fontSize: 12,
        fontFamily: 'serif',
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        background: active ? 'rgba(212,160,23,0.15)' : 'transparent',
        color: active ? '#f0dfa0' : 'rgba(212,160,23,0.75)',
        border: 'none',
        borderBottom: active ? '2px solid #d4a017' : '2px solid transparent',
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
    >
      {label}
    </button>
  );
}

function ConsumableCard({
  item_id,
  label,
  qty,
  max_qty,
  onUse,
}: {
  item_id: string;
  label: string;
  qty: number;
  max_qty: number;
  onUse?: () => void;
}) {
  const def = SATCHEL_CONSUMABLE_DEFS.find((d) => d.item_id === item_id);
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 14px',
        background: 'rgba(255,255,255,0.03)',
        border: qty > 0 ? '1px solid rgba(212,160,23,0.2)' : '1px solid rgba(255,255,255,0.05)',
        borderRadius: 4,
        opacity: qty === 0 ? 0.45 : 1,
      }}
    >
      {def?.iconAssetPath ? (
        <img
          src={publicAssetUrl(def.iconAssetPath)}
          alt=""
          aria-hidden
          style={{ width: 32, height: 32, imageRendering: 'pixelated', flexShrink: 0 }}
        />
      ) : (
        <span style={{ fontSize: 28, lineHeight: 1 }} aria-hidden>{def?.icon_emoji ?? '◆'}</span>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#e8dcc8' }}>{label}</p>
        <p style={{ margin: '2px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.65)', lineHeight: 1.4 }}>
          {def?.effect_description ?? ''}
        </p>
        <p style={{ margin: '4px 0 0', fontSize: 11, color: 'rgba(212,160,23,0.7)' }}>
          {qty} / {max_qty}
        </p>
      </div>
      {onUse && qty > 0 ? (
        <button
          type="button"
          onClick={onUse}
          style={{
            padding: '6px 14px',
            fontSize: 11,
            fontFamily: 'serif',
            background: 'linear-gradient(135deg,#d4a017,#b8912a)',
            border: '1px solid #8a6a1a',
            borderRadius: 3,
            color: '#1a0e00',
            fontWeight: 700,
            cursor: 'pointer',
            letterSpacing: '0.04em',
          }}
        >
          Use
        </button>
      ) : null}
    </div>
  );
}

function FieldKitCard({
  item_id,
  label,
  owned,
}: {
  item_id: string;
  label: string;
  owned: boolean;
}) {
  const def = FIELD_KIT_DEFS.find((d) => d.item_id === item_id);
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 14px',
        background: owned ? 'rgba(212,160,23,0.06)' : 'rgba(255,255,255,0.02)',
        border: owned ? '1px solid rgba(212,160,23,0.2)' : '1px solid rgba(255,255,255,0.05)',
        borderRadius: 4,
        opacity: owned ? 1 : 0.35,
      }}
    >
      {def?.iconAssetPath ? (
        <img
          src={publicAssetUrl(def.iconAssetPath)}
          alt=""
          aria-hidden
          style={{ width: 32, height: 32, imageRendering: 'pixelated', flexShrink: 0, opacity: owned ? 1 : 0.4 }}
        />
      ) : (
        <span style={{ fontSize: 26, lineHeight: 1 }} aria-hidden>{def?.icon_emoji ?? '◆'}</span>
      )}
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: owned ? '#e8dcc8' : 'rgba(232,220,200,0.5)' }}>
          {label}
          {owned ? (
            <span style={{ marginLeft: 8, fontSize: 10, color: '#22c55e', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Equipped
            </span>
          ) : null}
        </p>
        <p style={{ margin: '2px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.62)', lineHeight: 1.4 }}>
          {def?.effect_description ?? ''}
        </p>
      </div>
    </div>
  );
}

function MementoGrid({ mementos }: { mementos: MementoEntryV1[] }) {
  if (mementos.length === 0) {
    return (
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', margin: 0, lineHeight: 1.5 }}>
        No mementos collected yet. Complete quests and explore guild halls to discover them.
      </p>
    );
  }
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: 10,
      }}
    >
      {mementos.map((m) => (
        <div
          key={m.item_id}
          title={m.description ?? m.label}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
            padding: '12px 10px',
            background: 'rgba(212,160,23,0.06)',
            border: '1px solid rgba(212,160,23,0.18)',
            borderRadius: 4,
            textAlign: 'center',
          }}
        >
          <span style={{ fontSize: 32 }} aria-hidden>{m.icon_emoji ?? '🏅'}</span>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#f0dfa0', lineHeight: 1.2 }}>{m.label}</p>
          <p style={{ margin: 0, fontSize: 10, color: 'rgba(255,255,255,0.55)' }}>
            {new Date(m.acquired_at_iso).toLocaleDateString()}
          </p>
        </div>
      ))}
    </div>
  );
}

export function SatchelOverlay({ open, player, onClose, onUseConsumable, onDevGrant }: Props) {
  const [tab, setTab] = useState<SatchelTab>('satchel');
  const [devItemId, setDevItemId] = useState('');
  const [devQty, setDevQty] = useState(1);

  if (!open) return null;

  const inventory: SatchelInventoryV1 = parseSatchelInventory(player.satchel_inventory_json);
  const activeTitle = player.active_title ?? inventory.cosmetics.active_title ?? null;
  const isDev = import.meta.env.DEV;

  const tabBar = (
    <div style={{ display: 'flex', justifyContent: 'center', borderBottom: '1px solid rgba(212,160,23,0.12)', width: '100%' }}>
      <TabButton active={tab === 'satchel'} label="Satchel" onClick={() => setTab('satchel')} />
      <TabButton active={tab === 'field_kit'} label="Field Kit" onClick={() => setTab('field_kit')} />
      <TabButton active={tab === 'mementos'} label="Mementos" onClick={() => setTab('mementos')} />
    </div>
  );

  return (
    <ScrollSubMenuShell
      title="Satchel"
      subtitle={activeTitle ? `Equipment · ${getTitleLabel(activeTitle)}` : 'Equipment'}
      onBack={onClose}
      backLabel="← Back to Scroll"
      ariaLabel="Satchel"
      zIndex={9000}
      tabs={tabBar}
    >
      {/* Body */}
      <div style={{ padding: '20px 24px', maxWidth: 640, margin: '0 auto', width: '100%' }}>

        {tab === 'satchel' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ margin: '0 0 10px', fontSize: 12, color: 'rgba(255,255,255,0.62)', lineHeight: 1.4 }}>
              Consumables are used from the Satchel during exploration. Items are replenished
              by quest rewards and realm discoveries.
            </p>
            {inventory.consumables.map((c) => (
              <ConsumableCard
                key={c.item_id}
                {...c}
                onUse={onUseConsumable ? () => onUseConsumable(c.item_id) : undefined}
              />
            ))}
            {inventory.consumables.length === 0 ? (
              <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13 }}>No consumables available.</p>
            ) : null}
          </div>
        ) : null}

        {tab === 'field_kit' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ margin: '0 0 10px', fontSize: 12, color: 'rgba(255,255,255,0.62)', lineHeight: 1.4 }}>
              Field Kit tools are permanent equipment. Once owned, they are always active.
            </p>
            {inventory.field_kit.map((t) => (
              <FieldKitCard key={t.item_id} {...t} />
            ))}
          </div>
        ) : null}

        {tab === 'mementos' ? (
          <div>
            <p style={{ margin: '0 0 14px', fontSize: 12, color: 'rgba(255,255,255,0.62)', lineHeight: 1.4 }}>
              Mementos are cosmetic collectibles earned through exploration and streak milestones.
            </p>
            {/* Streak milestone badges */}
            {inventory.cosmetics.unlocked_titles.length > 0 || inventory.cosmetics.unlocked_badges.length > 0 ? (
              <div style={{ marginBottom: 16 }}>
                <p style={{ margin: '0 0 8px', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(212,160,23,0.80)' }}>
                  Earned Honors
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {inventory.cosmetics.unlocked_titles.map((id) => (
                    <span
                      key={id}
                      style={{
                        padding: '4px 12px',
                        background: 'rgba(212,160,23,0.12)',
                        border: '1px solid rgba(212,160,23,0.3)',
                        borderRadius: 12,
                        fontSize: 11,
                        color: '#f0dfa0',
                        letterSpacing: '0.04em',
                      }}
                    >
                      📜 {getTitleLabel(id)}
                    </span>
                  ))}
                  {inventory.cosmetics.unlocked_badges.filter((b) => b !== 'VISUAL_AMBER_FLAME').map((id) => {
                    const m = CAMPFIRE_STREAK_MILESTONES.find((ms) => ms.reward_id === id);
                    return m ? (
                      <span
                        key={id}
                        style={{
                          padding: '4px 12px',
                          background: 'rgba(245,158,11,0.12)',
                          border: '1px solid rgba(245,158,11,0.3)',
                          borderRadius: 12,
                          fontSize: 11,
                          color: '#fbbf24',
                          letterSpacing: '0.04em',
                        }}
                      >
                        🏅 {m.reward_label}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            ) : null}
            <MementoGrid mementos={inventory.mementos} />
          </div>
        ) : null}

        {/* DEV Debug Panel */}
        {isDev && onDevGrant ? (
          <div
            style={{
              marginTop: 24,
              padding: '14px 16px',
              background: 'rgba(99,102,241,0.08)',
              border: '1px dashed rgba(99,102,241,0.3)',
              borderRadius: 4,
            }}
          >
            <p style={{ margin: '0 0 10px', fontSize: 11, color: 'rgba(99,102,241,0.8)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              ⚙ Dev: Grant Item
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div>
                <label style={{ display: 'block', fontSize: 10, color: 'rgba(255,255,255,0.62)', marginBottom: 4 }}>Item ID</label>
                <input
                  type="text"
                  value={devItemId}
                  onChange={(e) => setDevItemId(e.target.value)}
                  placeholder="e.g. SAT-REM-001"
                  style={{
                    padding: '5px 8px',
                    fontSize: 12,
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 3,
                    color: '#e8dcc8',
                    width: 160,
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 10, color: 'rgba(255,255,255,0.62)', marginBottom: 4 }}>Qty</label>
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={devQty}
                  onChange={(e) => setDevQty(Math.max(1, Number(e.target.value)))}
                  style={{
                    padding: '5px 8px',
                    fontSize: 12,
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 3,
                    color: '#e8dcc8',
                    width: 60,
                  }}
                />
              </div>
              <button
                type="button"
                onClick={() => { if (devItemId.trim()) { onDevGrant(devItemId.trim(), devQty); setDevItemId(''); } }}
                style={{
                  padding: '6px 14px',
                  fontSize: 11,
                  background: 'rgba(99,102,241,0.2)',
                  border: '1px solid rgba(99,102,241,0.4)',
                  borderRadius: 3,
                  color: '#a5b4fc',
                  cursor: 'pointer',
                }}
              >
                Grant
              </button>
            </div>
            <div style={{ marginTop: 8, fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>
              Consumable IDs: SAT-REM-001, SAT-REM-002, SAT-FOC-001, SAT-WPN-001, SAT-MAG-001 ·
              Kit IDs: FK-COM-001, FK-LAN-001, FK-MAR-001, FK-CAM-001, FK-JOU-001
            </div>
          </div>
        ) : null}
      </div>
    </ScrollSubMenuShell>
  );
}
