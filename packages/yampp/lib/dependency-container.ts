import chalk from 'chalk';

// Core infrastructure
import { TaskGraph, Task } from './models/index.js';
import { StateManager } from './state.js';
import { FileWatcher } from './file-watcher.js';
import { IFileWatcher } from './core/types/file-watcher.interface.js';
import { ClaudeOutputManager } from './claude-output-manager.js';
import { OutputManager } from './output/types/output-manager.js';
import { InputManager } from './input-manager.js';
import { InternalFunctionRegistry } from './internal-functions/registry.js';
import { ShellContentManager } from './shell-content/shell-content-manager.js';
import { platformDetector } from './platform/index.js';
import { CommandExecutor } from './execution/command-executor.js';
import { ICommandExecutor } from './execution/interfaces/command-executor.interface.js';
import { TaskOrchestrator } from './execution/task-orchestrator.js';
import { ITaskOrchestrator } from './execution/interfaces/task-orchestrator.interface.js';
import { ExecuteInternalFunctionCallback } from './internal-functions/execute-internal-function-callback.js';

// Service implementations
import { TaskExecutionService } from './services/task-execution-service.js';
import { CacheService } from './services/cache-service.js';
import { VariableService } from './services/variable-service.js';
import { TaskDisplayService } from './services/task-display-service.js';
import { WatchService } from './services/watch-service.js';

// Type interfaces
import { ITaskMap } from './tasks/interfaces/task-map.interface.js';
import { IVariableMap } from './core/types/variable-map.interface.js';
import { IConstantMap } from './core/types/constant-map.interface.js';
import { IEnvironmentVariableMap } from './core/types/environment-variable-map.interface.js';
import { IRunnerOptions } from './configuration/types/runner-options.interface.js';
import { ITaskGraph } from './tasks/interfaces/task-graph.interface.js';
import { IStateManager } from './core/types/state-manager.interface.js';
import { ITaskColorMap } from './tasks/interfaces/task-color-map.interface.js';

// Service interfaces
import { ITaskExecutionService } from './tasks/interfaces/task-execution-service.interface.js';
import { ICacheService } from './cache/types/cache-service.interface.js';
import { IVariableService } from './core/types/variable-service.interface.js';
import { ITaskDisplayService } from './tasks/interfaces/task-display-service.interface.js';
import { IWatchService } from './core/types/watch-service.interface.js';
import { IInternalFunctionRegistry } from './internal-functions/internal-function-registry.interface.js';

// Runner dependencies interface
import { IRunnerDependencies } from './configuration/interfaces/runner-dependencies.interface.js';

/**
 * Enhanced Dependency Injection Container for SOLID-compliant Runner
 *
 * Follows Dependency Inversion Principle:
 * - High-level modules (Runner) depend on abstractions (interfaces)
 * - Low-level modules (services) are created here
 * - Abstractions don't depend on details
 * - Details depend on abstractions
 *
 * Implements Factory Pattern with Interface Segregation
 */
export class EnhancedDependencyContainer {
  private readonly factories: Map<string, Function> = new Map();

  constructor() {
    this._setupDefaultFactories();
  }

  /**
   * Main factory method to create RunnerDependencies with factory pattern
   * This matches the original JavaScript architecture for circular dependencies
   */
  public createRunnerDependencies(
    tasks: ITaskMap,
    globalVariables: IVariableMap,
    globalConstants: IConstantMap,
    globalEnvironmentVariables: IEnvironmentVariableMap,
    options: IRunnerOptions,
  ): IRunnerDependencies {
    // Create core infrastructure dependencies (created upfront)
    const stateManager: IStateManager = this._createStateManager();
    const fileWatcher = this._createFileWatcher();
    const outputManager = this._createOutputManager(options);
    const inputManager = this._createInputManager(options, outputManager);
    const taskGraph: ITaskGraph = this._createTaskGraph(tasks);
    const taskColors: ITaskColorMap = this._createTaskColors(tasks);
    
    // These will be created later via factory functions (circular dependency handling)
    let internalFunctionRegistry: IInternalFunctionRegistry;
    let shellContentManager: ShellContentManager;
    let commandExecutor: CommandExecutor;
    let taskOrchestrator: TaskOrchestrator;

    // Return dependencies with factory functions for circular dependencies (matching JS original)
    return {
      // Core data
      tasks,
      globalVariables,
      globalConstants,
      globalEnvironmentVariables,
      options,

      // Infrastructure (created upfront)
      taskGraph,
      stateManager,
      fileWatcher,
      outputManager,
      inputManager,
      taskColors,

      // Factory functions for circular dependencies (matches original architecture)
      createInternalFunctionRegistry: (runner: any): IInternalFunctionRegistry => {
        internalFunctionRegistry = new InternalFunctionRegistry(runner);

        // Register plugin functions if available
        if (options.pluginFunctions && options.pluginFunctions instanceof Map) {
          for (const [name, func] of options.pluginFunctions) {
            internalFunctionRegistry.register(func);
          }
        }

        return internalFunctionRegistry;
      },

      createShellContentManager: (): ShellContentManager => {
        shellContentManager = new ShellContentManager(
          platformDetector.getCurrentPlatformStrategy(),
          internalFunctionRegistry as InternalFunctionRegistry
        );
        return shellContentManager;
      },

      createCommandExecutor: (executeInternalFunctionCallback: ExecuteInternalFunctionCallback): CommandExecutor => {
        commandExecutor = new CommandExecutor(
          outputManager,
          internalFunctionRegistry as InternalFunctionRegistry,
          shellContentManager as any,
          executeInternalFunctionCallback
        );
        return commandExecutor;
      },

      createTaskOrchestrator: (): TaskOrchestrator => {
        taskOrchestrator = new TaskOrchestrator(
          outputManager,
          commandExecutor,
          internalFunctionRegistry as InternalFunctionRegistry,
          stateManager,
          fileWatcher,
          tasks,
          {
            maxJobs: options.maxJobs || 10,
            quiet: options.quiet || false,
            force: options.force || false
          }
        );
        return taskOrchestrator;
      }
    };
  }

  /**
   * Register custom factory for dependency
   */
  public registerFactory(name: string, factory: Function): void {
    this.factories.set(name, factory);
  }

  /**
   * Get factory for dependency (for advanced usage)
   */
  public getFactory(name: string): Function | undefined {
    return this.factories.get(name);
  }

  // ==================== PRIVATE FACTORY METHODS ====================

  private _setupDefaultFactories(): void {
    // Register default factories for each dependency type
    this.factories.set('stateManager', () => this._createStateManager());
    this.factories.set('fileWatcher', () => this._createFileWatcher());
    this.factories.set('outputManager', (options: IRunnerOptions) => this._createOutputManager(options));
    this.factories.set('inputManager', (options: IRunnerOptions, outputManager: OutputManager) => this._createInputManager(options, outputManager));
    this.factories.set('taskGraph', (tasks: ITaskMap) => this._createTaskGraph(tasks));
    this.factories.set('taskColors', (tasks: ITaskMap) => this._createTaskColors(tasks));
    this.factories.set('internalFunctionRegistry', (runner: any) => this._createInternalFunctionRegistry(runner));

    // Service factories
    this.factories.set('cacheService', (stateManager: IStateManager) => this._createCacheService(stateManager));
    this.factories.set('variableService', (vars: IVariableMap, consts: IConstantMap, env: IEnvironmentVariableMap) =>
      this._createVariableService(vars, consts, env),
    );
    // Add other service factories as needed
  }

  private _createStateManager(): IStateManager {
    return new StateManager();
  }

  private _createFileWatcher(): FileWatcher {
    return new FileWatcher();
  }

  private _createOutputManager(options: IRunnerOptions): OutputManager {
    return new ClaudeOutputManager({
      quiet: options.quiet || false,
      verbose: options.verbose || false,
      ugly: options.ugly || false,
      verboseUgly: options.verboseUgly || false,
    });
  }

  private _createInputManager(options: IRunnerOptions, outputManager: OutputManager): InputManager {
    return new InputManager({
      overrides: (options as any).inputOverrides || new Map(),
      dryRun: Boolean(options.dryRun),
      plan: Boolean(options.plan),
      outputManager: outputManager
    });
  }

  private _createTaskGraph(tasks: ITaskMap): ITaskGraph {
    return new TaskGraph(tasks as Map<string, Task>);
  }

  private _createTaskColors(tasks: ITaskMap): ITaskColorMap {
    const colors = new Map();
    const availableColors = [
      chalk.red, chalk.green, chalk.yellow, chalk.blue,
      chalk.magenta, chalk.cyan, chalk.white, chalk.gray,
    ];

    let colorIndex = 0;
    for (const [taskName] of tasks) {
      colors.set(taskName, availableColors[colorIndex % availableColors.length]);
      colorIndex++;
    }

    return colors as ITaskColorMap;
  }

  private _createInternalFunctionRegistry(runner: any): IInternalFunctionRegistry {
    return new InternalFunctionRegistry(runner);
  }

  // ==================== SERVICE CREATION METHODS ====================

  private _createCacheService(stateManager: IStateManager): ICacheService {
    return new CacheService(stateManager);
  }

  private _createVariableService(
    globalVariables: IVariableMap,
    globalConstants: IConstantMap,
    globalEnvironmentVariables: IEnvironmentVariableMap,
  ): IVariableService {
    return new VariableService(globalVariables, globalConstants, globalEnvironmentVariables);
  }

  private _createTaskExecutionService(
    taskOrchestrator: TaskOrchestrator,
    stateManager: IStateManager,
    options: IRunnerOptions,
  ): ITaskExecutionService {
    return new TaskExecutionService(taskOrchestrator, stateManager, options);
  }

  private _createTaskDisplayService(
    tasks: ITaskMap,
    taskGraph: ITaskGraph,
    taskColors: ITaskColorMap,
    taskExecutionService: ITaskExecutionService,
    options: IRunnerOptions,
  ): ITaskDisplayService {
    return new TaskDisplayService(
      tasks,
      taskGraph,
      taskColors,
      taskExecutionService,
      options.maxJobs || 10,
      options.verbose || false,
      options.quiet || false,
    );
  }

  private _createWatchService(
    tasks: ITaskMap,
    fileWatcher: FileWatcher,
    taskExecutionService: ITaskExecutionService,
    options: IRunnerOptions,
  ): IWatchService {
    return new WatchService(tasks, fileWatcher, taskExecutionService, options.quiet || false);
  }
}