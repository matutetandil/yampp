import { ExecutionContext } from '../../execution/types/execution-context.js';

/**
 * Manager for processing shell content with comments, proxies, etc.
 */
export interface ShellContentManager {
  /**
   * Check if command needs processing
   */
  needsProcessing(command: string): boolean;
  
  /**
   * Process command content and return execution context
   */
  process(command: string, localVariables?: any[], localConstants?: any[]): ExecutionContext;
}