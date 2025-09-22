import { Task } from '../models/task.js';

/**
 * VariableSubstitution handles variable substitution and assignment operations
 * Separated from Runner for Single Responsibility Principle
 */
export class VariableSubstitution {
  /**
   * Substitute variables in command string
   * @param command - Command with variables to substitute
   * @param variables - Variables map
   * @returns Command with substituted variables
   */
  public static substituteVariables(command: string, variables: Map<string, string>): string {
    let result = command;
    
    // Replace $variable with actual values
    for (const [name, value] of variables) {
      const regex = new RegExp(`\\$${name}\\b`, 'g');
      result = result.replace(regex, value);
    }
    
    return result;
  }

  /**
   * Handle variable assignment command
   * @param command - Assignment command (_assign varname = value)
   * @param variables - Variables map to update
   * @throws Error - If assignment syntax is invalid
   */
  public static async handleAssignment(command: string, variables: Map<string, string>): Promise<void> {
    // Parse assignment: _assign varname = value
    const match = command.match(/^_assign\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+)$/);
    if (!match) {
      throw new Error(`Invalid assignment syntax: ${command}`);
    }
    
    const [, varName, value] = match;
    if (!varName || !value) {
      throw new Error(`Invalid assignment syntax: ${command}`);
    }
    const substitutedValue = this.substituteVariables(value, variables);
    
    // Update the variable (only for vars, not consts)
    variables.set(varName, substitutedValue);
  }

  /**
   * Check if command is variable assignment
   * @param command - Command to check
   * @returns True if assignment command
   */
  public static isAssignmentCommand(command: string): boolean {
    return /^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+)/.test(command.trim()) || 
           command.startsWith('_assign ');
  }

  /**
   * Handle generic variable assignment (not _assign syntax)
   * @param command - Assignment command (varname = value)
   * @param variables - Variables map to update
   */
  public static async handleGenericAssignment(command: string, variables: Map<string, string>): Promise<void> {
    const trimmedCommand = command.trim();
    const match = trimmedCommand.match(/^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+)/);
    
    if (match) {
      const [, varName, value] = match;
      if (varName && value) {
        const substitutedValue = this.substituteVariables(value, variables);
        variables.set(varName, substitutedValue);
      }
    }
  }

  /**
   * Substitute variables in array of parameters
   * @param params - Array of parameter objects with type/value structure
   * @param variables - Variables map
   * @returns Parameters with substituted values
   */
  public static substituteParameterVariables(
    params: Array<{ type: string; value: string; [key: string]: any }>, 
    variables: Map<string, string>
  ): Array<{ type: string; value: string; [key: string]: any }> {
    return params.map(param => {
      if (param.type === 'string' || param.type === 'identifier') {
        return {
          ...param,
          value: this.substituteVariables(param.value, variables)
        };
      }
      return param;
    });
  }

  /**
   * Set up task variables with proper precedence
   * @param task - Task definition
   * @param parameters - Task parameters
   * @param globalConstants - Global constants
   * @param globalVariables - Global variables
   * @param globalEnvironmentVariables - Global environment variables
   * @returns Combined variables map
   */
  public static setupTaskVariables(
    task: Task,
    parameters: string[],
    globalConstants?: Map<string, string>,
    globalVariables?: Map<string, string>,
    globalEnvironmentVariables?: Map<string, string>
  ): Map<string, string> {
    const variables = new Map<string, string>();
    
    // Add global variables and constants (lowest precedence)
    for (const [name, value] of globalConstants || new Map()) {
      variables.set(name, value);
    }
    for (const [name, value] of globalVariables || new Map()) {
      variables.set(name, value);
    }
    for (const [name, value] of globalEnvironmentVariables || new Map()) {
      variables.set(name, value);
    }
    
    // Add local constants and variables (override globals if same name)
    for (const [name, value] of task.getLocalConstants()) {
      variables.set(name, value);
    }
    for (const [name, value] of task.getLocalVariables()) {
      variables.set(name, value);
    }
    for (const [name, value] of task.getLocalEnvironmentVariables()) {
      variables.set(name, value);
    }
    
    // Set parameter variables (highest precedence - override everything if same name)
    const taskParameters = task.getParameters();
    for (let i = 0; i < taskParameters.length; i++) {
      const param = taskParameters[i];
      if (i < parameters.length && param) {
        variables.set(param.name, parameters[i] || '');
      }
    }
    
    return variables;
  }

  /**
   * Build export commands for cooperative control system
   * @param task - Task definition  
   * @param parameters - Task parameters
   * @returns Array of export commands
   */
  public static buildPreExportCommands(task: Task, parameters: string[]): string[] {
    const exportCommands: string[] = [];
    
    // Export task parameters using common parameter names for internal function intercepts
    const taskParameters = task.getParameters();
    for (let i = 0; i < taskParameters.length && i < parameters.length; i++) {
      const param = taskParameters[i];
      if (param) {
        const paramName = param.name;
        const paramValue = parameters[i];
        if (paramName) {
          exportCommands.push(`export ${paramName}='${paramValue}'`);
        }
      }
    }
    
    return exportCommands;
  }
}