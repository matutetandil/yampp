/**
 * Interface for managing task lifecycle in output system
 * Focused on task state management operations
 */
export interface ITaskLifecycleManager {
  /**
   * Initialize the output manager
   */
  initialize(): void;

  /**
   * Start tracking output for a task
   */
  startTask(taskId: string, taskName: string): void;

  /**
   * Mark task as completed and finalize output
   */
  completeTask(taskId: string, success?: boolean): void;
}