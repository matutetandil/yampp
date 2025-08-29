import { TaskGraph } from './task.js';

export class Validator {
  constructor() {
    this.validModifiers = new Set(['always', 'serial', 'critical']);
    this.errors = [];
    this.warnings = [];
  }
  
  validate(tasks, globalVariables = new Map(), globalConstants = new Map()) {
    this.errors = [];
    this.warnings = [];
    this.globalVariables = globalVariables;
    this.globalConstants = globalConstants;
    
    // Validate global variables and constants
    this.validateGlobalDeclarations();
    
    // Validate individual tasks
    for (const [name, task] of tasks) {
      this.validateTask(task);
    }
    
    // Validate graph structure
    if (tasks.size > 0) {
      this.validateGraph(tasks);
    }
    
    // Check for semantic issues
    this.checkSemantics(tasks);
    
    return {
      valid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings
    };
  }
  
  validateTask(task) {
    // Validate task name
    if (!task.name) {
      this.addError('Task must have a name', task.lineNumber);
    } else if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(task.name)) {
      this.addError(
        `Invalid task name '${task.name}'. Task names must start with a letter or underscore and contain only letters, numbers, and underscores`,
        task.lineNumber
      );
    }
    
    // Validate modifiers
    for (const modifier of task.modifiers) {
      if (!this.validModifiers.has(modifier)) {
        this.addError(
          `Invalid modifier '${modifier}'. Valid modifiers are: ${Array.from(this.validModifiers).join(', ')}`,
          task.lineNumber
        );
      }
    }
    
    // Check for conflicting modifiers
    if (task.hasModifier('serial') && task.hasModifier('parallel')) {
      this.addError(
        `Task '${task.name}' cannot be both serial and parallel`,
        task.lineNumber
      );
    }
    
    // Validate parameters
    for (const param of task.parameters) {
      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(param)) {
        this.addError(
          `Invalid parameter name '${param}' in task '${task.name}'. Parameter names must start with a letter or underscore and contain only letters, numbers, and underscores`,
          task.lineNumber
        );
      }
    }
    
    // Check for duplicate parameters
    const uniqueParams = new Set(task.parameters);
    if (uniqueParams.size < task.parameters.length) {
      this.addError(
        `Task '${task.name}' has duplicate parameters`,
        task.lineNumber
      );
    }
    
    // Validate dependencies
    for (const dep of task.dependencies) {
      if (dep === task.name) {
        this.addError(
          `Task '${task.name}' cannot depend on itself`,
          task.lineNumber
        );
      }
      
      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(dep)) {
        this.addError(
          `Invalid dependency name '${dep}' in task '${task.name}'`,
          task.lineNumber
        );
      }
    }
    
    // Validate dependency parameters with new $variable syntax
    for (const [depName, depParams] of Object.entries(task.dependencyParams)) {
      for (const param of depParams) {
        if (param.type === 'variable') {
          // Variable reference: must exist in task parameters
          if (!task.parameters.includes(param.name)) {
            this.addError(
              `Variable '$${param.name}' passed to dependency '${depName}' in task '${task.name}' is not defined as a task parameter`,
              task.lineNumber
            );
          }
          
          // Validate variable name format
          if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(param.name)) {
            this.addError(
              `Invalid variable name '$${param.name}' in dependency '${depName}' of task '${task.name}'`,
              task.lineNumber
            );
          }
        } else if (param.type === 'literal') {
          // Literal value: validate format (allow more characters for literal values)
          if (!/^[a-zA-Z0-9_.-]+$/.test(param.value)) {
            this.addWarning(
              `Literal value '${param.value}' in dependency '${depName}' of task '${task.name}' contains special characters`,
              task.lineNumber
            );
          }
        }
      }
    }
    
    // Validate commands
    if (task.commands.length === 0) {
      this.addWarning(
        `Task '${task.name}' has no commands`,
        task.lineNumber
      );
    }
    
    // Check for potentially dangerous commands
    for (const cmd of task.commands) {
      this.validateCommand(cmd, task);
    }
    
    // Validate variables and constants
    this.validateTaskVariables(task);
    
    // Validate inputs - must be in serial tasks
    this.validateTaskInputs(task);
    
    // Validate _call statements
    this.validateTaskCalls(task);
    
    // Validate watched files
    this.validateWatchedFiles(task);
  }
  
  validateCommand(command, task) {
    // Check for empty commands
    if (!command || !command.trim()) {
      this.addWarning(
        `Empty command in task '${task.name}'`,
        task.lineNumber
      );
      return;
    }
    
    // Check for potentially dangerous commands
    const dangerous = [
      { pattern: /rm\s+-rf\s+\/(?:\s|$)/, message: 'Dangerous rm -rf / command detected' },
      { pattern: />\s*\/dev\/sda/, message: 'Dangerous write to disk device detected' },
      { pattern: /fork\s*\(\s*\)\s*while.*true/, message: 'Potential fork bomb detected' }
    ];
    
    for (const { pattern, message } of dangerous) {
      if (pattern.test(command)) {
        this.addWarning(
          `${message} in task '${task.name}': ${command}`,
          task.lineNumber
        );
      }
    }
    
    // Check for unmatched quotes
    const quotes = ['"', "'", '`'];
    for (const quote of quotes) {
      const count = (command.match(new RegExp(quote, 'g')) || []).length;
      if (count % 2 !== 0) {
        this.addWarning(
          `Unmatched ${quote} in command for task '${task.name}': ${command}`,
          task.lineNumber
        );
      }
    }
  }
  
  validateGraph(tasks) {
    try {
      // Check that all dependencies exist and have compatible parameter counts
      for (const [taskName, task] of tasks) {
        for (const depName of task.dependencies) {
          const depTask = tasks.get(depName);
          if (!depTask) {
            this.addError(`Task '${taskName}' depends on undefined task '${depName}'`);
            continue;
          }
          
          const expectedParams = depTask.parameters.length;
          const providedParams = (task.dependencyParams[depName] || []).length;
          
          if (expectedParams !== providedParams) {
            this.addError(
              `Task '${taskName}' passes ${providedParams} parameter(s) to dependency '${depName}', but '${depName}' expects ${expectedParams} parameter(s)`,
              task.lineNumber
            );
          }
          
          // Validate that variable references exist in parent task
          const depParams = task.dependencyParams[depName] || [];
          for (const param of depParams) {
            if (param.type === 'variable' && !task.parameters.includes(param.name)) {
              this.addError(
                `Variable '$${param.name}' passed to dependency '${depName}' in task '${taskName}' is not defined as a task parameter`,
                task.lineNumber
              );
            }
          }
        }
      }
      
      // Note: We can't use TaskGraph here because it doesn't handle parameters yet
      // For now, we'll skip the unreachable task check
      
    } catch (error) {
      this.addError(error.message);
    }
  }
  
  checkSemantics(tasks) {
    // Check for duplicate dependencies
    for (const [name, task] of tasks) {
      const uniqueDeps = new Set(task.dependencies);
      if (uniqueDeps.size < task.dependencies.length) {
        const duplicates = task.dependencies.filter((dep, idx) => 
          task.dependencies.indexOf(dep) !== idx
        );
        this.addWarning(
          `Task '${name}' has duplicate dependencies: ${duplicates.join(' ')}`,
          task.lineNumber
        );
      }
    }
    
    // Check for tasks that might be meant to run always but don't have the modifier
    for (const [name, task] of tasks) {
      if ((name === 'clean' || name === 'format' || name === 'watch') && !task.hasModifier('always')) {
        this.addWarning(
          `Task '${name}' might need the 'always' modifier to run regardless of cache`,
          task.lineNumber
        );
      }
    }
    
    // Check for serial tasks that might benefit from parallel execution
    for (const [name, task] of tasks) {
      if (task.hasModifier('serial') && task.dependencies.length > 2) {
        this.addWarning(
          `Task '${name}' is marked as serial but has ${task.dependencies.length} dependencies. Consider if parallel execution would be more efficient.`,
          task.lineNumber
        );
      }
    }
    
    // Check for critical tasks without dependencies
    for (const [name, task] of tasks) {
      if (task.hasModifier('critical') && task.dependencies.length === 0) {
        this.addWarning(
          `Task '${name}' is marked as critical but has no dependencies. Critical modifier is most useful for tasks in a dependency chain.`,
          task.lineNumber
        );
      }
    }
  }
  
  validateGlobalDeclarations() {
    // Check for duplicate global variable and constant names
    const allGlobalNames = new Set();
    
    for (const name of this.globalVariables.keys()) {
      if (allGlobalNames.has(name)) {
        this.addError(`Global variable '${name}' conflicts with existing declaration`);
      }
      allGlobalNames.add(name);
      
      // Validate variable name format
      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
        this.addError(`Invalid global variable name '${name}'`);
      }
    }
    
    for (const name of this.globalConstants.keys()) {
      if (allGlobalNames.has(name)) {
        this.addError(`Global constant '${name}' conflicts with existing declaration`);
      }
      allGlobalNames.add(name);
      
      // Validate constant name format
      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
        this.addError(`Invalid global constant name '${name}'`);
      }
    }
  }
  
  validateTaskVariables(task) {
    // Validate local variables and constants
    const allLocalNames = new Set([...task.parameters]);
    
    // Check local variables
    for (const [name, value] of task.localVariables) {
      if (allLocalNames.has(name)) {
        this.addError(
          `Local variable '${name}' in task '${task.name}' conflicts with parameter or existing declaration`,
          task.lineNumber
        );
      }
      allLocalNames.add(name);
      
      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
        this.addError(
          `Invalid local variable name '${name}' in task '${task.name}'`,
          task.lineNumber
        );
      }
    }
    
    // Check local constants
    for (const [name, value] of task.localConstants) {
      if (allLocalNames.has(name)) {
        this.addError(
          `Local constant '${name}' in task '${task.name}' conflicts with parameter or existing declaration`,
          task.lineNumber
        );
      }
      allLocalNames.add(name);
      
      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
        this.addError(
          `Invalid local constant name '${name}' in task '${task.name}'`,
          task.lineNumber
        );
      }
    }
  }
  
  validateTaskCalls(task) {
    // Validate _call statements
    for (const call of task.calls) {
      // Note: We can't validate if the called task exists here because
      // we don't have access to the tasks map in this context.
      // This validation will be done in validateGraph.
      
      for (const param of call.params) {
        if (param.type === 'variable') {
          // Check if the variable exists in task scope
          if (!this.isVariableAvailable(param.name, task)) {
            this.addError(
              `Variable '$${param.name}' in _call to '${call.taskName}' in task '${task.name}' is not defined`,
              task.lineNumber
            );
          }
        }
      }
    }
  }
  
  isVariableAvailable(varName, task) {
    // Check if variable is available in task scope
    return task.parameters.includes(varName) ||
           task.localVariables.has(varName) ||
           task.localConstants.has(varName) ||
           this.globalVariables.has(varName) ||
           this.globalConstants.has(varName);
  }
  
  validateWatchedFiles(task) {
    // Validate watched file patterns
    for (const filePattern of task.watchedFiles) {
      // Check for empty or invalid patterns
      if (!filePattern || !filePattern.trim()) {
        this.addError(
          `Empty file pattern in 'watch' clause for task '${task.name}'`,
          task.lineNumber
        );
        continue;
      }
      
      // Warn about potentially problematic patterns
      if (filePattern.includes('..')) {
        this.addWarning(
          `File pattern '${filePattern}' in task '${task.name}' contains '..' which may be unsafe`,
          task.lineNumber
        );
      }
      
      // Check for absolute paths (might be intentional but worth noting)
      if (filePattern.startsWith('/') || filePattern.match(/^[A-Z]:\\/)) {
        this.addWarning(
          `File pattern '${filePattern}' in task '${task.name}' uses absolute path`,
          task.lineNumber
        );
      }
      
      // Validate basic pattern syntax for common mistakes
      if (filePattern.includes('***')) {
        this.addWarning(
          `File pattern '${filePattern}' in task '${task.name}' contains '***' which might not work as expected`,
          task.lineNumber
        );
      }
    }
    
    // Suggest using 'always' modifier if task has no watched files and no dependencies
    if (!task.hasWatchedFiles() && task.dependencies.length === 0 && !task.hasModifier('always')) {
      // Only suggest for certain task names that typically should always run
      const alwaysTaskNames = ['clean', 'format', 'lint', 'check'];
      if (alwaysTaskNames.includes(task.name.toLowerCase())) {
        this.addWarning(
          `Task '${task.name}' has no dependencies or watched files. Consider adding 'always' modifier if it should run unconditionally`,
          task.lineNumber
        );
      }
    }
  }
  
  validateTaskInputs(task) {
    // Check both legacy inputs and new internalFunctions for input functions
    const hasLegacyInputs = task.inputs && task.inputs.length > 0;
    const inputFunctions = (task.internalFunctions || []).filter(fn => 
      fn.name && fn.name.startsWith('input'));
    const hasInputFunctions = inputFunctions.length > 0;
    
    if (!hasLegacyInputs && !hasInputFunctions) {
      return;
    }
    
    // Check if task has serial modifier
    const hasSerial = task.hasModifier && task.hasModifier('serial');
    if (!hasSerial) {
      this.addError(
        `Task '${task.name}' uses input prompts (__input*) but is not marked as 'serial'. Input prompts require serial execution to prevent concurrent prompts.`,
        task.lineNumber
      );
    }
    
    // Validate each input (both legacy and new format)
    const usedVariables = new Set();
    
    // Validate legacy inputs
    if (hasLegacyInputs) {
      for (const input of task.inputs) {
      // Check for duplicate variable names
      if (usedVariables.has(input.variable)) {
        this.addError(
          `Duplicate input variable '${input.variable}' in task '${task.name}'`,
          task.lineNumber
        );
      }
      usedVariables.add(input.variable);
      
      // Validate variable name format
      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(input.variable)) {
        this.addError(
          `Invalid variable name '${input.variable}' in input prompt of task '${task.name}'`,
          task.lineNumber
        );
      }
      
      // For select inputs, validate options
      if (input.type === 'select') {
        if (!input.options || input.options.length === 0) {
          this.addError(
            `Select input for variable '${input.variable}' in task '${task.name}' has no options`,
            task.lineNumber
          );
        } else if (input.defaultValue && !input.options.includes(input.defaultValue)) {
          this.addError(
            `Default value '${input.defaultValue}' for select input '${input.variable}' is not in the options list`,
            task.lineNumber
          );
        }
      }
      
      // For confirm inputs, validate default value
      if (input.type === 'confirm' && input.defaultValue) {
        if (input.defaultValue !== 'yes' && input.defaultValue !== 'no') {
          this.addWarning(
            `Confirm input '${input.variable}' has default value '${input.defaultValue}'. Should be 'yes' or 'no'.`,
            task.lineNumber
          );
        }
      }
      }
    }
    
    // Validate internal functions (new format)
    if (hasInputFunctions) {
      for (const func of inputFunctions) {
        // Basic validation - could be expanded based on function type
        if (!func.params || func.params.length < 2) {
          this.addError(
            `Input function '__${func.name}' in task '${task.name}' requires at least a prompt and variable parameter`,
            task.lineNumber
          );
        }
      }
    }
  }

  addError(message, line = null, context = null) {
    this.errors.push({
      type: 'error',
      message,
      line,
      context
    });
  }
  
  addWarning(message, line = null, context = null) {
    this.warnings.push({
      type: 'warning',
      message,
      line,
      context
    });
  }
}

export class ValidationError extends Error {
  constructor(errors, warnings) {
    const errorCount = errors.length;
    const warningCount = warnings.length;
    
    let message = `Validation failed with ${errorCount} error(s)`;
    if (warningCount > 0) {
      message += ` and ${warningCount} warning(s)`;
    }
    
    super(message);
    this.name = 'ValidationError';
    this.errors = errors;
    this.warnings = warnings;
  }
}