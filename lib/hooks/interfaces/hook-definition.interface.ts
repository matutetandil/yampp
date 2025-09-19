import { HookType } from '../types/hook-type.js';

/**
 * Definition of a single hook
 * Follows SRP by containing only hook definition data
 */
export interface IHookDefinition {
  readonly id: string;
  readonly type: HookType;
  readonly taskName?: string; // undefined for global hooks
  readonly commands: readonly string[];
  readonly condition?: string; // Optional condition for conditional hooks
  readonly runOnce?: boolean; // For deduplication
}