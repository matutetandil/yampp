import type { Parameter } from '../../core/types/parameter.js';

/**
 * AST Task Adapter Interface
 * Defines the contract for accessing AST task data
 * 
 * Interface Segregation Principle: Clean, focused interface
 * Dependency Inversion Principle: Depend on abstraction, not concretion
 */
export interface IAstTaskAdapter {
  /**
   * Get task name
   */
  getName(): string;

  /**
   * Get task dependencies
   */
  getDependencies(): string[];

  /**
   * Get dependency parameters
   */
  getDependencyParams(): Record<string, any>;

  /**
   * Get task modifiers
   */
  getModifiers(): string[];

  /**
   * Get task commands
   */
  getCommands(): string[];

  /**
   * Get task parameters
   */
  getParameters(): Parameter[];

  /**
   * Get watched files
   */
  getWatchedFiles(): string[];

  /**
   * Get internal functions
   */
  getInternalFunctions(): any[];

  /**
   * Get task calls
   */
  getCalls(): any[];

  /**
   * Get inputs
   */
  getInputs(): any[];

  /**
   * Get local variables
   */
  getLocalVariables(): any[];

  /**
   * Get local constants
   */
  getLocalConstants(): any[];

  /**
   * Get local environment variables
   */
  getLocalEnvironmentVariables(): any[];

  /**
   * Get task location information
   */
  getLocation(): any;

  /**
   * Check if task has specific property
   */
  hasProperty(propertyName: string): boolean;

  /**
   * Get raw property value (escape hatch for extensibility)
   */
  getRawProperty(propertyName: string): any;
}