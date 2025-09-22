import { IHookContext } from './interfaces/hook-context.interface.js';
import { IHookExecutionResult } from './interfaces/hook-execution-result.interface.js';

/**
 * Interface for integrating hooks into task lifecycle
 * Follows ISP by focusing only on lifecycle integration
 */
export interface ITaskLifecycleHooks {
  /**
   * Execute before_all hooks (once per execution)
   */
  executeBeforeAll(context: IHookContext): Promise<IHookExecutionResult[]>;

  /**
   * Execute before hooks for a specific task
   */
  executeBefore(taskName: string, context: IHookContext): Promise<IHookExecutionResult[]>;

  /**
   * Execute after hooks for a specific task
   */
  executeAfter(taskName: string, context: IHookContext): Promise<IHookExecutionResult[]>;

  /**
   * Execute finally hooks for a specific task (always runs)
   */
  executeFinally(taskName: string, context: IHookContext): Promise<IHookExecutionResult[]>;

  /**
   * Execute after_all hooks (once per execution)
   */
  executeAfterAll(context: IHookContext): Promise<IHookExecutionResult[]>;
}