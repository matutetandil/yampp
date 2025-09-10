import { ClaudeOutputManager } from '../../claude-output-manager.js';

export interface InputManagerOptions {
  overrides?: Map<string, string>;
  nonInteractive?: boolean;
  dryRun?: boolean;
  plan?: boolean;
  outputManager?: ClaudeOutputManager;
}