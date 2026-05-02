import type { ManualSaveEnvelopeV1, PlayerSave, RosterStudentRecord } from '../domain/lh-contract';

export type ExitTicketHandshake = {
  /** User-visible synopsis shown after save acknowledgement. */
  summary: string;
  /** Opens the platform mail composer as a surrogate for GmailApp flows. */
  mailtoHref: string;
};

/**
 * Produces Day 2-compliant exit ticket scaffolding without invoking Gmail APIs yet.
 * Separated deliberately from validation so teacher policies can diverge cleanly later.
 */
export function composeMockExitTicketDraft(args: {
  player: PlayerSave;
  roster_student: RosterStudentRecord | null;
  envelope: ManualSaveEnvelopeV1;
}): ExitTicketHandshake {
  const roster = args.roster_student;
  const to = roster?.teacher_email ?? '';
  const subject = encodeURIComponent(`LH Exit Ticket • ${args.player.display_name}`);
  const bodyLines = [
    `Student / Traveler name: ${args.player.display_name}`,
    roster?.student_email ? `Student email (fixture): ${roster.student_email}` : null,
    roster?.student_id ? `Student ID: ${roster.student_id}` : null,
    roster?.class_section ? `Section: ${roster.class_section}` : null,
    roster?.section_code ? `Section code: ${roster.section_code}` : null,
    '',
    'Snapshot summary:',
    `- Realm: ${args.envelope.realm_id}`,
    `- Active quest: ${args.player.active_main_quest_title} (${args.player.active_main_quest_id})`,
    `- Required next action: ${args.player.required_next_action}`,
    `- XP total: ${args.player.xp_total}`,
    `- Level cached: ${args.player.level_cached}`,
    `- Completed triggers tracked: ${args.envelope.progression_flags.visited_trigger_object_ids.join(', ') || 'none logged'}`,
    '',
    `[Fixture revision @ ${args.envelope.saved_at_iso}]`,
    'Replace this template with scripted Gmail templating when ExitTicketService activates.',
  ];

  const body = encodeURIComponent(bodyLines.filter(Boolean).join('\n'));
  const mailtoHref = to
    ? `mailto:${to}?subject=${subject}&body=${body}`
    : `mailto:?subject=${subject}&body=${body}`;

  return {
    summary:
      'Manual save queued locally. Classroom exit reflection can begin — we opened your mail composer with a scaffolded prompt for your facilitator.',
    mailtoHref,
  };
}

export function proposeExitTicketComposer(handshake: ExitTicketHandshake): Window | null {
  return window.open(handshake.mailtoHref, '_blank', 'noopener,noreferrer');
}
