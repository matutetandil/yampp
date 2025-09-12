import { TaskGraph } from './models/index.js';
import { Task } from './models/task.js';
import { ValidationError } from './validation/types/validation-error.interface.js';
import { ValidationWarning } from './validation/types/validation-warning.interface.js';
import { ValidationResult } from './validation/types/validation-result.interface.js';

export class Validator {
  private readonly validModifiers: Set<string>;
  private errors: ValidationError[];
  private warnings: ValidationWarning[];
  private globalVariables: Map<string, any>;
  private globalConstants: Map<string, any>;

  constructor() {
    this.validModifiers = new Set(['always', 'serial', 'critical']);
    this.errors = [];
    this.warnings = [];
    this.globalVariables = new Map();
    this.globalConstants = new Map();
  }
  
  public validate(tasks: Map<string, Task>, globalVariables: Map<string, any> = new Map(), globalConstants: Map<string, any> = new Map()): ValidationResult {
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
    
    // Validate task graph (dependencies)
    try {
      new TaskGraph(tasks);
    } catch (error) {
      this.addError((error as Error).message, null, null);
    }
    
    return {
      valid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings
    };
  }

  /**
   * Context-aware quote validation that considers quotes inside other quotes
   * For example: "What's your name?" should be valid (single quote inside double quotes)
   */
  private validateQuoteBalance(command: string): { singleQuotesBalanced: boolean, doubleQuotesBalanced: boolean } {
    let inSingleQuote = false;
    let inDoubleQuote = false;
    let unbalancedSingle = 0;
    let unbalancedDouble = 0;
    
    for (let i = 0; i < command.length; i++) {
      const char = command[i];
      const prevChar = i > 0 ? command[i - 1] : null;
      
      // Handle escaped quotes
      if (prevChar === '\\') {
        continue; // Skip escaped quotes
      }
      
      if (char === '"' && !inSingleQuote) {
        // Double quote outside single quotes
        if (inDoubleQuote) {
          inDoubleQuote = false;
          unbalancedDouble--;
        } else {
          inDoubleQuote = true;
          unbalancedDouble++;
        }
      } else if (char === "'" && !inDoubleQuote) {
        // Single quote outside double quotes
        if (inSingleQuote) {
          inSingleQuote = false;
          unbalancedSingle--;
        } else {
          inSingleQuote = true;
          unbalancedSingle++;
        }
      }
      // If we're inside quotes of one type, ignore the other type
      // This handles cases like "What's your name?" correctly
    }
    
    return {
      singleQuotesBalanced: unbalancedSingle === 0,
      doubleQuotesBalanced: unbalancedDouble === 0
    };
  }
  
  private validateGlobalDeclarations(): void {
    // Check for conflicts between variables and constants
    for (const [name] of this.globalVariables) {
      if (this.globalConstants.has(name)) {
        this.addError(
          `Variable '${name}' conflicts with constant of the same name`,
          null,
          'global declarations'
        );
      }
    }
    
    // Check for reserved names
    const reservedNames = ['PATH', 'HOME', 'USER', 'PWD'];
    for (const reserved of reservedNames) {
      if (this.globalVariables.has(reserved) || this.globalConstants.has(reserved)) {
        this.addWarning(
          `'${reserved}' is a system variable and may cause conflicts`,
          null,
          'global declarations'
        );
      }
    }
  }
  
  private validateTask(task: Task): void {
    this.validateTaskName(task);
    this.validateTaskModifiers(task);
    this.validateTaskDependencies(task);
    this.validateTaskCommands(task);
    this.validateTaskParameters(task);
    this.validateTaskVariableUsage(task);
    this.validateTaskWatches(task);
  }
  
  private validateTaskName(task: Task): void {
    const name = task.getName();
    
    // Task name validation
    if (!name || typeof name !== 'string') {
      this.addError('Task name cannot be empty', null, name);
      return;
    }
    
    // Check for valid identifier format
    const validNameRegex = /^[a-zA-Z_][a-zA-Z0-9_\-]*$/;
    if (!validNameRegex.test(name)) {
      this.addError(
        `Task name '${name}' is not a valid identifier. Must start with letter or underscore, contain only alphanumeric characters, underscores, or hyphens`,
        null,
        name
      );
    }
    
    // Check for reserved names
    const reservedNames = ['all', 'clean', 'help', 'list', 'version'];
    if (reservedNames.includes(name.toLowerCase())) {
      this.addError(
        `Task name '${name}' is reserved and cannot be used`,
        task.getLineNumber(),
        name
      );
    }
    
    // Warn about potentially confusing names
    const confusingNames = ['test', 'build', 'run', 'start', 'stop', 'install', 'deploy'];
    if (confusingNames.includes(name.toLowerCase()) && name !== name.toLowerCase()) {
      this.addWarning(
        `Task name '${name}' might be confusing. Consider using consistent casing`,
        task.getLineNumber(),
        name
      );
    }
  }
  
  private validateTaskModifiers(task: Task): void {
    const modifiers = task.getModifiers();
    
    for (const modifier of modifiers) {
      if (!this.validModifiers.has(modifier)) {
        this.addError(
          `Unknown modifier '${modifier}' in task '${task.getName()}'. Valid modifiers are: ${Array.from(this.validModifiers).join(', ')}`,
          task.getLineNumber(),
          task.getName()
        );
      }
    }
    
    // Check for conflicting modifiers
    if (modifiers.has('serial') && modifiers.has('critical')) {
      this.addWarning(
        `Task '${task.getName()}' has both 'serial' and 'critical' modifiers. 'critical' implies serial execution`,
        task.getLineNumber(),
        task.getName()
      );
    }
  }
  
  private validateTaskDependencies(task: Task): void {
    const dependencies = task.getDependencies();
    const taskName = task.getName();
    
    // Check for self-dependency
    if (dependencies.includes(taskName)) {
      this.addError(
        `Task '${taskName}' cannot depend on itself`,
        task.getLineNumber(),
        taskName
      );
    }
    
    // Check for duplicate dependencies
    const uniqueDeps = new Set(dependencies);
    if (uniqueDeps.size !== dependencies.length) {
      this.addWarning(
        `Task '${taskName}' has duplicate dependencies`,
        task.getLineNumber(),
        taskName
      );
    }
    
    // Dependencies validation is done later at graph level for circular deps
  }
  
  private validateTaskCommands(task: Task): void {
    const commands = task.getCommands();
    const taskName: string = task.getName() || 'unknown';
    
    if (!commands || commands.length === 0) {
      this.addWarning(
        `Task '${taskName}' has no commands defined`,
        task.getLineNumber(),
        taskName
      );
      return;
    }
    
    commands.forEach((command, i) => {
      if (command != null) {
        const lineNum = task.getLineNumber() || null;
        this.validateCommand(command, taskName, lineNum, i + 1);
      }
    });
  }
  
  private validateCommand(command: string, taskName: string, taskLine: number | null, commandIndex: number): void {
    if (!command || command.trim().length === 0) {
      this.addWarning(
        `Empty command at position ${commandIndex} in task '${taskName}'`,
        taskLine,
        taskName
      );
      return;
    }
    
    // Check for potentially dangerous commands
    const dangerousCommands = ['rm -rf /', 'dd if=', 'mkfs', 'fdisk'];
    const lowerCommand = command.toLowerCase();
    
    for (const dangerous of dangerousCommands) {
      if (lowerCommand.includes(dangerous)) {
        this.addWarning(
          `Potentially dangerous command detected in task '${taskName}': ${dangerous}`,
          taskLine,
          taskName
        );
        break;
      }
    }
    
    // Check for common syntax errors
    this.validateCommandSyntax(command, taskName, taskLine, commandIndex);
  }
  
  private validateCommandSyntax(command: string, taskName: string, taskLine: number | null, commandIndex: number): void {
    // Check for unmatched quotes using context-aware parsing
    const quoteValidation = this.validateQuoteBalance(command);
    
    if (!quoteValidation.singleQuotesBalanced) {
      this.addError(
        `Unmatched single quote in command ${commandIndex} of task '${taskName}'`,
        taskLine,
        taskName
      );
    }
    
    if (!quoteValidation.doubleQuotesBalanced) {
      this.addError(
        `Unmatched double quote in command ${commandIndex} of task '${taskName}'`,
        taskLine,
        taskName
      );
    }
    
    // Check for common shell syntax issues
    if (command.includes('&&') && command.includes('||')) {
      this.addWarning(
        `Mixed && and || operators in command ${commandIndex} of task '${taskName}' may have unexpected precedence`,
        taskLine,
        taskName
      );
    }
    
    // Check for trailing backslashes (line continuation issues)
    if (command.endsWith('\\')) {
      this.addWarning(
        `Command ${commandIndex} in task '${taskName}' ends with backslash - line continuation may not work as expected`,
        taskLine,
        taskName
      );
    }
  }
  
  private validateTaskParameters(task: Task): void {
    const parameters = task.getParameters();
    const taskName = task.getName();
    
    // TEMP DEBUG: Check parameters structure
    
    if (!parameters || parameters.length === 0) {
      return; // No parameters to validate
    }
    
    const paramNames = new Set<string>();
    
    for (const param of parameters) {
      // Check for duplicate parameter names
      if (paramNames.has(param.name)) {
        this.addError(
          `Duplicate parameter '${param.name}' in task '${taskName}'`,
          task.getLineNumber(),
          taskName
        );
        continue;
      }
      
      paramNames.add(param.name);
      
      // Validate parameter name format
      const validParamRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
      if (!validParamRegex.test(param.name)) {
        this.addError(
          `Invalid parameter name '${param.name}' in task '${taskName}'. Must be a valid identifier`,
          task.getLineNumber(),
          taskName
        );
      }
      
      // Check for conflicts with reserved names
      const reservedParams = ['task', 'name', 'args', 'env'];
      if (reservedParams.includes(param.name.toLowerCase())) {
        this.addWarning(
          `Parameter '${param.name}' in task '${taskName}' uses a reserved name`,
          task.getLineNumber(),
          taskName
        );
      }
    }
  }
  
  private validateTaskVariableUsage(task: Task): void {
    const commands = task.getCommands();
    const taskName = task.getName();
    const parameters = task.getParameters();
    const paramNames = new Set(parameters.map(p => p.name));
    
    // Extract all variable references from commands
    const variableRegex = /\$([a-zA-Z_][a-zA-Z0-9_]*)/g;
    const referencedVars = new Set<string>();
    
    for (const command of commands) {
      let match;
      while ((match = variableRegex.exec(command)) !== null) {
        const varName = match[1];
        if (varName) {
          referencedVars.add(varName);
        }
      }
    }
    
    // Check if referenced variables are defined
    for (const varName of referencedVars) {
      const isDefined = (
        paramNames.has(varName) ||
        this.globalVariables.has(varName) ||
        this.globalConstants.has(varName) ||
        this.isSystemVariable(varName)
      );
      
      if (!isDefined) {
        this.addWarning(
          `Variable '$${varName}' used in task '${taskName}' is not defined`,
          task.getLineNumber(),
          taskName
        );
      }
    }
    
    // Check for unused parameters
    for (const param of parameters) {
      if (!referencedVars.has(param.name)) {
        this.addWarning(
          `Parameter '${param.name}' in task '${taskName}' is defined but never used`,
          task.getLineNumber(),
          taskName
        );
      }
    }
  }
  
  private validateTaskWatches(task: Task): void {
    const watches = task.getWatchedFiles();
    const taskName = task.getName();
    
    if (!watches || watches.length === 0) {
      return; // No watches to validate
    }
    
    for (const watch of watches) {
      this.validateWatchPattern(watch, taskName, task.getLineNumber());
    }
  }
  
  private validateWatchPattern(pattern: string, taskName: string, taskLine: number | null): void {
    if (!pattern || pattern.trim().length === 0) {
      this.addError(
        `Empty watch pattern in task '${taskName}'`,
        taskLine,
        taskName
      );
      return;
    }
    
    // Basic glob pattern validation
    try {
      // Check for invalid glob patterns
      if (pattern.includes('***')) {
        this.addWarning(
          `Watch pattern '${pattern}' in task '${taskName}' contains '***' which may not work as expected`,
          taskLine,
          taskName
        );
      }
      
      // Check for absolute vs relative paths
      if (pattern.startsWith('/') || pattern.match(/^[A-Z]:\\/)) {
        this.addWarning(
          `Watch pattern '${pattern}' in task '${taskName}' uses absolute path - consider using relative paths`,
          taskLine,
          taskName
        );
      }
      
      // Warn about overly broad patterns
      if (pattern === '*' || pattern === '**' || pattern === '**/*') {
        this.addWarning(
          `Watch pattern '${pattern}' in task '${taskName}' is very broad and may impact performance`,
          taskLine,
          taskName
        );
      }
      
    } catch (error) {
      this.addError(
        `Invalid watch pattern '${pattern}' in task '${taskName}': ${(error as Error).message}`,
        taskLine,
        taskName
      );
    }
  }
  
  private isSystemVariable(varName: string): boolean {
    const systemVars = [
      'PATH', 'HOME', 'USER', 'USERNAME', 'PWD', 'OLDPWD', 'SHELL',
      'TERM', 'LANG', 'LC_ALL', 'TZ', 'TMPDIR', 'TEMP', 'TMP',
      'NODE_ENV', 'DEBUG', 'PORT'
    ];
    
    return systemVars.includes(varName) || varName.startsWith('npm_') || varName.startsWith('NODE_');
  }
  
  private addError(message: string, line: number | null, context: string | null): void {
    this.errors.push({
      type: 'error',
      message,
      line,
      context
    });
  }
  
  private addWarning(message: string, line: number | null, context: string | null): void {
    this.warnings.push({
      type: 'warning',
      message,
      line,
      context
    });
  }
  
  /**
   * Get validation statistics
   */
  public getValidationStats(): { errorCount: number; warningCount: number } {
    return {
      errorCount: this.errors.length,
      warningCount: this.warnings.length
    };
  }
  
  /**
   * Clear all errors and warnings
   */
  public reset(): void {
    this.errors = [];
    this.warnings = [];
    this.globalVariables.clear();
    this.globalConstants.clear();
  }
}