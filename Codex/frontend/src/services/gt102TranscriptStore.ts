import type { Gt102TranscriptState } from './gt102Gateway';

const STORAGE_KEY = 'lh_gt102_transcripts_v1';

type StoreShape = Record<
  string,
  {
    player_id: string;
    realm_id: string;
    created_iso: string;
    state: Gt102TranscriptState;
  }
>;

function readStore(): StoreShape {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as StoreShape;
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed;
  } catch {
    return {};
  }
}

function writeStore(store: StoreShape): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    /* ignore quota */
  }
}

export function saveGt102Transcript(args: {
  transcriptId: string;
  playerId: string;
  realmId: string;
  createdIso: string;
  state: Gt102TranscriptState;
}): void {
  const store = readStore();
  store[args.transcriptId] = {
    player_id: args.playerId,
    realm_id: args.realmId,
    created_iso: args.createdIso,
    state: args.state,
  };
  writeStore(store);
}

export function loadGt102Transcript(transcriptId: string): StoreShape[string] | null {
  const store = readStore();
  return store[transcriptId] ?? null;
}

export function listGt102TranscriptsForPlayer(playerId: string): Array<{
  transcript_id: string;
  realm_id: string;
  created_iso: string;
}> {
  const store = readStore();
  return Object.entries(store)
    .filter(([, row]) => row.player_id === playerId)
    .map(([id, row]) => ({ transcript_id: id, realm_id: row.realm_id, created_iso: row.created_iso }))
    .sort((a, b) => b.created_iso.localeCompare(a.created_iso));
}

