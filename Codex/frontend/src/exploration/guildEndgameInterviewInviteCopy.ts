export const GUILD_INTERVIEW_INVITE_BANNER_TITLE = 'Interview summons';

export const GUILD_INTERVIEW_INVITE_LATE_BANNER_TITLE = 'Interview summons — late arrival';

export function buildGuildInterviewInvitedRequiredNextAction(deadlineLabel: string): string {
  return `The Guild has summoned you to the Trial of Tongues. Aim to be back at your chosen guild headquarters before ${deadlineLabel} (your device’s local time) — punctuality is noted. If you arrive after that hour, you may still sit the interview in person here, but the Manager will mark a professionalism cost against passage.`;
}

export function buildGuildInterviewInviteToast(deadlineLabel: string): string {
  return `A sealed summons from the Guild Manager: you are invited to the Trial of Tongues. Return to this guild hall before ${deadlineLabel} (local time) for the best standing; if life delays you, the Trial may still be opened here afterward — expect a punctuality penalty toward passage.`;
}

export function buildGuildInterviewInviteBannerBody(deadlineLabel: string, missedReturnDeadline: boolean): string {
  if (missedReturnDeadline) {
    return `The vestry’s preferred return hour (${deadlineLabel}, local time) has passed. You may still open the Trial of Tongues from the pause ledger while you stand in this guild hall — the interview proceeds in person, but your lateness will weigh on whether the Council reads the session as a pass.`;
  }
  return `The vestry has read your papers and calls you forward. The Trial of Tongues awaits — prepare your answers and your bearing. Aim to be back at this guild headquarters before ${deadlineLabel} (local time) for a clean punctuality record; after that, you may still open the Trial here, with a professionalism penalty applied toward passage.`;
}

export function buildGuildInterviewInviteQuestLogNote(deadlineLabel: string, missedReturnDeadline: boolean): string {
  if (missedReturnDeadline) {
    return `Guild path: you are past the stated return hour (${deadlineLabel}, local). The Trial of Tongues remains available at your HQ from the pause menu; lateness applies a favor penalty toward passing — failing the interview itself still requires a redo, not the application.`;
  }
  return `Guild path: summoned for the Trial of Tongues. Target return to your guild headquarters before ${deadlineLabel} (local time). Open the Trial from the pause menu while at HQ; arriving after the hour still allows the interview but applies a professionalism penalty to passage.`;
}

/** Guild Manager desk while a summons is active (sealed application + open interview lane). */
export const GUILD_MANAGER_DESK_SUMMONS_ACTIVE =
  'The Guild Manager taps your summons on the desk: the Trial of Tongues is waiting — with your charter aligned to this hall, open it from the pause ledger. Punctuality still weighs on passage if a return hour was set.';

export function buildGuildInterviewAlreadySummonsToast(deadlineLabel: string, missedReturnDeadline: boolean): string {
  if (missedReturnDeadline) {
    return `Your summons is still active. You are past the return hour (${deadlineLabel}, local) — you may open the Trial of Tongues from the pause ledger at this hall; expect a punctuality penalty toward passage.`;
  }
  return `You already carry an active summons for the Trial of Tongues. Aim to be at this guild hall before ${deadlineLabel} (local time), then open the Trial from the pause ledger; after that hour you may still open it here with a professionalism cost.`;
}
