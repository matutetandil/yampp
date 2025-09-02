/**
 * VariableSubstitution handles variable substitution and assignment operations
 * Separated from Runner for Single Responsibility Principle
 */
export class VariableSubstitution {
  /**
   * Substitute variables in command string
   * @param {string} command - Command with variables to substitute
   * @param {Map} variables - Variables map
   * @returns {string} - Command with substituted variables
   */
  static substituteVariables(command, variables) {
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
   * @param {string} command - Assignment command (_assign varname = value)
   * @param {Map} variables - Variables map to update
   * @throws {Error} - If assignment syntax is invalid
   */
  static async handleAssignment(command, variables) {
    // Parse assignment: _assign varname = value
    const match = command.match(/^_assign\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+)$/);
    if (!match) {
      throw new Error(`Invalid assignment syntax: ${command}`);
    }
    
    const [, varName, value] = match;
    const substitutedValue = this.substituteVariables(value, variables);
    
    // Update the variable (only for vars, not consts)
    variables.set(varName, substitutedValue);
  }

  /**
   * Check if command is variable assignment
   * @param {string} command - Command to check
   * @returns {boolean} - True if assignment command
   */
  static isAssignmentCommand(command) {
    return /^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+)/.test(command.trim()) || 
           command.startsWith('_assign ');
  }

  /**
   * Handle generic variable assignment (not _assign syntax)
   * @param {string} command - Assignment command (varname = value)
   * @param {Map} variables - Variables map to update
   */
  static async handleGenericAssignment(command, variables) {
    const trimmedCommand = command.trim();
    const match = trimmedCommand.match(/^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+)/);
    
    if (match) {
      const [, varName, value] = match;
      const substitutedValue = this.substituteVariables(value, variables);
      variables.set(varName, substitutedValue);
    }
  }

  /**
   * Substitute variables in array of parameters
   * @param {Array} params - Array of parameter objects with type/value structure
   * @param {Map} variables - Variables map
   * @returns {Array} - Parameters with substituted values
   */
  static substituteParameterVariables(params, variables) {
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
   * @param {Object} task - Task definition
   * @param {Array} parameters - Task parameters
   * @param {Map} globalConstants - Global constants
   * @param {Map} globalVariables - Global variables
   * @param {Map} globalEnvironmentVariables - Global environment variables
   * @returns {Map} - Combined variables map
   */
  static setupTaskVariables(task, parameters, globalConstants, globalVariables, globalEnvironmentVariables) {
    const variables = new Map();
    
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
    for (const [name, value] of task.localConstants || new Map()) {
      variables.set(name, value);
    }
    for (const [name, value] of task.localVariables || new Map()) {
      variables.set(name, value);
    }
    for (const [name, value] of task.localEnvironmentVariables || new Map()) {
      variables.set(name, value);
    }
    
    // Set parameter variables (highest precedence - override everything if same name)
    for (let i = 0; i < (task.parameters?.length || 0); i++) {
      if (i < parameters.length) {
        variables.set(task.parameters[i], parameters[i]);
      }
    }
    
    return variables;
  }

  /**
   * Build export commands for cooperative control system
   * @param {Object} task - Task definition  
   * @param {Array} parameters - Task parameters
   * @returns {Array} - Array of export commands
   */
  static buildPreExportCommands(task, parameters) {
    const exportCommands = [];
    
    // Export task parameters using common parameter names for internal function intercepts
    for (let i = 0; i < (task.parameters?.length || 0) && i < parameters.length; i++) {
      const paramName = task.parameters[i];
      const paramValue = parameters[i];
      exportCommands.push(`export ${paramName}='${paramValue}'`);
    }
    
    return exportCommands;
  }
}