/**
 * Context for shell command execution with platform-specific information
 */
export interface ShellExecutionContext {
  /**
   * The processed shell command content to execute
   */
  content: string;
  
  /**
   * Platform-specific shell to use (bash, powershell, cmd)
   */
  shell: string;
  
  /**
   * Environment variables to set for execution
   */
  environment: Record<string, string>;
  
  /**
   * Working directory for command execution
   */
  workingDirectory: string;
  
  /**
   * Whether this context has internal functions that need interception
   */
  hasInternalFunctions: boolean;
  
  /**
   * Timeout for command execution in milliseconds
   */
  timeout?: number;
}