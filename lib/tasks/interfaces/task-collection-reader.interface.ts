/**
 * Interface for reading collections of tasks by status
 * Focused on bulk query operations
 */
export interface ITaskCollectionReader {
  /**
   * Get all running tasks
   */
  getRunningTasks(): string[];

  /**
   * Get all completed tasks
   */
  getCompletedTasks(): string[];

  /**
   * Get all failed tasks
   */
  getFailedTasks(): (string | { taskId: string; error: string })[];

  /**
   * Get all ignored tasks (failed but ignored)
   */
  getIgnoredTasks(): (string | { taskId: string; error: string })[];
}