import { SCROLL_ASSETS } from '../../components/scrollUI/scrollAssets';

/** Minimal realm shape needed for Foretold Signpost medallion lookups. */
type RealmLike = {
  realm_id: string;
  display_name: string;
  career_cluster?: string;
};

/**
 * Percentage-based overlay regions mapped to the Scroll_Of_Destiny_ready.png layout.
 * All values are percentages of the scroll image's rendered width/height.
 *
 * ┌──────────────────────────────────────────────────────────┐
 * │                     TITLE BANNER                         │  0–11%
 * │       ┌───────────┐   ○ CIRCLE  ┌───────────┐           │
 * │       │ LEFT PANEL│  [NAMEPLATE]│ RIGHT PANEL│           │  11–47%
 * │       └───────────┘             └───────────┘           │
 * │              LARGE CENTER PARCHMENT AREA                 │  48–62%
 * ├──────────────────────────────────────────────────────────┤
 * │   ◉ MED-1          ◉ MED-2            ◉ MED-3           │  64–94%
 * └──────────────────────────────────────────────────────────┘
 *
 * TUNING: Adjust the REGIONS constants if the image dimensions change.
 * The image is landscape (approx 1366×768). All %% are relative to container.
 */

const REGIONS = {
  /** "SCROLL OF DESTINY / TRAVELER'S MANIFEST" banner – text area inside the dark ribbon */
  title: { top: '2.5%', left: '22%', width: '56%', height: '8%' },
  /** Dark circular emblem in top-center of scroll */
  circle: { top: '8%', left: '38%', width: '24%', height: '27%' },
  /** Horizontal pill-shaped nameplate below the circle */
  nameplate: { top: '36%', left: '33%', width: '34%', height: '7.5%' },
  /** Left bordered parchment rectangle – Life Goals + Career Values */
  leftPanel: { top: '12%', left: '5%', width: '31%', height: '37%' },
  /** Right bordered parchment rectangle – Workspace Prefs + Skills */
  rightPanel: { top: '12%', left: '64%', width: '31%', height: '37%' },
  /** Wide central parchment – Oracle prophecy / True Path summary */
  centerArea: { top: '50%', left: '5%', width: '90%', height: '13%' },
  /** Bottom medallions – three Foretold Signposts */
  medallion0: { top: '66%', left: '8%',  width: '14%', height: '22%' },
  medallion1: { top: '66%', left: '43%', width: '14%', height: '22%' },
  medallion2: { top: '66%', left: '78%', width: '14%', height: '22%' },
} as const;

/** Font stack for parchment areas (brown on cream) */
const parchmentText: React.CSSProperties = {
  fontFamily: '"Cinzel", "Palatino Linotype", serif',
  color: '#3d2200',
  textShadow: 'none',
};

/** Font stack for dark areas (cream/gold on dark) */
const darkText: React.CSSProperties = {
  fontFamily: '"Cinzel", "Palatino Linotype", serif',
  color: '#f5e6c0',
  textShadow: '0 1px 3px rgba(0,0,0,0.7)',
};

function OverlayRegion({
  style,
  children,
  label,
}: {
  style: typeof REGIONS[keyof typeof REGIONS];
  children: React.ReactNode;
  label?: string;
}) {
  return (
    <div
      aria-label={label}
      style={{
        position: 'absolute',
        top: style.top,
        left: style.left,
        width: style.width,
        height: style.height,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        padding: '2% 4%',
        boxSizing: 'border-box',
        pointerEvents: 'none', // pass-through for scroll interactions
      }}
    >
      {children}
    </div>
  );
}

type MedallionProps = {
  signpostLabel: string;
  signpostCluster?: string;
  regionStyle: typeof REGIONS[keyof typeof REGIONS];
  index: number;
};

function Medallion({ signpostLabel, signpostCluster, regionStyle, index }: MedallionProps) {
  return (
    <OverlayRegion style={regionStyle} label={`Foretold Signpost ${index + 1}`}>
      {signpostLabel ? (
        <>
          <span
            style={{
              ...darkText,
              fontSize: 'clamp(7px, 1.1vw, 12px)',
              fontWeight: 700,
              textAlign: 'center',
              lineHeight: 1.2,
              letterSpacing: '0.03em',
            }}
          >
            {signpostLabel}
          </span>
          {signpostCluster ? (
            <span
              style={{
                ...darkText,
                fontSize: 'clamp(6px, 0.85vw, 9px)',
                fontStyle: 'italic',
                textAlign: 'center',
                marginTop: '4%',
                opacity: 0.8,
                lineHeight: 1.2,
              }}
            >
              {signpostCluster}
            </span>
          ) : null}
        </>
      ) : (
        <span style={{ ...darkText, fontSize: 'clamp(7px, 1vw, 10px)', opacity: 0.4 }}>
          Not yet revealed
        </span>
      )}
    </OverlayRegion>
  );
}

export type ScrollOfDestinyViewerProps = {
  /** Player/traveler display name */
  playerName: string;
  /** Up to 3 realm IDs for the Foretold Signposts */
  foretoldSignpostRealmIds: readonly string[];
  /** Realm catalog for display-name lookup — only realm_id + display_name required */
  allRealms: readonly RealmLike[];
  /** SOD section A — Life Goals (personal_interests top 3) */
  lifeGoals?: string;
  /** SOD section A — Career Values (academic_interests top 3) */
  careerValues?: string;
  /** SOD section B — Workspace Preferences */
  workspacePrefs?: string;
  /** SOD section B — Skills */
  skills?: string;
  /** Title/class designation shown on the center nameplate */
  titleDesignation?: string;
  /** Oracle prophecy or True Path summary shown in large center area */
  prophecySummary?: string;
  /** Path to the scroll PNG — defaults to SCROLL_ASSETS.hub (base-path safe) */
  scrollImageSrc?: string;
};

/**
 * ScrollOfDestinyViewer
 *
 * Renders the production Scroll_Of_Destiny_ready.png as a full-width base image
 * with transparent HTML/CSS overlays positioned to match each parchment region.
 *
 * Data fills in progressively:
 *   Act 1 seal  → name, title, life goals, career values
 *   Act 2 Oracle→ prophecySummary (oracle reading)
 *   Act 4 guild → prophecySummary (True Path confirmation)
 *
 * RESPONSIVE: All overlay positions use % coordinates so the layout scales
 * with the image. The container uses position:relative + width:100%.
 */
export function ScrollOfDestinyViewer({
  playerName,
  foretoldSignpostRealmIds,
  allRealms,
  lifeGoals = '',
  careerValues = '',
  workspacePrefs = '',
  skills = '',
  titleDesignation = '',
  prophecySummary = '',
  scrollImageSrc = SCROLL_ASSETS.hub,
}: ScrollOfDestinyViewerProps) {
  const realmMap = new Map(allRealms.map((r) => [r.realm_id, r]));

  const signposts = [0, 1, 2].map((i) => {
    const rid = foretoldSignpostRealmIds[i] ?? '';
    const realm = realmMap.get(rid);
    return {
      label: realm?.display_name ?? '',
      cluster: realm?.career_cluster ?? '',  // optional field — empty string if not present
    };
  });

  return (
    <div
      style={{ position: 'relative', width: '100%', userSelect: 'none' }}
      role="img"
      aria-label="Scroll of Destiny"
    >
      {/* Base scroll image — sets the container height */}
      <img
        src={scrollImageSrc}
        alt="Scroll of Destiny parchment"
        style={{ display: 'block', width: '100%', height: 'auto' }}
        draggable={false}
      />

      {/* ── TITLE BANNER ─────────────────────────────── */}
      <OverlayRegion style={REGIONS.title} label="Traveler name">
        <span
          style={{
            ...darkText,
            fontSize: 'clamp(10px, 1.6vw, 18px)',
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            textAlign: 'center',
          }}
        >
          {playerName || 'The Traveler'}
        </span>
      </OverlayRegion>

      {/* ── CENTER CIRCLE ────────────────────────────── */}
      <OverlayRegion style={REGIONS.circle} label="Guild emblem">
        {/* Guild icon placeholder — replace with actual guild rune/portrait when True Path is set */}
        {prophecySummary ? (
          <span
            style={{
              ...darkText,
              fontSize: 'clamp(7px, 1vw, 11px)',
              textAlign: 'center',
              lineHeight: 1.35,
              fontStyle: 'italic',
              padding: '0 8%',
            }}
          >
            {/* Keep short — circle is small. Show first ~60 chars. */}
            {prophecySummary.slice(0, 60)}
            {prophecySummary.length > 60 ? '…' : ''}
          </span>
        ) : (
          <span style={{ ...darkText, fontSize: 'clamp(6px, 0.9vw, 10px)', opacity: 0.35 }}>
            Awaiting Oracle
          </span>
        )}
      </OverlayRegion>

      {/* ── CENTER NAMEPLATE ─────────────────────────── */}
      <OverlayRegion style={REGIONS.nameplate} label="Title designation">
        <span
          style={{
            ...parchmentText,
            fontSize: 'clamp(8px, 1.15vw, 13px)',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textAlign: 'center',
          }}
        >
          {titleDesignation || 'Traveler'}
        </span>
      </OverlayRegion>

      {/* ── LEFT PANEL: Life Goals + Career Values ───── */}
      <OverlayRegion style={REGIONS.leftPanel} label="Life goals and career values">
        <div style={{ width: '100%' }}>
          {lifeGoals ? (
            <>
              <p
                style={{
                  ...parchmentText,
                  fontSize: 'clamp(6px, 0.8vw, 9px)',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  margin: '0 0 3%',
                  opacity: 0.6,
                }}
              >
                Life Goals
              </p>
              <p
                style={{
                  ...parchmentText,
                  fontSize: 'clamp(7px, 0.95vw, 10px)',
                  lineHeight: 1.4,
                  margin: '0 0 6%',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {lifeGoals}
              </p>
            </>
          ) : null}
          {careerValues ? (
            <>
              <p
                style={{
                  ...parchmentText,
                  fontSize: 'clamp(6px, 0.8vw, 9px)',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  margin: '0 0 3%',
                  opacity: 0.6,
                }}
              >
                Career Values
              </p>
              <p
                style={{
                  ...parchmentText,
                  fontSize: 'clamp(7px, 0.95vw, 10px)',
                  lineHeight: 1.4,
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {careerValues}
              </p>
            </>
          ) : null}
          {!lifeGoals && !careerValues ? (
            <p style={{ ...parchmentText, fontSize: 'clamp(6px, 0.85vw, 9px)', opacity: 0.3, textAlign: 'center' }}>
              Complete the Manifest to reveal
            </p>
          ) : null}
        </div>
      </OverlayRegion>

      {/* ── RIGHT PANEL: Workspace Prefs + Skills ────── */}
      <OverlayRegion style={REGIONS.rightPanel} label="Workspace preferences and skills">
        <div style={{ width: '100%' }}>
          {workspacePrefs ? (
            <>
              <p
                style={{
                  ...parchmentText,
                  fontSize: 'clamp(6px, 0.8vw, 9px)',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  margin: '0 0 3%',
                  opacity: 0.6,
                }}
              >
                Work Environment
              </p>
              <p
                style={{
                  ...parchmentText,
                  fontSize: 'clamp(7px, 0.95vw, 10px)',
                  lineHeight: 1.4,
                  margin: '0 0 6%',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {workspacePrefs}
              </p>
            </>
          ) : null}
          {skills ? (
            <>
              <p
                style={{
                  ...parchmentText,
                  fontSize: 'clamp(6px, 0.8vw, 9px)',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  margin: '0 0 3%',
                  opacity: 0.6,
                }}
              >
                Skills
              </p>
              <p
                style={{
                  ...parchmentText,
                  fontSize: 'clamp(7px, 0.95vw, 10px)',
                  lineHeight: 1.4,
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {skills}
              </p>
            </>
          ) : null}
          {!workspacePrefs && !skills ? (
            <p style={{ ...parchmentText, fontSize: 'clamp(6px, 0.85vw, 9px)', opacity: 0.3, textAlign: 'center' }}>
              Complete the Manifest to reveal
            </p>
          ) : null}
        </div>
      </OverlayRegion>

      {/* ── LARGE CENTER PARCHMENT ───────────────────── */}
      <OverlayRegion style={REGIONS.centerArea} label="Oracle prophecy and True Path">
        {prophecySummary ? (
          <p
            style={{
              ...parchmentText,
              fontSize: 'clamp(7px, 1vw, 11px)',
              lineHeight: 1.5,
              textAlign: 'center',
              fontStyle: 'italic',
              margin: 0,
              padding: '0 2%',
            }}
          >
            {prophecySummary}
          </p>
        ) : (
          <p style={{ ...parchmentText, fontSize: 'clamp(6px, 0.9vw, 10px)', opacity: 0.3, textAlign: 'center' }}>
            The Oracle's words will appear here
          </p>
        )}
      </OverlayRegion>

      {/* ── THREE FORETOLD SIGNPOST MEDALLIONS ───────── */}
      {([REGIONS.medallion0, REGIONS.medallion1, REGIONS.medallion2] as const).map((region, i) => (
        <Medallion
          key={i}
          signpostLabel={signposts[i].label}
          signpostCluster={signposts[i].cluster}
          regionStyle={region}
          index={i}
        />
      ))}
    </div>
  );
}
