/**
 * Task definition interface
 */
export interface Task {
  /** Task name */
  name: string;
  
  /** Task modifiers */
  modifiers: Set<string>;
  
  /** Task commands to execute */
  commands: string[];
  
  /** Task dependencies */
  dependencies: string[];
  
  /** Dependency parameters */
  dependencyParams: Record<string, unknown[]>;
  
  /** Task parameters */
  parameters: string[];
  
  /** Line number in source file */
  lineNumber: number | null;
  
  /** Task status */
  status: string;
  
  /** Task error */
  error: string | null;
  
  /** Watched files for file-based caching */
  watchedFiles: string[];
  
  /** Runtime variables */
  variables: Map<string, string>;
  
  /** Local variables */
  localVariables: Map<string, string>;
  
  /** Local constants */
  localConstants: Map<string, string>;
  
  /** Local environment variables */
  localEnvironmentVariables: Map<string, string>;
  
  /** Task calls (deprecated) */
  calls: unknown[];
  
  /** User inputs */
  inputs: unknown[];
  
  /** Internal functions */
  internalFunctions: unknown[];
  
  /** Whether task should always run (ignore cache) */
  get isAlways(): boolean;
  
  /** Whether task should run serially */
  get isSerial(): boolean;
  
  /** Whether task is critical */
  get isCritical(): boolean;
  
  /** Whether task should run in parallel */
  get isParallel(): boolean;
  
  /**
   * Check if task has modifier
   */
  hasModifier(modifier: string): boolean;
  
  /**
   * Check if task has watched files
   */
  hasWatchedFiles(): boolean;
  
  /**
   * Check if task has parameter
   */
  hasParameter(name: string): boolean;
  
  /**
   * Set variable
   */
  setVariable(name: string, value: string): void;
  
  /**
   * Get variable
   */
  getVariable(name: string): string | undefined;
  
  /**
   * Get task signature
   */
  getSignature(): string;
  
  /**
   * Get dependency with parameters
   */
  getDependencyWithParams(depName: string): string;
  
  /**
   * Substitute variables in command
   */
  substituteVariables(command: string): string;
}