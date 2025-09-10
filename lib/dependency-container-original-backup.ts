import { TaskGraph } from './models';
import { StateManager } from './state.js';
import { FileWatcher } from './file-watcher.js';
import { ClaudeOutputManager } from './claude-output-manager.js';
import { InputManager } from './input-manager.js';
import { InternalFunctionRegistry } from './internal-functions/registry.js';
import { platformDetector } from './platform';
import { ShellContentManager } from './shell-content/shell-content-manager.js';
import { CommandExecutor } from './execution';
import { TaskOrchestrator } from './execution/task-orchestrator.js';
import { RunnerConfig } from './config/runner-config.js';
import { RunnerDependencies } from './configuration/types/runner-dependencies';

/**
 * Dependency Injection Container
 * Creates and manages all Runner dependencies following Dependency Inversion Principle
 * Makes Runner more testable and loosely coupled
 */
export class DependencyContainer {
  private readonly instances: Map<string, any>;
  private readonly factories: Map<string, Function>;

  constructor() {
    this.instances = new Map();
    this.factories = new Map();
    this.setupDefaultFactories();
  }

  /**
   * Setup default factories for all dependencies
   */
  private setupDefaultFactories(): void {
    // Core infrastructure
    this.factories.set('taskGraph', (tasks: Map<string, any>) => new TaskGraph(tasks));
    this.factories.set('stateManager', () => new StateManager());
    this.factories.set('fileWatcher', () => new FileWatcher());

    // Output and input management
    this.factories.set('outputManager', (options: any) => new ClaudeOutputManager({
      verbose: options.verbose,
      quiet: options.quiet,
      ugly: options.ugly,
      verboseUgly: options.verboseUgly,
    }));

    this.factories.set('inputManager', (options: any, outputManager: any) => new InputManager({
      overrides: options.inputOverrides || new Map(),
      dryRun: options.dryRun,
      plan: options.plan,
      outputManager: outputManager,
    }));

    // Function and content management
    this.factories.set('internalFunctionRegistry', (runner: any) => new InternalFunctionRegistry(runner));
    this.factories.set('shellContentManager', (internalFunctionRegistry: any) =>
      new ShellContentManager(platformDetector.getCurrentPlatformStrategy(), internalFunctionRegistry),
    );

    // Execution components
    this.factories.set('commandExecutor', (outputManager: any, internalFunctionRegistry: any, shellContentManager: any, executeInternalFunctionCallback: any) =>
      new CommandExecutor(outputManager, internalFunctionRegistry, shellContentManager, executeInternalFunctionCallback),
    );

    this.factories.set('taskOrchestrator', (outputManager: any, commandExecutor: any, internalFunctionRegistry: any, stateManager: any, fileWatcher: any, config: any) =>
      new TaskOrchestrator(outputManager, commandExecutor, internalFunctionRegistry, stateManager, fileWatcher, config.getExecutionConfig()),
    );
  }

  /**
   * Register a custom factory for dependency
   */
  public registerFactory(name: string, factory: Function): void {
    this.factories.set(name, factory);
  }

  /**
   * Register a singleton instance
   */
  public registerInstance(name: string, instance: any): void {
    this.instances.set(name, instance);
  }

  /**
   * Get or create dependency
   */
  public get(name: string, ...args: any[]): any {
    // Return singleton if exists
    if (this.instances.has(name)) {
      return this.instances.get(name);
    }

    // Create using factory
    const factory = this.factories.get(name);
    if (!factory) {
      throw new Error(`No factory registered for dependency: ${ name }`);
    }

    const instance = factory(...args);
    return instance;
  }

  /**
   * Get singleton instance (creates and caches if doesn't exist)
   */
  public getSingleton(name: string, ...args: any[]): any {
    if (!this.instances.has(name)) {
      const instance = this.get(name, ...args);
      this.instances.set(name, instance);
    }
    return this.instances.get(name);
  }

  /**
   * Clear all instances (useful for testing)
   */
  public clearInstances(): void {
    this.instances.clear();
  }

  /**
   * Create a fully configured Runner with all dependencies
   */
  public createRunnerDependencies(
    tasks: Map<string, any>,
    globalVariables: Map<string, any> = new Map(),
    globalConstants: Map<string, any> = new Map(),
    globalEnvironmentVariables: Map<string, any> = new Map(),
    options: any = {},
  ): RunnerDependencies {
    // Create configuration
    const config = RunnerConfig.fromOptions(options);

    // Create core dependencies
    const taskGraph = this.get('taskGraph', tasks);
    const stateManager = this.getSingleton('stateManager');
    const fileWatcher = this.getSingleton('fileWatcher');
    const outputManager = this.get('outputManager', config.getOutputConfig());
    const inputManager = this.get('inputManager', config.getOutputConfig(), outputManager);

    // This will be set after Runner is created (circular dependency)
    let internalFunctionRegistry: any;
    let shellContentManager: any;
    let commandExecutor: any;
    let taskOrchestrator: any;

    return {
      // Core data
      tasks,
      globalVariables,
      globalConstants,
      globalEnvironmentVariables,
      options,

      // Infrastructure
      taskGraph,
      stateManager,
      fileWatcher,
      outputManager,
      inputManager,

      // Factory functions for circular dependencies
      createInternalFunctionRegistry: (runner: any) => {
        internalFunctionRegistry = this.get('internalFunctionRegistry', runner);
        return internalFunctionRegistry;
      },

      createShellContentManager: () => {
        shellContentManager = this.get('shellContentManager', internalFunctionRegistry);
        return shellContentManager;
      },

      createCommandExecutor: (executeInternalFunctionCallback: Function) => {
        commandExecutor = this.get('commandExecutor', outputManager, internalFunctionRegistry, shellContentManager, executeInternalFunctionCallback);
        return commandExecutor;
      },

      createTaskOrchestrator: () => {
        taskOrchestrator = this.get('taskOrchestrator', outputManager, commandExecutor, internalFunctionRegistry, stateManager, fileWatcher, config);
        return taskOrchestrator;
      },
    };
  }
}