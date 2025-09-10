import { Runner } from './runner.js';
import { EnhancedDependencyContainer } from './dependency-container.js';
import { ITaskMap } from './tasks/interfaces/task-map.interface.js';
import { IVariableMap } from './core/types/variable-map.interface.js';
import { IConstantMap } from './core/types/constant-map.interface.js';
import { IEnvironmentVariableMap } from './core/types/environment-variable-map.interface.js';
import { IRunnerOptions } from './configuration/types/runner-options.interface.js';

/**
 * Runner Factory following SOLID principles
 * Creates Runner instances with proper dependency injection using enhanced container
 * Maintains backward compatibility while providing better type safety
 */
export class RunnerFactory {
  private readonly _container: EnhancedDependencyContainer;

  constructor(dependencyContainer: EnhancedDependencyContainer = new EnhancedDependencyContainer()) {
    this._container = dependencyContainer;
  }

  /**
   * Create Runner with dependencies injected
   * Now uses proper interfaces for type safety
   */
  public createRunner(
    tasks: ITaskMap, 
    globalVariables: IVariableMap = new Map() as IVariableMap, 
    globalConstants: IConstantMap = new Map() as IConstantMap, 
    globalEnvironmentVariables: IEnvironmentVariableMap = new Map() as IEnvironmentVariableMap, 
    options: IRunnerOptions = {}
  ): Runner {
    const dependencies = this._container.createRunnerDependencies(
      tasks,
      globalVariables, 
      globalConstants,
      globalEnvironmentVariables,
      options
    );
    
    return new Runner(dependencies);
  }

  /**
   * Register custom dependency factory
   */
  public registerDependency(name: string, factory: Function): void {
    this._container.registerFactory(name, factory);
  }

  /**
   * Get container for advanced usage
   */
  public getContainer(): EnhancedDependencyContainer {
    return this._container;
  }
}

/**
 * Default factory instance for easy usage
 */
export const defaultRunnerFactory = new RunnerFactory();

/**
 * Backward compatibility function - creates Runner with original interface
 * Accepts 'any' types for backwards compatibility but converts to proper interfaces internally
 */
export function createRunner(
  tasks: Map<string, any>, 
  globalVariables: Map<string, any> = new Map(), 
  globalConstants: Map<string, any> = new Map(), 
  globalEnvironmentVariables: Map<string, any> = new Map(), 
  options: any = {}
): Runner {
  // Convert to proper interfaces
  const typedTasks = tasks as ITaskMap;
  const typedGlobalVariables = globalVariables as IVariableMap;
  const typedGlobalConstants = globalConstants as IConstantMap;
  const typedGlobalEnvironmentVariables = globalEnvironmentVariables as IEnvironmentVariableMap;
  const typedOptions = options as IRunnerOptions;
  
  return defaultRunnerFactory.createRunner(
    typedTasks, 
    typedGlobalVariables, 
    typedGlobalConstants, 
    typedGlobalEnvironmentVariables, 
    typedOptions
  );
}