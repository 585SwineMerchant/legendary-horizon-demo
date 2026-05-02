/** Payload for in-world NPC dialogue overlay (Milestone 16). */
export type LhNpcDialogueOverlayModel = {
  npcId: string;
  title: string;
  speakerLabel: string;
  body: string;
  portraitUrl?: string;
};
