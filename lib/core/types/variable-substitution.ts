/**
 * Variable substitution utility interface
 */
export interface VariableSubstitutionStatic {
  /**
   * Set up task variables
   */
  setupTaskVariables(
    task: unknown,
    parameters: string[],
    globalConstants?: Map<string, string>,
    globalVariables?: Map<string, string>,
    globalEnvironmentVariables?: Map<string, string>
  ): Map<string, string>;
  
  /**
   * Build pre-export commands
   */
  buildPreExportCommands(task: unknown, parameters: string[]): string[];
  
  /**
   * Check if command is assignment
   */
  isAssignmentCommand(command: string): boolean;
  
  /**
   * Handle variable assignment
   */
  handleAssignment(command: string, variables: Map<string, string>): Promise<void>;
  
  /**
   * Handle generic assignment
   */
  handleGenericAssignment(command: string, variables: Map<string, string>): Promise<void>;
  
  /**
   * Substitute variables in command
   */
  substituteVariables(command: string, variables: Map<string, string>): string;
}