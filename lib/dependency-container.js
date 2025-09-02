import os from 'os';
import { TaskGraph } from './models/index.js';
import { StateManager } from './state.js';
import { FileWatcher } from './file-watcher.js';
import { ClaudeOutputManager } from './claude-output-manager.js';
import { InputManager } from './input-manager.js';
import { InternalFunctionRegistry } from './internal-functions/registry.js';
import { platformDetector } from './platform/index.js';
import { ShellContentManager } from './shell-content/shell-content-manager.js';
import { CommandExecutor } from './execution/command-executor.js';
import { TaskOrchestrator } from './execution/task-orchestrator.js';
import { RunnerConfig } from './config/runner-config.js';

/**
 * Dependency Injection Container
 * Creates and manages all Runner dependencies following Dependency Inversion Principle
 * Makes Runner more testable and loosely coupled
 */
export class DependencyContainer {
  constructor() {
    this.instances = new Map();
    this.factories = new Map();
    this.setupDefaultFactories();
  }

  /**
   * Setup default factories for all dependencies
   */
  setupDefaultFactories() {
    // Core infrastructure
    this.factories.set('taskGraph', (tasks) => new TaskGraph(tasks));
    this.factories.set('stateManager', () => new StateManager());
    this.factories.set('fileWatcher', () => new FileWatcher());
    
    // Output and input management
    this.factories.set('outputManager', (options) => new ClaudeOutputManager({
      verbose: options.verbose,
      quiet: options.quiet,
      ugly: options.ugly,
      verboseUgly: options.verboseUgly
    }));
    
    this.factories.set('inputManager', (options, outputManager) => new InputManager({
      overrides: options.inputOverrides || new Map(),
      dryRun: options.dryRun,
      plan: options.plan,
      outputManager: outputManager
    }));
    
    // Function and content management
    this.factories.set('internalFunctionRegistry', (runner) => new InternalFunctionRegistry(runner));
    this.factories.set('shellContentManager', (internalFunctionRegistry) => 
      new ShellContentManager(platformDetector.currentPlatform, internalFunctionRegistry)
    );
    
    // Execution components
    this.factories.set('commandExecutor', (outputManager, internalFunctionRegistry, shellContentManager, executeInternalFunctionCallback) => 
      new CommandExecutor(outputManager, internalFunctionRegistry, shellContentManager, executeInternalFunctionCallback)
    );
    
    this.factories.set('taskOrchestrator', (outputManager, commandExecutor, internalFunctionRegistry, stateManager, fileWatcher, config) => 
      new TaskOrchestrator(outputManager, commandExecutor, internalFunctionRegistry, stateManager, fileWatcher, config.getExecutionConfig())
    );
  }

  /**
   * Register a custom factory for dependency
   * @param {string} name - Dependency name
   * @param {Function} factory - Factory function
   */
  registerFactory(name, factory) {
    this.factories.set(name, factory);
  }

  /**
   * Register a singleton instance
   * @param {string} name - Dependency name
   * @param {*} instance - Instance to register
   */
  registerInstance(name, instance) {
    this.instances.set(name, instance);
  }

  /**
   * Get or create dependency
   * @param {string} name - Dependency name
   * @param {...*} args - Arguments for factory
   * @returns {*} - Dependency instance
   */
  get(name, ...args) {
    // Return singleton if exists
    if (this.instances.has(name)) {
      return this.instances.get(name);
    }

    // Create using factory
    const factory = this.factories.get(name);
    if (!factory) {
      throw new Error(`No factory registered for dependency: ${name}`);
    }

    const instance = factory(...args);
    return instance;
  }

  /**
   * Get singleton instance (creates and caches if doesn't exist)
   * @param {string} name - Dependency name
   * @param {...*} args - Arguments for factory
   * @returns {*} - Cached dependency instance
   */
  getSingleton(name, ...args) {
    if (!this.instances.has(name)) {
      const instance = this.get(name, ...args);
      this.instances.set(name, instance);
    }
    return this.instances.get(name);
  }

  /**
   * Clear all instances (useful for testing)
   */
  clearInstances() {
    this.instances.clear();
  }

  /**
   * Create a fully configured Runner with all dependencies
   * @param {Map} tasks - Tasks map
   * @param {Map} globalVariables - Global variables
   * @param {Map} globalConstants - Global constants  
   * @param {Map} globalEnvironmentVariables - Global environment variables
   * @param {Object} options - Runner options
   * @returns {Object} - Object with all Runner dependencies
   */
  createRunnerDependencies(tasks, globalVariables = new Map(), globalConstants = new Map(), globalEnvironmentVariables = new Map(), options = {}) {
    // Create configuration
    const config = RunnerConfig.fromOptions(options);
    
    // Create core dependencies
    const taskGraph = this.get('taskGraph', tasks);
    const stateManager = this.getSingleton('stateManager');
    const fileWatcher = this.getSingleton('fileWatcher');
    const outputManager = this.get('outputManager', config.getOutputConfig());
    const inputManager = this.get('inputManager', config.getOutputConfig(), outputManager);
    
    // This will be set after Runner is created (circular dependency)
    let internalFunctionRegistry;
    let shellContentManager;
    let commandExecutor;
    let taskOrchestrator;
    
    return {
      // Core data
      tasks,
      globalVariables,
      globalConstants,
      globalEnvironmentVariables,
      options,
      config,
      
      // Infrastructure
      taskGraph,
      stateManager,
      fileWatcher,
      outputManager,
      inputManager,
      
      // Factory functions for circular dependencies
      createInternalFunctionRegistry: (runner) => {
        internalFunctionRegistry = this.get('internalFunctionRegistry', runner);
        return internalFunctionRegistry;
      },
      
      createShellContentManager: () => {
        shellContentManager = this.get('shellContentManager', internalFunctionRegistry);
        return shellContentManager;
      },
      
      createCommandExecutor: (executeInternalFunctionCallback) => {
        commandExecutor = this.get('commandExecutor', outputManager, internalFunctionRegistry, shellContentManager, executeInternalFunctionCallback);
        return commandExecutor;
      },
      
      createTaskOrchestrator: () => {
        taskOrchestrator = this.get('taskOrchestrator', outputManager, commandExecutor, internalFunctionRegistry, stateManager, fileWatcher, config);
        return taskOrchestrator;
      }
    };
  }
}