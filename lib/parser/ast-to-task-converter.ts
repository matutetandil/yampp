import { Task } from '../models/index.js';
import { TaskBuilder } from './task-builder.js';
import type { TaskAstNode } from '../ast/nodes/task-ast-node.js';

/**
 * AST to Task Converter
 * Applies Visitor Pattern + Method Object Pattern
 * Separates AST conversion logic from parser business logic
 * Each conversion step is a focused method with single responsibility
 */
export class AstToTaskConverter {
  /**
   * Convert AST node to Task instance
   * @param taskAst - AST node representing a task
   * @returns Converted Task instance
   */
  public convert(taskAst: TaskAstNode): Task {
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
   * @param taskAst - AST node
   * @param builder - Builder instance
   */
  private convertVariables(taskAst: TaskAstNode, builder: TaskBuilder): void {
    // Convert local variables to Map
    const localVariables = new Map<string, any>();
    for (const variable of taskAst.localVariables || []) {
      localVariables.set(variable.name, variable.value);
    }
    builder.withLocalVariables(localVariables);
    
    // Convert local constants to Map
    const localConstants = new Map<string, any>();
    for (const constant of taskAst.localConstants || []) {
      localConstants.set(constant.name, constant.value);
    }
    builder.withLocalConstants(localConstants);
    
    // Convert local environment variables to Map
    const localEnvironmentVariables = new Map<string, any>();
    for (const envVar of taskAst.localEnvironmentVariables || []) {
      localEnvironmentVariables.set(envVar.name, process.env[envVar.name] || '');
    }
    builder.withLocalEnvironmentVariables(localEnvironmentVariables);
  }

  /**
   * Convert dependencies and their parameters
   * @param taskAst - AST node
   * @param builder - Builder instance
   */
  private convertDependencies(taskAst: TaskAstNode, builder: TaskBuilder): void {
    builder.withDependencies(taskAst.dependencies || []);
    
    // Process dependency parameters to match expected format
    const dependencyParams: Record<string, any[]> = {};
    for (const [depName, params] of Object.entries(taskAst.dependencyParams || {})) {
      dependencyParams[depName] = params.map(param => this.convertParameter(param));
    }
    builder.withDependencyParams(dependencyParams);
  }

  /**
   * Convert parameter to standard format
   * @param param - Parameter value
   * @returns Standardized parameter object
   */
  private convertParameter(param: any): any {
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
   * @param taskAst - AST node
   * @param builder - Builder instance
   */
  private convertInternalFunctions(taskAst: TaskAstNode, builder: TaskBuilder): void {
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
   * @param taskAst - AST node
   * @param builder - Builder instance
   */
  private convertInputs(taskAst: TaskAstNode, builder: TaskBuilder): void {
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
   * @param taskAst - AST node
   * @param builder - Builder instance
   */
  private convertMetadata(taskAst: TaskAstNode, builder: TaskBuilder): void {
    // Combine regular commands with internal functions for unified processing
    const allCommands = [
      ...(taskAst.commands || []),
      // Convert internal function AST nodes back to command strings
      ...((taskAst.internalFunctions || []).map(func => {
        const params = (func.params || []).map(p => {
          if (p.type === 'string') {
            // Preserve quoted strings
            return `"${p.value}"`;
          } else if (p.type === 'variable') {
            return `$${p.name}`;
          } else if (p.type === 'array') {
            return `[${p.value.join(',')}]`;
          } else if (p.type === 'params') {
            // Handle parameter lists - convert back to parentheses format
            const paramList = p.value.map((param: any) => {
              if (param.type === 'literal') {
                return `"${param.value}"`;
              } else if (param.type === 'variable') {
                return `$${param.name}`;
              } else {
                return param.value || param;
              }
            }).join(', ');
            return `(${paramList})`;
          } else {
            // Identifier or other types
            return p.value || p;
          }
        }).join(' ');
        return `__${func.name} ${params}`.trim();
      }))
    ];
    
    builder
      .withModifiers(taskAst.modifiers || [])
      .withCommands(allCommands)
      .withParameters(taskAst.parameters || [])
      .withWatchedFiles(taskAst.watchedFiles || [])
      .withLineNumber(taskAst.location?.start?.line || null);
  }
}