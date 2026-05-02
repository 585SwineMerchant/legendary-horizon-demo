import type { PlayerSave, RealmDefinition } from '../types';

export function buildResumeDialogBody(player: PlayerSave, realm: RealmDefinition): string {
  return `Brave Traveler ${player.display_name}, your last oath-mark was ${player.last_completed_summary} 

You now stand nearing ${realm.display_name} within Act ${player.current_act}. The land asks you to heed this thread: "${player.required_next_action}"

Return when the Ledger hums anew.`;
}
