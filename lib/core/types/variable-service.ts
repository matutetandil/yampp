import { TaskInstance } from '../../tasks/types/task-instance';

/**
 * Interface for variable management operations
 * Separated from Runner to achieve Single Responsibility Principle
 */
export interface VariableService {
  /**
   * Substitute variables in text using context
   */
  substituteVariables(text: string, variables: Map<string, any>): string;

  /**
   * Generate pre-export commands for task parameters
   */
  generateParameterExports(taskInstance: TaskInstance): string[];

  /**
   * Merge global variables with task-specific variables
   */
  mergeVariables(taskVariables: Map<string, any>): Map<string, any>;

  /**
   * Get global variables
   */
  getGlobalVariables(): Map<string, any>;

  /**
   * Get global constants
   */
  getGlobalConstants(): Map<string, any>;

  /**
   * Get global environment variables
   */
  getGlobalEnvironmentVariables(): Map<string, any>;

  /**
   * Set global variables
   */
  setGlobalVariables(variables: Map<string, any>): void;

  /**
   * Set global constants
   */
  setGlobalConstants(constants: Map<string, any>): void;

  /**
   * Set global environment variables
   */
  setGlobalEnvironmentVariables(envVars: Map<string, any>): void;
}