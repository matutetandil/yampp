/**
 * Manager for shell state and variables
 */
export interface StateManager {
  /**
   * Get internal variables as Map
   */
  getInternalVariables(): Map<string, string>;
  
  /**
   * Set a variable value
   */
  setVariable(key: string, value: string): void;
  
  /**
   * Synchronize variables to shell environment
   */
  syncToShell(): void;
  
  /** Pending exports to shell */
  pendingExports: Map<string, string>;
}