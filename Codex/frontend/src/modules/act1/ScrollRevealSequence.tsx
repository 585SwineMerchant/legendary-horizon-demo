import { useEffect, useState } from 'react';

import type { RealmDefinition } from '../../types';
import { GUILD_RUNES } from '../../data/guildRunes';
import { getGuildById } from '../../data/guildData';
import type { RiasecScores } from './signpostAlgorithm';

type Props = {
  foretoldSignpostRealmIds: readonly string[];
  riasecScores: RiasecScores;
  allRealms: readonly RealmDefinition[];
  onDismiss: () => void;
  /** Override scroll BG; falls back to VITE_LH_SCROLL_BG_IMAGE env var, then amber fill. */
  scrollBgImage?: string;
};

const RIASEC_LABELS: Record<keyof RiasecScores, string> = {
  r: 'Realistic',
  i: 'Investigative',
  a: 'Artistic',
  s: 'Social',
  e: 'Enterprising',
  c: 'Conventional',
};

const RIASEC_ORDER: Array<keyof RiasecScores> = ['r', 'i', 'a', 's', 'e', 'c'];

// Animation stage: 0=hidden, 1=scroll-fade, 2=header, 3=riasec, 4=signposts, 5=button
type Stage = 0 | 1 | 2 | 3 | 4 | 5;

function RuneSvg({ guildId, glowing }: { guildId: string; glowing: boolean }) {
  const rune = GUILD_RUNES[guildId];
  if (!rune) {
    return (
      <svg viewBox="0 0 40 46" width={40} height={46} aria-hidden>
        <line x1="20" y1="2" x2="20" y2="44" stroke="currentColor" strokeWidth={2.5} />
      </svg>
    );
  }
  const glow = glowing
    ? { filter: 'drop-shadow(0 0 6px #f59e0b) drop-shadow(0 0 12px #d4a017)' }
    : {};
  return (
    <svg
      viewBox="0 0 40 46"
      width={56}
      height={64}
      aria-hidden
      style={{ transition: 'filter 0.6s ease', ...glow }}
    >
      <path
        d={rune.path}
        fill="none"
        stroke="#d4a017"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {rune.dot ? (
        <circle cx={rune.dot.cx} cy={rune.dot.cy} r={rune.dot.r} fill="#d4a017" />
      ) : null}
    </svg>
  );
}

function RiasecBar({ code, score, visible }: { code: keyof RiasecScores; score: number; visible: boolean }) {
  const pct = Math.min(100, Math.round((score / 20) * 100));
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(0)' : 'translateX(-12px)',
        transition: 'opacity 0.35s ease, transform 0.35s ease',
      }}
    >
      <span
        style={{
          width: 100,
          fontSize: 12,
          fontFamily: 'serif',
          color: '#7c5a2a',
          letterSpacing: '0.04em',
          flexShrink: 0,
        }}
      >
        {code.toUpperCase()} — {RIASEC_LABELS[code]}
      </span>
      <div
        style={{
          flex: 1,
          height: 8,
          background: 'rgba(164,120,60,0.2)',
          borderRadius: 4,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: 'linear-gradient(90deg, #d4a017, #f59e0b)',
            borderRadius: 4,
            transition: 'width 0.7s ease 0.1s',
          }}
        />
      </div>
      <span style={{ fontSize: 11, color: '#7c5a2a', minWidth: 28, textAlign: 'right' }}>{score}</span>
    </div>
  );
}

export function ScrollRevealSequence({
  foretoldSignpostRealmIds,
  riasecScores,
  allRealms,
  onDismiss,
  scrollBgImage,
}: Props) {
  const [stage, setStage] = useState<Stage>(0);

  const bgImage =
    scrollBgImage ||
    (import.meta.env.VITE_LH_SCROLL_BG_IMAGE as string | undefined) ||
    '';

  // Cascade through animation stages
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setStage(1), 60));    // scroll fades in
    timers.push(setTimeout(() => setStage(2), 900));   // header appears
    timers.push(setTimeout(() => setStage(3), 1300));  // RIASEC bars
    timers.push(setTimeout(() => setStage(4), 2000));  // signpost runes
    timers.push(setTimeout(() => setStage(5), 2800));  // button
    return () => timers.forEach(clearTimeout);
  }, []);

  const signpostGlowing = stage >= 4;

  return (
    <>
      {/* Inject keyframes once */}
      <style>{`
        @keyframes lh-scroll-reveal-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        @import url('https://fonts.googleapis.com/css2?family=UnifrakturMaguntia&display=swap');
      `}</style>

      {/* Full-screen backdrop */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Scroll of Destiny revealed"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(10, 8, 4, 0.88)',
          opacity: stage >= 1 ? 1 : 0,
          transition: 'opacity 0.8s ease',
        }}
      >
        {/* Scroll parchment panel */}
        <div
          style={{
            position: 'relative',
            width: 'min(680px, 94vw)',
            maxHeight: '92vh',
            overflowY: 'auto',
            borderRadius: 4,
            padding: '40px 48px 36px',
            background: bgImage
              ? `url(${bgImage}) center/cover no-repeat`
              : '#f0e4c0',
            boxShadow: '0 8px 40px rgba(0,0,0,0.6), inset 0 0 60px rgba(164,120,60,0.15)',
            border: '2px solid #b8912a',
            opacity: stage >= 1 ? 1 : 0,
            transform: stage >= 1 ? 'scale(1)' : 'scale(0.94)',
            transition: 'opacity 0.8s ease, transform 0.8s ease',
          }}
        >
          {/* Parchment texture overlay when using bg color */}
          {!bgImage && (
            <div
              aria-hidden
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: 4,
                background:
                  'repeating-linear-gradient(0deg, transparent, transparent 28px, rgba(164,120,60,0.06) 28px, rgba(164,120,60,0.06) 29px)',
                pointerEvents: 'none',
              }}
            />
          )}

          {/* Header */}
          <header
            style={{
              textAlign: 'center',
              marginBottom: 28,
              opacity: stage >= 2 ? 1 : 0,
              transform: stage >= 2 ? 'translateY(0)' : 'translateY(-10px)',
              transition: 'opacity 0.4s ease, transform 0.4s ease',
            }}
          >
            <p
              style={{
                margin: '0 0 6px',
                fontSize: 11,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: '#7c5a2a',
                fontFamily: 'serif',
              }}
            >
              Act I — Manifest Complete
            </p>
            <h1
              style={{
                margin: 0,
                fontSize: 'clamp(26px, 4vw, 36px)',
                fontFamily: '"UnifrakturMaguntia", serif',
                color: '#3d2800',
                lineHeight: 1.1,
              }}
            >
              Scroll of Destiny
            </h1>
            <div
              aria-hidden
              style={{
                margin: '10px auto 0',
                width: 120,
                height: 2,
                background: 'linear-gradient(90deg, transparent, #d4a017, transparent)',
              }}
            />
          </header>

          {/* RIASEC Holland Codes */}
          <section
            style={{
              marginBottom: 28,
              opacity: stage >= 3 ? 1 : 0,
              transition: 'opacity 0.4s ease',
            }}
            aria-label="Holland Code profile"
          >
            <h2
              style={{
                margin: '0 0 14px',
                fontSize: 13,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#7c5a2a',
                fontFamily: 'serif',
              }}
            >
              Your Holland Code Profile
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {RIASEC_ORDER.map((code) => (
                <RiasecBar
                  key={code}
                  code={code}
                  score={riasecScores[code]}
                  visible={stage >= 3}
                />
              ))}
            </div>
          </section>

          {/* Divider */}
          <div
            aria-hidden
            style={{
              margin: '0 0 28px',
              height: 1,
              background: 'linear-gradient(90deg, transparent, rgba(164,120,60,0.4), transparent)',
              opacity: stage >= 3 ? 1 : 0,
              transition: 'opacity 0.4s ease 0.4s',
            }}
          />

          {/* Foretold Signposts */}
          <section aria-label="Foretold signposts">
            <h2
              style={{
                margin: '0 0 18px',
                fontSize: 13,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#7c5a2a',
                fontFamily: 'serif',
                opacity: stage >= 4 ? 1 : 0,
                transition: 'opacity 0.4s ease',
              }}
            >
              Foretold Signposts
            </h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: 16,
              }}
            >
              {foretoldSignpostRealmIds.map((realmId, idx) => {
                const realm = allRealms.find((r) => r.realm_id === realmId);
                const guild = getGuildById(realmId);
                const visible = stage >= 4;
                return (
                  <article
                    key={realmId}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      padding: '16px 12px',
                      background: 'rgba(164,120,60,0.08)',
                      border: '1px solid rgba(164,120,60,0.3)',
                      borderRadius: 4,
                      textAlign: 'center',
                      opacity: visible ? 1 : 0,
                      transform: visible ? 'translateY(0)' : 'translateY(16px)',
                      transition: `opacity 0.5s ease ${0.1 * idx}s, transform 0.5s ease ${0.1 * idx}s`,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 10,
                        letterSpacing: '0.15em',
                        textTransform: 'uppercase',
                        color: '#7c5a2a',
                        marginBottom: 10,
                        fontFamily: 'serif',
                      }}
                    >
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <div
                      style={{
                        marginBottom: 10,
                        animation: signpostGlowing
                          ? `lh-scroll-reveal-pulse 2.4s ease ${0.3 * idx}s infinite`
                          : 'none',
                      }}
                    >
                      <RuneSvg guildId={realmId} glowing={signpostGlowing} />
                    </div>
                    <p
                      style={{
                        margin: '0 0 4px',
                        fontSize: 13,
                        fontWeight: 600,
                        color: '#3d2800',
                        fontFamily: 'serif',
                        lineHeight: 1.2,
                      }}
                    >
                      {realm?.display_name ?? realmId}
                    </p>
                    {guild?.thematic_descriptor ? (
                      <p
                        style={{
                          margin: 0,
                          fontSize: 11,
                          color: '#7c5a2a',
                          fontStyle: 'italic',
                          lineHeight: 1.3,
                        }}
                      >
                        {guild.thematic_descriptor}
                      </p>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </section>

          {/* CTA */}
          <div
            style={{
              marginTop: 32,
              display: 'flex',
              justifyContent: 'center',
              opacity: stage >= 5 ? 1 : 0,
              transform: stage >= 5 ? 'translateY(0)' : 'translateY(8px)',
              transition: 'opacity 0.45s ease, transform 0.45s ease',
            }}
          >
            <button
              type="button"
              onClick={onDismiss}
              style={{
                padding: '12px 32px',
                fontSize: 14,
                fontFamily: 'serif',
                letterSpacing: '0.08em',
                background: 'linear-gradient(135deg, #d4a017, #b8912a)',
                color: '#1a0e00',
                border: '1px solid #8a6a1a',
                borderRadius: 3,
                cursor: 'pointer',
                fontWeight: 700,
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              }}
            >
              Carry the Scroll
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
