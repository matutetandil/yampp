/**
 * Manager for tracking task execution status
 */
export interface TaskStatusManager {
  /**
   * Start tracking a task
   */
  startTask(taskId: string): void;
  
  /**
   * Check if a task has failed
   */
  isTaskFailed(taskId: string): boolean;
  
  /**
   * Mark task as failed
   */
  failTask(taskId: string, errorMessage?: string): void;
  
  /**
   * Mark task as failed but ignored
   */
  ignoreTask(taskId: string, errorMessage?: string): void;
  
  /**
   * Complete a task successfully
   */
  completeTask(taskId: string): void;
  
  /**
   * Get current status of a task
   */
  getTaskStatus(taskId: string): 'pending' | 'running' | 'completed' | 'failed' | 'ignored';
  
  /**
   * Check if task is currently running
   */
  isTaskRunning(taskId: string): boolean;
  
  /**
   * Check if task completed successfully
   */
  isTaskCompleted(taskId: string): boolean;
  
  /**
   * Check if task failed but was ignored
   */
  isTaskIgnored(taskId: string): boolean;
  
  /**
   * Get task runtime in milliseconds
   */
  getTaskRuntime(taskId: string): number | null;
  
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
  
  /**
   * Get execution summary
   */
  getExecutionSummary(): { success: boolean; completed: number; failed: number; ignored: number; running: number; total: number };
  
  /**
   * Check if all tasks have finished
   */
  allTasksFinished(): boolean;
  
  /**
   * Check if execution was successful
   */
  isExecutionSuccessful(): boolean;
  
  /**
   * Clear all status tracking
   */
  reset(): void;
  
  /**
   * Get detailed status report
   */
  getDetailedStatus(): {
    success: boolean;
    completed: number;
    failed: number;
    running: number;
    total: number;
    runningTasks: Array<{ taskId: string; runtime: number | null }>;
    completedTasks: string[];
    failedTasks: (string | { taskId: string; error: string })[];
  };
  
  /**
   * Export status for external monitoring
   */
  exportStatus(): {
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
  };
}