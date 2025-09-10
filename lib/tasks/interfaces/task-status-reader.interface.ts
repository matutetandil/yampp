/**
 * Interface for reading individual task status
 * Focused on single-task query operations
 */
export interface ITaskStatusReader {
  /**
   * Get current status of a task
   */
  getTaskStatus(taskId: string): 'pending' | 'running' | 'completed' | 'failed';

  /**
   * Check if task is currently running
   */
  isTaskRunning(taskId: string): boolean;

  /**
   * Check if task completed successfully
   */
  isTaskCompleted(taskId: string): boolean;

  /**
   * Check if task failed
   */
  isTaskFailed(taskId: string): boolean;

  /**
   * Get task runtime in milliseconds
   */
  getTaskRuntime(taskId: string): number | null;
}