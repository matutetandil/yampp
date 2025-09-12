import type { Parameter } from '../../core/types/parameter.js';
import type { IAstTaskAdapter } from '../interfaces/ast-task-adapter.interface.js';

/**
 * AST Task Adapter
 * Encapsulates access to AST task properties following SOLID principles
 * 
 * Single Responsibility: Only handles AST data access
 * Open/Closed: Can be extended without modifying existing code
 * Interface Segregation: Clean interface for AST access
 * Dependency Inversion: Depends on abstractions, not concrete AST structure
 */
export class AstTaskAdapter implements IAstTaskAdapter {
  constructor(private readonly astTask: any) {}

  /**
   * Get task name
   */
  public getName(): string {
    return this.astTask.name || '';
  }

  /**
   * Get task dependencies
   */
  public getDependencies(): string[] {
    return this.astTask.dependencies || [];
  }

  /**
   * Get dependency parameters
   */
  public getDependencyParams(): Record<string, any> {
    return this.astTask.dependencyParams || {};
  }

  /**
   * Get task modifiers
   */
  public getModifiers(): string[] {
    return this.astTask.modifiers || [];
  }

  /**
   * Get task commands
   */
  public getCommands(): string[] {
    const commands = this.astTask.commands || [];
    return commands.map((cmd: any) => typeof cmd === 'string' ? cmd : cmd.text);
  }

  /**
   * Get task parameters with proper type safety
   */
  public getParameters(): Parameter[] {
    return this.astTask.parameters || [];
  }

  /**
   * Get watched files with fallback support for legacy AST structures
   */
  public getWatchedFiles(): string[] {
    // Support both new (watchedFiles) and legacy (watches) property names
    return this.astTask.watchedFiles || this.astTask.watches || [];
  }

  /**
   * Get internal functions
   */
  public getInternalFunctions(): any[] {
    return this.astTask.internalFunctions || [];
  }

  /**
   * Get task calls
   */
  public getCalls(): any[] {
    return this.astTask.calls || [];
  }

  /**
   * Get inputs
   */
  public getInputs(): any[] {
    return this.astTask.inputs || [];
  }

  /**
   * Get local variables
   */
  public getLocalVariables(): any[] {
    return this.astTask.localVariables || [];
  }

  /**
   * Get local constants
   */
  public getLocalConstants(): any[] {
    return this.astTask.localConstants || [];
  }

  /**
   * Get local environment variables
   */
  public getLocalEnvironmentVariables(): any[] {
    return this.astTask.localEnvironmentVariables || [];
  }

  /**
   * Get task location information
   */
  public getLocation(): any {
    return this.astTask.location;
  }

  /**
   * Check if task has specific property (for extensibility)
   */
  public hasProperty(propertyName: string): boolean {
    return this.astTask.hasOwnProperty(propertyName);
  }

  /**
   * Get raw property value (escape hatch for future extensibility)
   * Should be used sparingly and only when type-safe getters don't exist
   */
  public getRawProperty(propertyName: string): any {
    return this.astTask[propertyName];
  }
}