/**
 * Simple hook detection based on task naming conventions
 * Follows SRP by focusing only on hook detection logic
 */
export class HookDetector {
  /**
   * Check if a task name is a hook task
   */
  public static isHookTask(taskName: string): boolean {
    return this.isBeforeHook(taskName) ||
           this.isAfterHook(taskName) ||
           this.isFinallyHook(taskName) ||
           this.isGlobalHook(taskName);
  }

  /**
   * Check if task is a before hook
   */
  public static isBeforeHook(taskName: string): boolean {
    return taskName.startsWith('before_') && taskName !== 'before_all';
  }

  /**
   * Check if task is an after hook
   */
  public static isAfterHook(taskName: string): boolean {
    return taskName.startsWith('after_') && taskName !== 'after_all';
  }

  /**
   * Check if task is a finally hook
   */
  public static isFinallyHook(taskName: string): boolean {
    return taskName.startsWith('finally_');
  }

  /**
   * Check if task is a global hook
   */
  public static isGlobalHook(taskName: string): boolean {
    return taskName === 'before_all' || taskName === 'after_all';
  }

  /**
   * Get the target task name from a hook task
   * before_setup -> setup
   * after_build -> build
   * finally_test -> test
   */
  public static getTargetTaskName(hookTaskName: string): string | null {
    if (this.isGlobalHook(hookTaskName)) {
      return null; // Global hooks don't have target tasks
    }

    if (hookTaskName.startsWith('before_')) {
      return hookTaskName.substring(7); // Remove 'before_'
    }

    if (hookTaskName.startsWith('after_')) {
      return hookTaskName.substring(6); // Remove 'after_'
    }

    if (hookTaskName.startsWith('finally_')) {
      return hookTaskName.substring(8); // Remove 'finally_'
    }

    return null;
  }

  /**
   * Get hook type from task name
   */
  public static getHookType(taskName: string): 'before' | 'after' | 'finally' | 'before_all' | 'after_all' | null {
    if (taskName === 'before_all') return 'before_all';
    if (taskName === 'after_all') return 'after_all';
    if (taskName.startsWith('before_')) return 'before';
    if (taskName.startsWith('after_')) return 'after';
    if (taskName.startsWith('finally_')) return 'finally';
    return null;
  }
}