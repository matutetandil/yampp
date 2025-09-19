import { IHookDefinition } from './hook-definition.interface.js';
import { IHookContext } from './hook-context.interface.js';
import { IHookExecutionResult } from './hook-execution-result.interface.js';

/**
 * Interface for executing individual hooks
 * Follows ISP by focusing only on execution responsibilities
 */
export interface IHookExecutor {
  /**
   * Execute a single hook with given context
   */
  executeHook(hook: IHookDefinition, context: IHookContext): Promise<IHookExecutionResult>;

  /**
   * Check if a hook should be executed based on conditions
   */
  shouldExecuteHook(hook: IHookDefinition, context: IHookContext): boolean;
}