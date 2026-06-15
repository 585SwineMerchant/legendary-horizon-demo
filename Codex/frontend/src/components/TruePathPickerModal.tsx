import { useEscapeToClose } from '../hooks/useEscapeToClose';
import type { RealmDefinition } from '../types';
import { getRealmPathInterestTags } from '../realm/guildRealmTitleParts';
import { getCareerClusterLabel } from '../realm/realmRegistry';

type Props = {
  open: boolean;
  onClose: () => void;
  candidateRealmIds: readonly string[];
  allRealms: readonly RealmDefinition[];
  onSelectTruePath: (realmId: string) => void;
};

export function TruePathPickerModal({ open, onClose, candidateRealmIds, allRealms, onSelectTruePath }: Props) {
  useEscapeToClose(open, onClose);
  if (!open) return null;

  const candidates = candidateRealmIds
    .map((id) => allRealms.find((r) => r.realm_id === id))
    .filter((r): r is RealmDefinition => r !== undefined);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Choose Your True Path"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(10,6,2,0.82)',
        padding: 24,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 720,
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'linear-gradient(160deg, #1a120a 0%, #110c06 100%)',
          border: '1px solid rgba(212,160,23,0.30)',
          borderRadius: 6,
          boxShadow: '0 8px 40px rgba(0,0,0,0.70)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px 16px',
            borderBottom: '1px solid rgba(212,160,23,0.18)',
            flexShrink: 0,
          }}
        >
          <p style={{ margin: '0 0 4px', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'rgba(212,160,23,0.75)' }}>
            Act IV · True Path
          </p>
          <h2 style={{ margin: '0 0 8px', fontSize: 22, fontFamily: 'var(--lh-guild-display, "Cinzel", serif)', fontWeight: 700, color: '#f0dfa0', lineHeight: 1.2 }}>
            Choose Your True Path
          </h2>
          <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.58)', lineHeight: 1.5 }}>
            These three Guilds were foretold on your Scroll. Based on your research, choose one to walk deeply.
            This is not a permanent life decision — it is the path you will study next.
          </p>
        </div>

        {/* Realm cards */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {candidates.length === 0 ? (
            <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.50)', fontStyle: 'italic' }}>
              No foretold signpost realms found. Ask your teacher to check your save.
            </p>
          ) : (
            candidates.map((realm) => {
              const cluster = getCareerClusterLabel(realm);
              const tags = getRealmPathInterestTags(realm);
              return (
                <div
                  key={realm.realm_id}
                  style={{
                    padding: '16px 20px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(212,160,23,0.18)',
                    borderRadius: 4,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 17, fontFamily: 'var(--lh-guild-display, "Cinzel", serif)', fontWeight: 700, color: '#f0dfa0' }}>
                      {realm.display_name}
                    </span>
                    {cluster ? (
                      <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.10em', color: 'rgba(212,160,23,0.75)' }}>
                        {cluster}
                      </span>
                    ) : null}
                  </div>
                  {tags.length > 0 ? (
                    <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.4 }}>
                      {tags.join(' · ')}
                    </p>
                  ) : null}
                  <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.38)', lineHeight: 1.4 }}>
                    This choice comes from your own research in the Comparison Ledger.
                  </p>
                  <button
                    type="button"
                    onClick={() => onSelectTruePath(realm.realm_id)}
                    style={{
                      alignSelf: 'flex-start',
                      marginTop: 4,
                      padding: '8px 20px',
                      fontSize: 13,
                      fontFamily: 'var(--lh-guild-display, "Cinzel", serif)',
                      fontWeight: 700,
                      background: 'rgba(212,160,23,0.12)',
                      border: '1px solid rgba(212,160,23,0.40)',
                      borderRadius: 3,
                      color: '#d4a017',
                      cursor: 'pointer',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Choose this True Path
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 24px 16px',
            borderTop: '1px solid rgba(212,160,23,0.10)',
            flexShrink: 0,
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '6px 16px',
              fontSize: 12,
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.18)',
              borderRadius: 3,
              color: 'rgba(255,255,255,0.50)',
              cursor: 'pointer',
            }}
          >
            Decide later
          </button>
        </div>
      </div>
    </div>
  );
}
