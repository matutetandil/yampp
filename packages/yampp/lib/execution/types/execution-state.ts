/**
 * Execution state manager for caching
 */
export interface ExecutionState {
  /**
   * Check if task is already done (cached)
   */
  isTaskDone(taskId: string): Promise<boolean>;
  
  /**
   * Get task cache timestamp
   */
  getTaskTimestamp(taskId: string): Promise<number>;
  
  /**
   * Mark task as done
   */
  markTaskDone(taskId: string): Promise<void>;
}