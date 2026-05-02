/**
 * ExitTicketService — classroom exit artifact trigger (typically Gmail templated dispatch).
 */

/**
 * Day 2: mock compose — replace with GmailApp templating + district policy checks.
 */
function LhExitTicket_queueMockDraft(studentProfile, manualSaveEnvelope) {
  Logger.log('LhExitTicket_queueMockDraft placeholder');
  return {
    queued: true,
    mode: 'mock',
    note: 'Wire GmailApp once manual saves hit production Sheets rows.',
    echo_profile: studentProfile,
    echo_envelope_schema: manualSaveEnvelope && manualSaveEnvelope.schema_version,
  };
}
