import chalk from 'chalk';

/**
 * Interface for output logging operations
 * Focused on capturing and displaying output content
 */
export interface IOutputLogger {
  /**
   * Add output line for a specific task
   */
  addOutput(taskId: string, line: string, isError?: boolean): void;

  /**
   * Log a general message
   */
  log(message: string, color?: typeof chalk.white): void;

  /**
   * Log an error message
   */
  error(message: string): void;
}