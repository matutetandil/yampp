import { Runner } from './runner.js';
import { DependencyContainer } from './dependency-container.js';

/**
 * Runner Factory
 * Creates Runner instances with proper dependency injection
 * Maintains backward compatibility with the original constructor interface
 */
export class RunnerFactory {
  constructor(dependencyContainer = new DependencyContainer()) {
    this.container = dependencyContainer;
  }

  /**
   * Create Runner with dependencies injected
   * @param {Map} tasks - Tasks map
   * @param {Map} globalVariables - Global variables
   * @param {Map} globalConstants - Global constants
   * @param {Map} globalEnvironmentVariables - Global environment variables
   * @param {Object} options - Runner options
   * @returns {Runner} - Configured Runner instance
   */
  createRunner(tasks, globalVariables = new Map(), globalConstants = new Map(), globalEnvironmentVariables = new Map(), options = {}) {
    const dependencies = this.container.createRunnerDependencies(
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
   * @param {string} name - Dependency name
   * @param {Function} factory - Factory function
   */
  registerDependency(name, factory) {
    this.container.registerFactory(name, factory);
  }

  /**
   * Register singleton instance
   * @param {string} name - Dependency name  
   * @param {*} instance - Instance to register
   */
  registerInstance(name, instance) {
    this.container.registerInstance(name, instance);
  }
}

/**
 * Default factory instance for easy usage
 */
export const defaultRunnerFactory = new RunnerFactory();

/**
 * Backward compatibility function - creates Runner with original interface
 * @param {Map} tasks - Tasks map
 * @param {Map} globalVariables - Global variables
 * @param {Map} globalConstants - Global constants
 * @param {Map} globalEnvironmentVariables - Global environment variables
 * @param {Object} options - Runner options
 * @returns {Runner} - Configured Runner instance
 */
export function createRunner(tasks, globalVariables = new Map(), globalConstants = new Map(), globalEnvironmentVariables = new Map(), options = {}) {
  return defaultRunnerFactory.createRunner(tasks, globalVariables, globalConstants, globalEnvironmentVariables, options);
}