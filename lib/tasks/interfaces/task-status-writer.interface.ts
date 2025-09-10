/**
 * Interface for writing/modifying task status
 * Focused on lifecycle management operations
 */
export interface ITaskStatusWriter {
  /**
   * Start tracking a task
   */
  startTask(taskId: string): void;

  /**
   * Mark task as completed successfully
   */
  completeTask(taskId: string): void;

  /**
   * Mark task as failed
   */
  failTask(taskId: string, error?: string): void;

  /**
   * Clear all status tracking (useful for testing)
   */
  reset(): void;
}