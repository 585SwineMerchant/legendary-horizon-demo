/** Minutes from summons to interview return deadline (demo / QA). Override with `VITE_LH_GUILD_INTERVIEW_DEADLINE_MINUTES`. */
export function readGuildInterviewDeadlineMinutes(): number {
  const raw = import.meta.env.VITE_LH_GUILD_INTERVIEW_DEADLINE_MINUTES;
  const n = typeof raw === 'string' ? Number.parseInt(raw.trim(), 10) : Number.NaN;
  if (Number.isFinite(n) && n > 0 && n <= 24 * 60) return n;
  return 20;
}

export function computeGuildInterviewDeadlineIso(fromMs: number = Date.now()): string {
  const ms = fromMs + readGuildInterviewDeadlineMinutes() * 60 * 1000;
  return new Date(ms).toISOString();
}

export function formatGuildInterviewDeadlineForPlayer(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'the hour named on your summons';
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

export function isGuildInterviewDeadlinePassed(iso: string | null | undefined, nowMs: number = Date.now()): boolean {
  if (!iso || !String(iso).trim()) return true;
  const end = Date.parse(String(iso).trim());
  if (!Number.isFinite(end)) return true;
  return end <= nowMs;
}
