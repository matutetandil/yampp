import { IHookDefinition } from './hook-definition.interface.js';
import { HookType } from '../types/hook-type.js';

/**
 * Interface for managing hook registration and retrieval
 * Follows ISP by focusing only on registry responsibilities
 */
export interface IHookRegistry {
  /**
   * Register a hook definition
   */
  registerHook(hook: IHookDefinition): void;

  /**
   * Get hooks by type
   */
  getHooksByType(type: HookType): readonly IHookDefinition[];

  /**
   * Get hooks by task name
   */
  getHooksByTask(taskName: string): readonly IHookDefinition[];

  /**
   * Get global hooks (before_all, after_all)
   */
  getGlobalHooks(): readonly IHookDefinition[];

  /**
   * Clear all registered hooks
   */
  clearHooks(): void;
}