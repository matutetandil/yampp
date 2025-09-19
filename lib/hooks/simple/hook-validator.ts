import { HookDetector } from './hook-detector.js';
import { ITaskMap } from '../../tasks/interfaces/task-map.interface.js';

/**
 * Validator for hook task relationships
 * Follows SRP by focusing only on validation logic
 */
export class HookValidator {
  /**
   * Validate that all hook tasks have corresponding target tasks
   */
  public static validateHooks(tasks: ITaskMap): string[] {
    const errors: string[] = [];
    const taskNames = Array.from(tasks.keys());

    for (const taskName of taskNames) {
      if (HookDetector.isHookTask(taskName) && !HookDetector.isGlobalHook(taskName)) {
        const targetTask = HookDetector.getTargetTaskName(taskName);

        if (targetTask && !tasks.has(targetTask)) {
          const hookType = HookDetector.getHookType(taskName);
          errors.push(`Hook task '${taskName}' requires target task '${targetTask}' but it doesn't exist`);
        }
      }
    }

    return errors;
  }

  /**
   * Get all hook tasks for a specific target task
   */
  public static getHooksForTask(targetTaskName: string, tasks: ITaskMap): {
    before?: string;
    after?: string;
    finally?: string;
  } {
    const hooks: { before?: string; after?: string; finally?: string } = {};

    const beforeTask = `before_${targetTaskName}`;
    const afterTask = `after_${targetTaskName}`;
    const finallyTask = `finally_${targetTaskName}`;

    if (tasks.has(beforeTask)) {
      hooks.before = beforeTask;
    }

    if (tasks.has(afterTask)) {
      hooks.after = afterTask;
    }

    if (tasks.has(finallyTask)) {
      hooks.finally = finallyTask;
    }

    return hooks;
  }

  /**
   * Get global hooks
   */
  public static getGlobalHooks(tasks: ITaskMap): {
    before_all?: string;
    after_all?: string;
  } {
    const hooks: { before_all?: string; after_all?: string } = {};

    if (tasks.has('before_all')) {
      hooks.before_all = 'before_all';
    }

    if (tasks.has('after_all')) {
      hooks.after_all = 'after_all';
    }

    return hooks;
  }
}