import { ITaskStatusManager } from '../tasks/interfaces/task-status-manager.interface.js';

/**
 * Task Status Manager
 * Applies State Pattern for task status tracking
 * Separates status management concerns from task orchestration logic
 * 
 * Implements segregated interfaces following Interface Segregation Principle
 */
export class TaskStatusManager implements ITaskStatusManager {
  private readonly completed: Set<string>;
  private readonly failed: Set<string | { taskId: string; error: string }>;
  private readonly running: Map<string, number>;

  constructor() {
    this.completed = new Set();
    this.failed = new Set();
    this.running = new Map();
  }

  /**
   * Start tracking a task
   * @param taskId - Task instance ID
   */
  public startTask(taskId: string): void {
    this.running.set(taskId, Date.now());
  }

  /**
   * Mark task as completed successfully
   * @param taskId - Task instance ID
   */
  public completeTask(taskId: string): void {
    this.running.delete(taskId);
    this.completed.add(taskId);
  }

  /**
   * Mark task as failed
   * @param taskId - Task instance ID
   * @param error - Error message (optional)
   */
  public failTask(taskId: string, error?: string): void {
    this.running.delete(taskId);
    if (error) {
      this.failed.add({ taskId, error });
    } else {
      this.failed.add(taskId);
    }
  }

  /**
   * Get current status of a task
   * @param taskId - Task instance ID
   * @returns Task status: 'pending', 'running', 'completed', 'failed'
   */
  public getTaskStatus(taskId: string): 'pending' | 'running' | 'completed' | 'failed' {
    if (this.running.has(taskId)) return 'running';
    if (this.completed.has(taskId)) return 'completed';
    if (this.isTaskFailed(taskId)) return 'failed';
    return 'pending';
  }

  /**
   * Check if task is currently running
   * @param taskId - Task instance ID
   * @returns True if task is running
   */
  public isTaskRunning(taskId: string): boolean {
    return this.running.has(taskId);
  }

  /**
   * Check if task completed successfully
   * @param taskId - Task instance ID
   * @returns True if task completed
   */
  public isTaskCompleted(taskId: string): boolean {
    return this.completed.has(taskId);
  }

  /**
   * Check if task failed
   * @param taskId - Task instance ID
   * @returns True if task failed
   */
  public isTaskFailed(taskId: string): boolean {
    // Handle both simple taskId strings and error objects
    for (const item of this.failed) {
      if (typeof item === 'string' && item === taskId) {
        return true;
      } else if (typeof item === 'object' && item.taskId === taskId) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get task runtime in milliseconds
   * @param taskId - Task instance ID
   * @returns Runtime in ms, or null if not running
   */
  public getTaskRuntime(taskId: string): number | null {
    const startTime = this.running.get(taskId);
    return startTime ? Date.now() - startTime : null;
  }

  /**
   * Get all running tasks
   * @returns Array of task IDs currently running
   */
  public getRunningTasks(): string[] {
    return Array.from(this.running.keys());
  }

  /**
   * Get all completed tasks
   * @returns Array of completed task IDs
   */
  public getCompletedTasks(): string[] {
    return Array.from(this.completed);
  }

  /**
   * Get all failed tasks
   * @returns Array of failed task IDs or error objects
   */
  public getFailedTasks(): (string | { taskId: string; error: string })[] {
    return Array.from(this.failed);
  }

  /**
   * Get execution summary statistics
   * @returns Summary with success status and counts
   */
  public getExecutionSummary(): {
    success: boolean;
    completed: number;
    failed: number;
    running: number;
    total: number;
  } {
    return {
      success: this.failed.size === 0,
      completed: this.completed.size,
      failed: this.failed.size,
      running: this.running.size,
      total: this.completed.size + this.failed.size + this.running.size
    };
  }

  /**
   * Check if all tasks have finished (none running)
   * @returns True if no tasks are running
   */
  public allTasksFinished(): boolean {
    return this.running.size === 0;
  }

  /**
   * Check if execution was successful (no failures)
   * @returns True if no tasks failed
   */
  public isExecutionSuccessful(): boolean {
    return this.failed.size === 0;
  }

  /**
   * Clear all status tracking (useful for testing)
   */
  public reset(): void {
    this.completed.clear();
    this.failed.clear();
    this.running.clear();
  }

  /**
   * Get detailed status report
   * @returns Detailed status information
   */
  public getDetailedStatus(): {
    success: boolean;
    completed: number;
    failed: number;
    running: number;
    total: number;
    runningTasks: Array<{ taskId: string; runtime: number | null }>;
    completedTasks: string[];
    failedTasks: (string | { taskId: string; error: string })[];
  } {
    const summary = this.getExecutionSummary();
    
    return {
      ...summary,
      runningTasks: this.getRunningTasks().map(taskId => ({
        taskId,
        runtime: this.getTaskRuntime(taskId)
      })),
      completedTasks: this.getCompletedTasks(),
      failedTasks: this.getFailedTasks()
    };
  }

  /**
   * Export status for external monitoring
   * @returns Status data suitable for JSON serialization
   */
  public exportStatus(): {
    timestamp: number;
    summary: {
      success: boolean;
      completed: number;
      failed: number;
      running: number;
      total: number;
    };
    details: {
      success: boolean;
      completed: number;
      failed: number;
      running: number;
      total: number;
      runningTasks: Array<{ taskId: string; runtime: number | null }>;
      completedTasks: string[];
      failedTasks: (string | { taskId: string; error: string })[];
    };
  } {
    return {
      timestamp: Date.now(),
      summary: this.getExecutionSummary(),
      details: this.getDetailedStatus()
    };
  }
}