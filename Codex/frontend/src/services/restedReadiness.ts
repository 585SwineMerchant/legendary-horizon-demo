/**
 * Rested Readiness Buff — six tiers derived from teacher campfire grading score (0–5).
 *
 * Multipliers apply to XP gained during the session.
 * The tier is computed once at session start and persisted.
 */

import type { RestedReadinessTier } from '../domain/lh-contract';

// ─── Tier Definitions ──────────────────────────────────────────────────────

export type RestedReadinessConfig = {
  tier: RestedReadinessTier;
  label: string;
  multiplier: number;
  /** Short in-world descriptor shown in HUD badge. */
  badge_text: string;
  /** Amber/warm tint for HUD badge at this tier (CSS color). */
  badge_color: string;
  /** Score range (inclusive). */
  min_score: number;
  max_score: number;
};

export const RESTED_READINESS_TIERS: readonly RestedReadinessConfig[] = [
  {
    tier: 'restless',
    label: 'Restless',
    multiplier: 1.0,
    badge_text: '—',
    badge_color: 'rgba(180, 140, 100, 0.5)',
    min_score: 0,
    max_score: 0,
  },
  {
    tier: 'light_rest',
    label: 'Lightly Rested',
    multiplier: 1.05,
    badge_text: '✦',
    badge_color: 'rgba(200, 160, 80, 0.7)',
    min_score: 1,
    max_score: 1,
  },
  {
    tier: 'steady_rest',
    label: 'Steadily Rested',
    multiplier: 1.10,
    badge_text: '✦✦',
    badge_color: 'rgba(212, 160, 23, 0.8)',
    min_score: 2,
    max_score: 2,
  },
  {
    tier: 'clear_rest',
    label: 'Clearly Rested',
    multiplier: 1.15,
    badge_text: '✦✦✦',
    badge_color: 'rgba(245, 158, 11, 0.85)',
    min_score: 3,
    max_score: 3,
  },
  {
    tier: 'strong_rest',
    label: 'Strongly Rested',
    multiplier: 1.25,
    badge_text: '❋❋',
    badge_color: 'rgba(251, 191, 36, 0.9)',
    min_score: 4,
    max_score: 4,
  },
  {
    tier: 'legendary_rest',
    label: 'Legendary Rest',
    multiplier: 1.40,
    badge_text: '❋❋❋',
    badge_color: 'rgba(253, 224, 71, 1.0)',
    min_score: 5,
    max_score: 5,
  },
] as const;

/** Wake-up messages — 8 per tier × 6 tiers = 48 total. */
const WAKE_UP_MESSAGES: Readonly<Record<RestedReadinessTier, readonly string[]>> = {
  restless: [
    "The fire went cold before it found you. Rise, Traveler — the realms await, even on tired legs.",
    "Your rest was fitful and your dreams scattered. Still, a new day breaks in the Legendary Horizon.",
    "You slept, but the night did not restore you. The path forward is yours to walk — begin slowly.",
    "The campfire gave little warmth tonight. But every journey continues, even on uncertain mornings.",
    "The stars passed overhead without notice. You wake unrested, but unbroken — that is enough.",
    "No great dreams visited you last night. Gather what you have and step forward.",
    "The realms do not wait for perfect rest. Rise and begin — momentum will come.",
    "Even a restless night ends in morning. The horizon is still ahead, Traveler.",
  ],
  light_rest: [
    "The fire kept a gentle ember through the night. You wake with a thread of energy — follow it.",
    "A light rest settled over you. Small, but real — your body knows more than your mind admits.",
    "The night was brief but the sleep was honest. A quiet morning awaits your first steps.",
    "You found a few hours of peace. It is not nothing — small rests build toward greater ones.",
    "The campfire gave you what it could. Rise with whatever the morning has brought you.",
    "A little rest, a little readiness. The Legendary Horizon has waited before — it waits for you.",
    "You slept lightly but truly. The path ahead is manageable today.",
    "A modest rest for a steady morning. Not every sunrise needs to be legendary.",
  ],
  steady_rest: [
    "The campfire held through the night and you held with it. A steady morning greets a steady Traveler.",
    "Your rest was real and earned. Walk into today's session with both feet on the ground.",
    "Solid rest, solid footing. The realms shift — you hold steady. Begin.",
    "The night was yours. The morning is also yours. You are ready.",
    "You slept well and woke clear. The fog on the World Atlas feels lighter today.",
    "Steady rest makes for steady purpose. What you carry forward today will be built on good ground.",
    "A full night well-used. Your Resolve is high and your bearings are true.",
    "The campfire's work is done. Yours is just beginning — and you are ready for it.",
  ],
  clear_rest: [
    "The stars were bright and your sleep was deep. You rise with clear eyes and an open mind.",
    "Last night, the campfire was generous. Today, the realms will feel more navigable — trust that.",
    "Clear rest, clear purpose. Walk into your exploration today with confidence.",
    "You woke knowing where the path is. That clarity is rare — use it well.",
    "The Legendary Horizon seems sharper this morning. Your rest has sharpened you along with it.",
    "Deep sleep clears the fog of doubt. Today you move with intention — the realms reward that.",
    "Your mind is rested and your questions are ready. This is a good day to seek answers.",
    "A clear night, a clear morning. Something important is waiting for you in today's session.",
  ],
  strong_rest: [
    "The campfire burned bright all night and so did you. Rise with strength, Traveler — this is a rare day.",
    "Something about last night's rest was exceptional. Carry that energy forward — it is hard-won.",
    "You wake as if the Legendary Horizon itself prepared you for what comes today.",
    "Strong rest produces strong resolve. The realms have something significant for you today.",
    "You slept like the best version of a Traveler. Walk like it.",
    "Last night's campfire ritual paid off. Your XP multiplier is elevated — your effort today will echo further.",
    "The night restored what the journey had taken. You are ready for a great session.",
    "Your body and mind aligned last night. Today, great things are possible.",
  ],
  legendary_rest: [
    "The Legendary Horizon has rewarded your reflection. You wake with a rare vitality — the kind stories remember.",
    "Your campfire words moved the realms themselves. Rise, Traveler — this is your day.",
    "Legendary rest for a legendary journey. The multiplier is yours to spend — spend it well.",
    "The campfire record you left last night was worthy of the archives. Today's session reflects that worth.",
    "Something ancient and rare settled over your sleep. You are more ready than you know.",
    "Every Traveler has one morning like this. You are in it. Make it count.",
    "Your reflection lit the campfire brighter than usual. The realms felt it — and they reward it today.",
    "The Codex remembers what you wrote. So does the world. Rise and honor it.",
  ],
};

// ─── Public Functions ──────────────────────────────────────────────────────

/**
 * Converts a teacher grade score (0–5) into a RestedReadinessTier.
 * If score is out of range, returns 'restless'.
 */
export function computeRestedReadinessTier(score: number | undefined | null): RestedReadinessTier {
  const s = typeof score === 'number' && Number.isFinite(score) ? Math.round(score) : 0;
  const clamped = Math.min(5, Math.max(0, s));
  return (
    RESTED_READINESS_TIERS.find((t) => clamped >= t.min_score && clamped <= t.max_score)?.tier ??
    'restless'
  );
}

/** Returns the config for a given tier. */
export function getRestedReadinessConfig(tier: RestedReadinessTier): RestedReadinessConfig {
  return (
    RESTED_READINESS_TIERS.find((t) => t.tier === tier) ??
    RESTED_READINESS_TIERS[0]
  );
}

/** Returns the XP multiplier for a tier. */
export function getRestedMultiplier(tier: RestedReadinessTier | undefined | null): number {
  if (!tier) return 1.0;
  return getRestedReadinessConfig(tier).multiplier;
}

/**
 * Picks a wake-up message for the tier, rotating via an LRU index to avoid repetition.
 *
 * @param tier       Rested Readiness tier
 * @param lastIndex  Index of the last message shown (-1 = none shown yet)
 * @returns          `{ message: string, nextIndex: number }`
 */
export function pickWakeUpMessage(
  tier: RestedReadinessTier,
  lastIndex: number,
): { message: string; nextIndex: number } {
  const messages = WAKE_UP_MESSAGES[tier];
  const len = messages.length;
  const nextIndex = ((lastIndex + 1) % len + len) % len;
  return { message: messages[nextIndex], nextIndex };
}

/**
 * Applies the Rested Readiness XP multiplier to an XP award.
 * Always rounds down to an integer.
 */
export function applyRestedMultiplier(baseXp: number, tier: RestedReadinessTier | undefined | null): number {
  const multiplier = getRestedMultiplier(tier);
  return Math.floor(baseXp * multiplier);
}
