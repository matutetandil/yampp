/**
 * Interface for execution analytics and summary information
 * Focused on high-level execution insights
 */
export interface ITaskExecutionAnalytics {
  /**
   * Get execution summary statistics
   */
  getExecutionSummary(): {
    success: boolean;
    completed: number;
    failed: number;
    ignored: number;
    running: number;
    total: number;
  };

  /**
   * Check if all tasks have finished (none running)
   */
  allTasksFinished(): boolean;

  /**
   * Check if execution was successful (no failures)
   */
  isExecutionSuccessful(): boolean;

  /**
   * Get detailed status report
   */
  getDetailedStatus(): {
    success: boolean;
    completed: number;
    failed: number;
    ignored: number;
    running: number;
    total: number;
    runningTasks: Array<{ taskId: string; runtime: number | null }>;
    completedTasks: string[];
    failedTasks: (string | { taskId: string; error: string })[];
    ignoredTasks: (string | { taskId: string; error: string })[];
  };
}