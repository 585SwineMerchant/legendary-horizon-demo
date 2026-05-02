/**
 * InterviewService — GT-102 "Trial of Tongues" backend turn runner.
 *
 * Important: This implementation is intentionally model-free (safe stub).
 * In production, replace `lhInterview_buildReply_` with a secure model call
 * from Apps Script (or a separate server) while keeping the same request/response shape.
 */

function lhInterview_nowIso_() {
  return new Date().toISOString();
}

function lhInterview_sanitizeText_(value) {
  if (value === null || value === undefined) return '';
  return String(value).slice(0, 4000);
}

function lhInterview_pickNpcForRealm_(realmId) {
  var rid = String(realmId || '');
  if (rid === 'realm_aethelwood') return { npc_id: 'npc_ag_elder_thorne', name: 'Elder Thorne', title: 'High Warden of Aethelwood' };
  if (rid === 'realm_etheric_nexus') return { npc_id: 'npc_it_technomancer_zero', name: 'Technomancer Zero', title: 'Core Overseer of the Nexus' };
  if (rid === 'realm_monolith_masonry') return { npc_id: 'npc_arch_master_mason_kael', name: 'Master Mason Kael', title: 'Architect of the Monolith' };
  return { npc_id: 'npc_guild_proctor', name: 'Guild Proctor', title: 'High Council Liaison' };
}

function lhInterview_buildReply_(turnIndex, npc, lastUserText) {
  // 0-based question index; keep replies short (2–3 sentences).
  if (turnIndex <= 0) {
    return (
      'I am ' +
      npc.name +
      ', ' +
      npc.title +
      '. Answer with clarity, Traveler. Why do you seek to serve this Guild?'
    );
  }
  if (turnIndex === 1) {
    return (
      'So noted. Tell me of a time you solved a problem using your unique skills — what did you do, and what was the outcome?'
    );
  }
  if (turnIndex === 2) {
    return 'Accepted. How do you handle disputes with fellow Travelers when emotions run high?';
  }
  return 'The interview is concluded. I will now weigh your merits.';
}

/**
 * Runs a single GT-102 turn. Client sends current transcript turns + new user text.
 *
 * Request:
 * - player_id: string
 * - realm_id: string
 * - transcript: { turns: [{ role:'user'|'npc', text:string, at_iso:string }], favor:number }
 * - user_text: string
 *
 * Response:
 * - ok: boolean
 * - npc: { npc_id, name, title }
 * - reply_text: string
 * - next: { turns, favor, finished:boolean }
 */
function LhInterview_runGt102Turn(body) {
  try {
    if (!body || typeof body !== 'object') {
      return { ok: false, error: 'body_required' };
    }
    var playerId = lhInterview_sanitizeText_(body.player_id);
    var realmId = lhInterview_sanitizeText_(body.realm_id);
    if (!playerId) return { ok: false, error: 'player_id_required' };
    if (!realmId) return { ok: false, error: 'realm_id_required' };

    var npc = lhInterview_pickNpcForRealm_(realmId);
    var transcript = body.transcript && typeof body.transcript === 'object' ? body.transcript : {};
    var turns = Array.isArray(transcript.turns) ? transcript.turns : [];
    var favor = Number(transcript.favor);
    if (!Number.isFinite(favor)) favor = 50;

    var userText = lhInterview_sanitizeText_(body.user_text);

    // If user text provided, append it.
    if (userText) {
      turns = turns.concat([{ role: 'user', text: userText, at_iso: lhInterview_nowIso_() }]);

      // Simple professionalism heuristic (server-side, deterministic).
      if (userText.length > 20) favor += 5;
      if (userText[0] && userText[0] === userText[0].toUpperCase()) favor += 2;
      if (/[.!?]$/.test(userText)) favor += 2;
      if (/\bidk\b|\blol\b|\bgonna\b/i.test(userText)) favor -= 15;
      if (favor < 0) favor = 0;
      if (favor > 100) favor = 100;
    }

    // Determine which question we are on by counting user answers (max 3).
    var userCount = 0;
    for (var i = 0; i < turns.length; i++) {
      if (turns[i] && turns[i].role === 'user') userCount++;
    }

    var reply = lhInterview_buildReply_(userCount === 0 ? 0 : userCount, npc, userText);
    turns = turns.concat([{ role: 'npc', text: reply, at_iso: lhInterview_nowIso_() }]);

    var finished = reply.indexOf('The interview is concluded.') !== -1 || userCount >= 3;

    return {
      ok: true,
      npc: npc,
      reply_text: reply,
      next: {
        turns: turns,
        favor: favor,
        finished: finished,
      },
    };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

