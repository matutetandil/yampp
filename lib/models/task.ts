import { TaskConstructorOptions } from '../tasks/types/task-constructor-options.js';
import { Parameter } from '../core/types/parameter.js';

/**
 * Task model representing a single task with its configuration and runtime state
 */
export class Task {
  private readonly _name: string;
  private readonly _modifiers: Set<string>;
  private readonly _dependencies: string[];
  private readonly _commands: string[];
  private readonly _lineNumber: number | null;
  private readonly _parameters: Parameter[];
  private readonly _dependencyParams: Record<string, Parameter[]>;
  private readonly _watchedFiles: string[];
  private readonly _localVariables: Map<string, string>;
  private readonly _localConstants: Map<string, string>;
  private readonly _localEnvironmentVariables: Map<string, string>;
  private readonly _calls: unknown[];
  private readonly _inputs: unknown[];
  private readonly _internalFunctions: unknown[];
  
  private _status: string;
  private _error: string | null;
  private _variables: Map<string, string>;

  constructor(options: TaskConstructorOptions) {
    const {
      name,
      modifiers = [],
      dependencies = [],
      commands = [],
      lineNumber = null,
      parameters = [],
      dependencyParams = {},
      watchedFiles = [],
      localVariables = new Map(),
      localConstants = new Map(),
      localEnvironmentVariables = new Map(),
      calls = [],
      inputs = [],
      internalFunctions = []
    } = options;
    
    this._name = name;
    this._modifiers = new Set(modifiers);
    this._dependencies = dependencies;
    this._commands = commands;
    this._lineNumber = lineNumber;
    this._status = 'pending';
    this._error = null;
    this._parameters = parameters || []; // Array of parameter objects this task accepts
    this._dependencyParams = dependencyParams; // Map of dependency -> parameters to pass
    this._watchedFiles = watchedFiles; // Array of file patterns to watch for changes
    this._variables = new Map(); // Runtime variables for this task
    this._localVariables = localVariables; // Local variables declared in this task
    this._localConstants = localConstants; // Local constants declared in this task
    this._localEnvironmentVariables = localEnvironmentVariables; // Local environment variables declared in this task
    this._calls = calls; // Deprecated - now handled by __call in internalFunctions
    this._inputs = inputs; // User input prompts defined in this task
    this._internalFunctions = internalFunctions; // Generic internal function calls
  }

  // Getters for readonly properties
  public getName(): string {
    return this._name;
  }

  public getModifiers(): Set<string> {
    return this._modifiers;
  }

  public getDependencies(): string[] {
    return this._dependencies;
  }

  public getCommands(): string[] {
    return this._commands;
  }

  public getLineNumber(): number | null {
    return this._lineNumber;
  }

  public getDependencyParams(): Record<string, Parameter[]> {
    return this._dependencyParams;
  }

  public getWatchedFiles(): string[] {
    return this._watchedFiles;
  }

  public getLocalVariables(): Map<string, string> {
    return this._localVariables;
  }

  public getLocalConstants(): Map<string, string> {
    return this._localConstants;
  }

  public getLocalEnvironmentVariables(): Map<string, string> {
    return this._localEnvironmentVariables;
  }

  public getCalls(): unknown[] {
    return this._calls;
  }

  public getInputs(): unknown[] {
    return this._inputs;
  }

  public getInternalFunctions(): unknown[] {
    return this._internalFunctions;
  }

  // Getters and setters for mutable properties
  public getStatus(): string {
    return this._status;
  }

  public setStatus(status: string): void {
    this._status = status;
  }

  public getError(): string | null {
    return this._error;
  }

  public setError(error: string | null): void {
    this._error = error;
  }

  public getVariables(): Map<string, string> {
    return this._variables;
  }
  
  public hasModifier(modifier: string): boolean {
    return this._modifiers.has(modifier);
  }
  
  // Note: Removed hardcoded modifier getters (isAlways, isSerial, isCritical, isParallel)
  // to follow Open/Closed Principle and Interface Segregation Principle.
  // Use hasModifier() method instead for extensibility with custom modifiers.
  
  public setVariable(name: string, value: string): void {
    this._variables.set(name, value);
  }
  
  public getVariable(name: string): string | undefined {
    return this._variables.get(name);
  }

  public getParameters(): Parameter[] {
    return this._parameters;
  }
  
  public hasParameter(name: string): boolean {
    return this._parameters.some(p => p.name === name);
  }
  
  public hasWatchedFiles(): boolean {
    return this._watchedFiles && this._watchedFiles.length > 0;
  }
  
  public getSignature(): string {
    if (this._parameters.length === 0) {
      return this._name;
    }
    
    const validParams = this._parameters.filter(p => p && p.name);
    
    return `${this._name}(${validParams.map(p => p.name).join(', ')})`;
  }
  
  public getDependencyWithParams(depName: string): string {
    const params = this._dependencyParams[depName] || [];
    if (params.length === 0) {
      return depName;
    }
    return `${depName}(${params.map(p => p.name || p.value || p).join(', ')})`;
  }
  
  public substituteVariables(command: string): string {
    let result = command;
    
    // Replace $variable with actual values
    for (const [name, value] of this._variables) {
      const regex = new RegExp(`\\$${name}\\b`, 'g');
      result = result.replace(regex, value);
    }
    
    return result;
  }
  
  public toJSON(): {
    name: string;
    modifiers: string[];
    dependencies: string[];
    commands: string[];
    parameters: Parameter[];
    dependencyParams: Record<string, Parameter[]>;
    status: string;
  } {
    return {
      name: this._name,
      modifiers: Array.from(this._modifiers),
      dependencies: this._dependencies,
      commands: this._commands,
      parameters: this._parameters,
      dependencyParams: this._dependencyParams,
      status: this._status
    };
  }
}