/**
 * Task model representing a single task with its configuration and runtime state
 */
export class Task {
  constructor({ name, modifiers = [], dependencies = [], commands = [], lineNumber = null, parameters = [], dependencyParams = {}, watchedFiles = [], localVariables = new Map(), localConstants = new Map(), localEnvironmentVariables = new Map(), calls = [], inputs = [], internalFunctions = [] }) {
    this.name = name;
    this.modifiers = new Set(modifiers);
    this.dependencies = dependencies;
    this.commands = commands;
    this.lineNumber = lineNumber;
    this.status = 'pending';
    this.error = null;
    this.parameters = parameters; // Array of parameter names this task accepts
    this.dependencyParams = dependencyParams; // Map of dependency -> parameters to pass
    this.watchedFiles = watchedFiles; // Array of file patterns to watch for changes
    this.variables = new Map(); // Runtime variables for this task
    this.localVariables = localVariables; // Local variables declared in this task
    this.localConstants = localConstants; // Local constants declared in this task
    this.localEnvironmentVariables = localEnvironmentVariables; // Local environment variables declared in this task
    this.calls = calls; // Deprecated - now handled by __call in internalFunctions
    this.inputs = inputs; // User input prompts defined in this task
    this.internalFunctions = internalFunctions; // Generic internal function calls
  }
  
  hasModifier(modifier) {
    return this.modifiers.has(modifier);
  }
  
  get isAlways() {
    return this.hasModifier('always');
  }
  
  get isSerial() {
    return this.hasModifier('serial');
  }
  
  get isCritical() {
    return this.hasModifier('critical');
  }
  
  get isParallel() {
    return !this.isSerial;
  }
  
  setVariable(name, value) {
    this.variables.set(name, value);
  }
  
  getVariable(name) {
    return this.variables.get(name);
  }
  
  hasParameter(name) {
    return this.parameters.includes(name);
  }
  
  hasWatchedFiles() {
    return this.watchedFiles && this.watchedFiles.length > 0;
  }
  
  getSignature() {
    if (this.parameters.length === 0) {
      return this.name;
    }
    return `${this.name}(${this.parameters.join(', ')})`;
  }
  
  getDependencyWithParams(depName) {
    const params = this.dependencyParams[depName] || [];
    if (params.length === 0) {
      return depName;
    }
    return `${depName}(${params.join(', ')})`;
  }
  
  substituteVariables(command) {
    let result = command;
    
    // Replace $variable with actual values
    for (const [name, value] of this.variables) {
      const regex = new RegExp(`\\$${name}\\b`, 'g');
      result = result.replace(regex, value);
    }
    
    return result;
  }
  
  toJSON() {
    return {
      name: this.name,
      modifiers: Array.from(this.modifiers),
      dependencies: this.dependencies,
      commands: this.commands,
      parameters: this.parameters,
      dependencyParams: this.dependencyParams,
      status: this.status
    };
  }
}