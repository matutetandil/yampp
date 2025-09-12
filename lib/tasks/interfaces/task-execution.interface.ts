export interface ITaskExecution {
  /**
   * Get task commands to execute
   */
  getCommands(): string[];

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

  /**
   * Get task calls (calls to other tasks)
   */
  getCalls(): unknown[];

  /**
   * Get task inputs (user prompts)
   */
  getInputs(): unknown[];

  /**
   * Get internal functions used by task
   */
  getInternalFunctions(): unknown[];
}