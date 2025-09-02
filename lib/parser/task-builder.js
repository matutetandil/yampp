import { Task } from '../models/index.js';

/**
 * Task Builder
 * Applies Builder Pattern for constructing Task instances
 * Provides fluent interface for task construction
 */
export class TaskBuilder {
  constructor(name) {
    this.taskData = { 
      name,
      localVariables: new Map(),
      localConstants: new Map(),
      localEnvironmentVariables: new Map()
    };
  }

  /**
   * Set task modifiers
   * @param {Array} modifiers - Task modifiers
   * @returns {TaskBuilder} - Builder instance
   */
  withModifiers(modifiers) {
    this.taskData.modifiers = modifiers;
    return this;
  }

  /**
   * Set task dependencies
   * @param {Array} dependencies - Task dependencies
   * @returns {TaskBuilder} - Builder instance
   */
  withDependencies(dependencies) {
    this.taskData.dependencies = dependencies;
    return this;
  }

  /**
   * Set dependency parameters
   * @param {Object} dependencyParams - Dependency parameters
   * @returns {TaskBuilder} - Builder instance
   */
  withDependencyParams(dependencyParams) {
    this.taskData.dependencyParams = dependencyParams;
    return this;
  }

  /**
   * Set task commands
   * @param {Array} commands - Task commands
   * @returns {TaskBuilder} - Builder instance
   */
  withCommands(commands) {
    this.taskData.commands = commands;
    return this;
  }

  /**
   * Set task parameters
   * @param {Array} parameters - Task parameters
   * @returns {TaskBuilder} - Builder instance
   */
  withParameters(parameters) {
    this.taskData.parameters = parameters;
    return this;
  }

  /**
   * Set watched files
   * @param {Array} watchedFiles - Files to watch
   * @returns {TaskBuilder} - Builder instance
   */
  withWatchedFiles(watchedFiles) {
    this.taskData.watchedFiles = watchedFiles;
    return this;
  }

  /**
   * Set local variables
   * @param {Map} localVariables - Local variables map
   * @returns {TaskBuilder} - Builder instance
   */
  withLocalVariables(localVariables) {
    this.taskData.localVariables = localVariables;
    return this;
  }

  /**
   * Set local constants
   * @param {Map} localConstants - Local constants map
   * @returns {TaskBuilder} - Builder instance
   */
  withLocalConstants(localConstants) {
    this.taskData.localConstants = localConstants;
    return this;
  }

  /**
   * Set local environment variables
   * @param {Map} localEnvironmentVariables - Local environment variables map
   * @returns {TaskBuilder} - Builder instance
   */
  withLocalEnvironmentVariables(localEnvironmentVariables) {
    this.taskData.localEnvironmentVariables = localEnvironmentVariables;
    return this;
  }

  /**
   * Set function calls
   * @param {Array} calls - Function calls
   * @returns {TaskBuilder} - Builder instance
   */
  withCalls(calls) {
    this.taskData.calls = calls;
    return this;
  }

  /**
   * Set inputs
   * @param {Array} inputs - Input configurations
   * @returns {TaskBuilder} - Builder instance
   */
  withInputs(inputs) {
    this.taskData.inputs = inputs;
    return this;
  }

  /**
   * Set internal functions
   * @param {Array} internalFunctions - Internal functions
   * @returns {TaskBuilder} - Builder instance
   */
  withInternalFunctions(internalFunctions) {
    this.taskData.internalFunctions = internalFunctions;
    return this;
  }

  /**
   * Set line number
   * @param {number} lineNumber - Line number in source
   * @returns {TaskBuilder} - Builder instance
   */
  withLineNumber(lineNumber) {
    this.taskData.lineNumber = lineNumber;
    return this;
  }

  /**
   * Build the Task instance
   * @returns {Task} - Built Task instance
   */
  build() {
    return new Task(this.taskData);
  }

  /**
   * Build a test task with minimal configuration
   * @returns {Task} - Test Task instance
   */
  buildForTesting() {
    // Set defaults suitable for testing
    this.taskData.modifiers = this.taskData.modifiers || [];
    this.taskData.dependencies = this.taskData.dependencies || [];
    this.taskData.commands = this.taskData.commands || [];
    this.taskData.parameters = this.taskData.parameters || [];
    
    return this.build();
  }

  /**
   * Build a simple task with just name and commands
   * @param {Array} commands - Commands to execute
   * @returns {Task} - Simple Task instance
   */
  buildSimple(commands) {
    return this.withCommands(commands).build();
  }
}