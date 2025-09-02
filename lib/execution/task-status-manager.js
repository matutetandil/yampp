/**
 * Task Status Manager
 * Applies State Pattern for task status tracking
 * Separates status management concerns from task orchestration logic
 */
export class TaskStatusManager {
  constructor() {
    this.completed = new Set();
    this.failed = new Set();
    this.running = new Map();
  }

  /**
   * Start tracking a task
   * @param {string} taskId - Task instance ID
   */
  startTask(taskId) {
    this.running.set(taskId, Date.now());
  }

  /**
   * Mark task as completed successfully
   * @param {string} taskId - Task instance ID
   */
  completeTask(taskId) {
    this.running.delete(taskId);
    this.completed.add(taskId);
  }

  /**
   * Mark task as failed
   * @param {string} taskId - Task instance ID
   * @param {string} error - Error message (optional)
   */
  failTask(taskId, error = null) {
    this.running.delete(taskId);
    if (error) {
      this.failed.add({ taskId, error });
    } else {
      this.failed.add(taskId);
    }
  }

  /**
   * Get current status of a task
   * @param {string} taskId - Task instance ID
   * @returns {string} - Task status: 'pending', 'running', 'completed', 'failed'
   */
  getTaskStatus(taskId) {
    if (this.running.has(taskId)) return 'running';
    if (this.completed.has(taskId)) return 'completed';
    if (this.isTaskFailed(taskId)) return 'failed';
    return 'pending';
  }

  /**
   * Check if task is currently running
   * @param {string} taskId - Task instance ID
   * @returns {boolean} - True if task is running
   */
  isTaskRunning(taskId) {
    return this.running.has(taskId);
  }

  /**
   * Check if task completed successfully
   * @param {string} taskId - Task instance ID
   * @returns {boolean} - True if task completed
   */
  isTaskCompleted(taskId) {
    return this.completed.has(taskId);
  }

  /**
   * Check if task failed
   * @param {string} taskId - Task instance ID
   * @returns {boolean} - True if task failed
   */
  isTaskFailed(taskId) {
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
   * @param {string} taskId - Task instance ID
   * @returns {number|null} - Runtime in ms, or null if not running
   */
  getTaskRuntime(taskId) {
    const startTime = this.running.get(taskId);
    return startTime ? Date.now() - startTime : null;
  }

  /**
   * Get all running tasks
   * @returns {Array} - Array of task IDs currently running
   */
  getRunningTasks() {
    return Array.from(this.running.keys());
  }

  /**
   * Get all completed tasks
   * @returns {Array} - Array of completed task IDs
   */
  getCompletedTasks() {
    return Array.from(this.completed);
  }

  /**
   * Get all failed tasks
   * @returns {Array} - Array of failed task IDs or error objects
   */
  getFailedTasks() {
    return Array.from(this.failed);
  }

  /**
   * Get execution summary statistics
   * @returns {Object} - Summary with success status and counts
   */
  getExecutionSummary() {
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
   * @returns {boolean} - True if no tasks are running
   */
  allTasksFinished() {
    return this.running.size === 0;
  }

  /**
   * Check if execution was successful (no failures)
   * @returns {boolean} - True if no tasks failed
   */
  isExecutionSuccessful() {
    return this.failed.size === 0;
  }

  /**
   * Clear all status tracking (useful for testing)
   */
  reset() {
    this.completed.clear();
    this.failed.clear();
    this.running.clear();
  }

  /**
   * Get detailed status report
   * @returns {Object} - Detailed status information
   */
  getDetailedStatus() {
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
   * @returns {Object} - Status data suitable for JSON serialization
   */
  exportStatus() {
    return {
      timestamp: Date.now(),
      summary: this.getExecutionSummary(),
      details: this.getDetailedStatus()
    };
  }
}