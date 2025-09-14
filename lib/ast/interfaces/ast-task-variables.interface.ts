/**
 * Task variables interface
 * Focused on local variable management
 */
export interface IAstTaskVariables {
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
}