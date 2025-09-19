import { IHookDefinition } from './hook-definition.interface.js';
import { IHookContext } from './hook-context.interface.js';
import { IHookExecutionResult } from './hook-execution-result.interface.js';
import { HookType } from '../types/hook-type.js';

/**
 * High-level interface for hook management and execution coordination
 * Follows ISP by focusing on management and coordination responsibilities
 */
export interface IHookManager {
  /**
   * Execute hooks of a specific type for a task
   */
  executeHooks(type: HookType, context: IHookContext): Promise<IHookExecutionResult[]>;

  /**
   * Execute global hooks (before_all, after_all)
   */
  executeGlobalHooks(type: 'before_all' | 'after_all', context: IHookContext): Promise<IHookExecutionResult[]>;

  /**
   * Register hooks from parsed definitions
   */
  registerHooksFromDefinitions(definitions: IHookDefinition[]): void;

  /**
   * Check if any hooks are registered for a type/task combination
   */
  hasHooks(type: HookType, taskName?: string): boolean;
}