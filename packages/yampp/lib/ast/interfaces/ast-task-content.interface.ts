import type { Parameter } from '../../core/types/parameter.js';

/**
 * Task content interface
 * Focused on task execution content and parameters
 */
export interface IAstTaskContent {
  /**
   * Get task commands
   */
  getCommands(): string[];

  /**
   * Get task parameters
   */
  getParameters(): Parameter[];

  /**
   * Get task calls
   */
  getCalls(): any[];

  /**
   * Get inputs
   */
  getInputs(): any[];

  /**
   * Get internal functions
   */
  getInternalFunctions(): any[];
}