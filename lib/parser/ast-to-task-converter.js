import { Task } from '../models/index.js';
import { TaskBuilder } from './task-builder.js';

/**
 * AST to Task Converter
 * Applies Visitor Pattern + Method Object Pattern
 * Separates AST conversion logic from parser business logic
 * Each conversion step is a focused method with single responsibility
 */
export class AstToTaskConverter {
  /**
   * Convert AST node to Task instance
   * @param {Object} taskAst - AST node representing a task
   * @returns {Task} - Converted Task instance
   */
  convert(taskAst) {
    const builder = new TaskBuilder(taskAst.name);
    
    // Apply each conversion step using builder pattern
    this.convertVariables(taskAst, builder);
    this.convertDependencies(taskAst, builder);
    this.convertInternalFunctions(taskAst, builder);
    this.convertInputs(taskAst, builder);
    this.convertMetadata(taskAst, builder);
    
    return builder.build();
  }

  /**
   * Convert local variables, constants, and environment variables
   * @param {Object} taskAst - AST node
   * @param {TaskBuilder} builder - Builder instance
   */
  convertVariables(taskAst, builder) {
    // Convert local variables to Map
    const localVariables = new Map();
    for (const variable of taskAst.localVariables || []) {
      localVariables.set(variable.name, variable.value);
    }
    builder.withLocalVariables(localVariables);
    
    // Convert local constants to Map
    const localConstants = new Map();
    for (const constant of taskAst.localConstants || []) {
      localConstants.set(constant.name, constant.value);
    }
    builder.withLocalConstants(localConstants);
    
    // Convert local environment variables to Map
    const localEnvironmentVariables = new Map();
    for (const envVar of taskAst.localEnvironmentVariables || []) {
      localEnvironmentVariables.set(envVar.name, process.env[envVar.name] || '');
    }
    builder.withLocalEnvironmentVariables(localEnvironmentVariables);
  }

  /**
   * Convert dependencies and their parameters
   * @param {Object} taskAst - AST node
   * @param {TaskBuilder} builder - Builder instance
   */
  convertDependencies(taskAst, builder) {
    builder.withDependencies(taskAst.dependencies || []);
    
    // Process dependency parameters to match expected format
    const dependencyParams = {};
    for (const [depName, params] of Object.entries(taskAst.dependencyParams || {})) {
      dependencyParams[depName] = params.map(param => this.convertParameter(param));
    }
    builder.withDependencyParams(dependencyParams);
  }

  /**
   * Convert parameter to standard format
   * @param {*} param - Parameter value
   * @returns {Object} - Standardized parameter object
   */
  convertParameter(param) {
    if (typeof param === 'object' && param.type) {
      return param; // Already in correct format
    }
    
    // Legacy format conversion
    if (typeof param === 'string' && param.startsWith('$')) {
      return { type: 'variable', name: param.substring(1) };
    }
    
    return { type: 'literal', value: param };
  }

  /**
   * Convert internal function calls
   * @param {Object} taskAst - AST node
   * @param {TaskBuilder} builder - Builder instance
   */
  convertInternalFunctions(taskAst, builder) {
    // Process calls to match expected format
    const calls = (taskAst.calls || []).map(call => ({
      taskName: call.taskName,
      params: call.parameters || []
    }));
    builder.withCalls(calls);
    
    // Set internal functions
    builder.withInternalFunctions(taskAst.internalFunctions || []);
  }

  /**
   * Convert input configurations
   * @param {Object} taskAst - AST node
   * @param {TaskBuilder} builder - Builder instance
   */
  convertInputs(taskAst, builder) {
    // Extract inputs with proper formatting
    const inputs = (taskAst.inputs || []).map(input => ({
      type: input.inputType,
      prompt: input.prompt,
      variable: input.variable,
      defaultValue: input.defaultValue,
      options: input.options || []
    }));
    builder.withInputs(inputs);
  }

  /**
   * Convert metadata and other properties
   * @param {Object} taskAst - AST node
   * @param {TaskBuilder} builder - Builder instance
   */
  convertMetadata(taskAst, builder) {
    builder
      .withModifiers(taskAst.modifiers || [])
      .withCommands(taskAst.commands || [])
      .withParameters(taskAst.parameters || [])
      .withWatchedFiles(taskAst.watchedFiles || [])
      .withLineNumber(taskAst.location?.start?.line || null);
  }
}

