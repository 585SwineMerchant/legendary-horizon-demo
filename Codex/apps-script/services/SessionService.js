/**
 * SessionService — ephemeral session bookkeeping (timeouts, resumed device hints).
 */

function createSessionHints_(teacherContext) {
  Logger.log('SessionService.createSessionHints_ placeholder');
  return { roster_scope: teacherContext?.roster_scope || 'unknown' };
}

function touchSessionHeartbeat_(sessionToken) {
  return { ok: true };
}
