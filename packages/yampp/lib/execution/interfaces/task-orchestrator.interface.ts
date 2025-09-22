import { TaskInstance } from '../../tasks/types/task-instance.js';
import { TaskCall } from '../../tasks/types/task-call.js';
import { ExecutionResult } from '../types/execution-result.js';

/**
 * Interface for task orchestration and execution coordination
 * Abstracts task execution workflow for better testability and DIP compliance
 */
export interface ITaskOrchestrator {
  /**
   * Execute a list of task instances in the proper order
   */
  execute(executionPlan: TaskInstance[]): Promise<ExecutionResult>;

  /**
   * Build execution plan from task calls, resolving dependencies
   */
  buildExecutionPlan(taskCalls: TaskCall[]): Promise<TaskInstance[]>;

  /**
   * Execute a single task call (internal function)
   */
  executeCall(
    taskName: string,
    params?: any[],
    shouldIgnoreFailures?: boolean,
    executeAsync?: boolean
  ): Promise<void>;

  /**
   * Execute a single task instance
   */
  executeTask(taskInstance: TaskInstance): Promise<boolean>;

  /**
   * Check if all dependencies are satisfied for a task
   */
  areDependenciesSatisfied(taskName: string): boolean;

  /**
   * Get execution summary with statistics
   */
  getExecutionSummary(): {
    completed: number;
    failed: number;
    ignored: number;
    total: number;
  };
}