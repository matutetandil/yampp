import { OutputManager } from '../../output/types/output-manager.js';

export interface InputManagerOptions {
  overrides?: Map<string, string>;
  nonInteractive?: boolean;
  dryRun?: boolean;
  plan?: boolean;
  outputManager?: OutputManager;
}