/**
 * Interface for task status management
 * Focused on status and error tracking only
 */
export interface ITaskStatus {
  /**
   * Get task execution status
   */
  getStatus(): string;

  /**
   * Set task execution status
   * @param status - New status value
   */
  setStatus(status: string): void;

  /**
   * Get task execution error if any
   */
  getError(): string | null;

  /**
   * Set task execution error
   * @param error - Error message or null to clear
   */
  setError(error: string | null): void;
}