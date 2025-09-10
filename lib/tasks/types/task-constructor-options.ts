import { Parameter } from '../../core/types/parameter.js';

/**
 * Options for Task constructor
 */
export interface TaskConstructorOptions {
  /** Task name */
  name: string;
  
  /** Task modifiers */
  modifiers?: string[];
  
  /** Task dependencies */
  dependencies?: string[];
  
  /** Task commands */
  commands?: string[];
  
  /** Line number in source file */
  lineNumber?: number | null;
  
  /** Task parameters */
  parameters?: Parameter[];
  
  /** Dependency parameters */
  dependencyParams?: Record<string, Parameter[]>;
  
  /** Watched files */
  watchedFiles?: string[];
  
  /** Local variables */
  localVariables?: Map<string, string>;
  
  /** Local constants */
  localConstants?: Map<string, string>;
  
  /** Local environment variables */
  localEnvironmentVariables?: Map<string, string>;
  
  /** Task calls (deprecated) */
  calls?: unknown[];
  
  /** User inputs */
  inputs?: unknown[];
  
  /** Internal functions */
  internalFunctions?: unknown[];
}