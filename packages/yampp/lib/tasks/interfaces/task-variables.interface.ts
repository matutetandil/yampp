export interface ITaskVariables {
  /**
   * Get all task variables
   */
  getVariables(): Map<string, string>;

  /**
   * Set a variable value
   * @param name - Variable name
   * @param value - Variable value
   */
  setVariable(name: string, value: string): void;

  /**
   * Get a specific variable value
   * @param name - Variable name
   */
  getVariable(name: string): string | undefined;

  /**
   * Get local variables defined in task
   */
  getLocalVariables(): Map<string, string>;

  /**
   * Get local constants defined in task
   */
  getLocalConstants(): Map<string, string>;

  /**
   * Get local environment variables defined in task
   */
  getLocalEnvironmentVariables(): Map<string, string>;

  /**
   * Substitute variables in a command string
   * @param command - Command string with variable placeholders
   */
  substituteVariables(command: string): string;
}