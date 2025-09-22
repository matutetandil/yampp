/**
 * Interface for task command execution
 * Focused on command-related operations only
 */
export interface ITaskCommands {
  /**
   * Get task commands to execute
   */
  getCommands(): string[];

  /**
   * Get internal functions used by task
   */
  getInternalFunctions(): unknown[];
}