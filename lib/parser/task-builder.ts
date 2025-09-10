import { Task } from '../models/task.js';
import type { TaskConstructorOptions } from '../tasks/types/task-constructor-options.js';
import type { Parameter } from '../core/types/parameter.js';

/**
 * Task Builder
 * Applies Builder Pattern for constructing Task instances
 * Provides fluent interface for task construction
 */
export class TaskBuilder {
  private readonly taskData: Partial<TaskConstructorOptions>;

  constructor(name: string) {
    this.taskData = { 
      name,
      localVariables: new Map(),
      localConstants: new Map(),
      localEnvironmentVariables: new Map()
    };
  }

  /**
   * Set task modifiers
   */
  public withModifiers(modifiers: string[]): TaskBuilder {
    this.taskData.modifiers = modifiers;
    return this;
  }

  /**
   * Set task dependencies
   */
  public withDependencies(dependencies: string[]): TaskBuilder {
    this.taskData.dependencies = dependencies;
    return this;
  }

  /**
   * Set dependency parameters
   */
  public withDependencyParams(dependencyParams: Record<string, any[]>): TaskBuilder {
    this.taskData.dependencyParams = dependencyParams;
    return this;
  }

  /**
   * Set task commands
   */
  public withCommands(commands: string[]): TaskBuilder {
    this.taskData.commands = commands;
    return this;
  }

  /**
   * Set task parameters
   */
  public withParameters(parameters: Parameter[]): TaskBuilder {
    this.taskData.parameters = parameters;
    return this;
  }

  /**
   * Set watched files
   */
  public withWatchedFiles(watchedFiles: string[]): TaskBuilder {
    this.taskData.watchedFiles = watchedFiles;
    return this;
  }

  /**
   * Set local variables
   */
  public withLocalVariables(localVariables: Map<string, any>): TaskBuilder {
    this.taskData.localVariables = localVariables;
    return this;
  }

  /**
   * Set local constants
   */
  public withLocalConstants(localConstants: Map<string, any>): TaskBuilder {
    this.taskData.localConstants = localConstants;
    return this;
  }

  /**
   * Set local environment variables
   */
  public withLocalEnvironmentVariables(localEnvironmentVariables: Map<string, any>): TaskBuilder {
    this.taskData.localEnvironmentVariables = localEnvironmentVariables;
    return this;
  }

  /**
   * Set function calls
   */
  public withCalls(calls: any[]): TaskBuilder {
    this.taskData.calls = calls;
    return this;
  }

  /**
   * Set inputs
   */
  public withInputs(inputs: any[]): TaskBuilder {
    this.taskData.inputs = inputs;
    return this;
  }

  /**
   * Set internal functions
   */
  public withInternalFunctions(internalFunctions: any[]): TaskBuilder {
    this.taskData.internalFunctions = internalFunctions;
    return this;
  }

  /**
   * Set line number
   */
  public withLineNumber(lineNumber: number | null): TaskBuilder {
    this.taskData.lineNumber = lineNumber;
    return this;
  }

  /**
   * Build the Task instance
   */
  public build(): Task {
    return new Task(this.taskData as TaskConstructorOptions);
  }

  /**
   * Build a test task with minimal configuration
   */
  public buildForTesting(): Task {
    // Set defaults suitable for testing
    this.taskData.modifiers = this.taskData.modifiers || [];
    this.taskData.dependencies = this.taskData.dependencies || [];
    this.taskData.commands = this.taskData.commands || [];
    this.taskData.parameters = this.taskData.parameters || [];
    
    return this.build();
  }

  /**
   * Build a simple task with just name and commands
   */
  public buildSimple(commands: string[]): Task {
    return this.withCommands(commands).build();
  }
}