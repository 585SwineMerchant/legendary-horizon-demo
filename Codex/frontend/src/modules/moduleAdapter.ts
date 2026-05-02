import type { ModuleProgressState, ModuleResultPayload, PlayerSave, QuestDefinition } from '../types';

export type ModuleLoadContext = {
  player: PlayerSave;
  quests: QuestDefinition[];
};

export type ModuleResumeSummary = {
  headline: string;
  detail?: string;
};

/**
 * Shared adapter surface for assimilated sub-apps.
 * Modules should not own persistence; they emit progress + results to the shell.
 */
export type LhModuleAdapter = {
  module_id: string;
  loadModuleState: (ctx: ModuleLoadContext) => ModuleProgressState | null;
  buildResumeSummary: (progress: ModuleProgressState | null) => ModuleResumeSummary;
  submitModuleResult: (result: ModuleResultPayload) => void;
};

