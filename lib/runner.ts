import chalk from 'chalk';
import { TaskCall } from './tasks/types/task-call.js';
import { TaskInstance } from './tasks/types/task-instance.js';
import { ExecutionResult } from './execution/types/execution-result.js';
import { DryRunAnalysis } from './core/types/dry-run-analysis.js';

// Service interfaces
import { ITaskExecutionService } from './tasks/interfaces/task-execution-service.interface.js';
import { ICacheService } from './cache/types/cache-service.interface.js';
import { IVariableService } from './core/types/variable-service.interface.js';
import { ITaskDisplayService } from './tasks/interfaces/task-display-service.interface.js';
import { IWatchService } from './core/types/watch-service.interface.js';
import { IInternalFunctionRegistry } from './internal-functions/internal-function-registry.interface.js';
import { IRunnerDependencies } from './configuration/interfaces/runner-dependencies.interface.js';

// Type interfaces
import { ITaskMap } from './tasks/interfaces/task-map.interface.js';
import { IVariableMap } from './core/types/variable-map.interface.js';
import { IConstantMap } from './core/types/constant-map.interface.js';
import { IEnvironmentVariableMap } from './core/types/environment-variable-map.interface.js';
import { IRunnerOptions } from './configuration/types/runner-options.interface.js';
import { ITaskGraph } from './tasks/interfaces/task-graph.interface.js';
import { IStateManager } from './core/types/state-manager.interface.js';
import { ITaskColorMap } from './tasks/interfaces/task-color-map.interface.js';
import { ITaskPromiseMap } from './tasks/interfaces/task-promise-map.interface.js';
import { ILimit } from './core/types/limit.interface.js';
import { IRunnerConfigurator } from './configuration/interfaces/runner-configurator.interface.js';

// Infrastructure imports
import { FileWatcher } from './file-watcher.js';
import { ClaudeOutputManager } from './claude-output-manager.js';
import { InputManager } from './input-manager.js';
import { RunnerConfig } from './config/runner-config.js';

/**
 * Refactored Runner following strict SOLID principles
 * 
 * SRP: Single responsibility - orchestrates services but doesn't implement business logic
 * OCP: Open/Closed - extensible through service interfaces
 * LSP: Liskov Substitution - all services implement well-defined interfaces  
 * ISP: Interface Segregation - each service has focused interface
 * DIP: Dependency Inversion - depends on abstractions, not concretions
 */
export class Runner implements IRunnerConfigurator {
  // Core data
  private readonly tasks: ITaskMap;
  private readonly globalVariables: IVariableMap;
  private readonly globalConstants: IConstantMap;
  private readonly globalEnvironmentVariables: IEnvironmentVariableMap;
  private readonly options: IRunnerOptions;
  
  // Infrastructure dependencies (created upfront)  
  private readonly graph: ITaskGraph;
  private readonly state: IStateManager;
  private readonly fileWatcher: FileWatcher;
  private readonly outputManager: ClaudeOutputManager;
  private readonly inputManager: InputManager;
  
  // Components created through factory pattern (circular dependencies)
  private readonly internalFunctionRegistry: IInternalFunctionRegistry;
  private readonly shellContentManager: any; // Will be ShellContentManager
  private readonly commandExecutor: any; // Will be CommandExecutor
  private readonly taskOrchestrator: any; // Will be TaskOrchestrator
  
  // Configuration (immutable)
  private readonly config: RunnerConfig;
  private readonly maxJobs: number;
  private readonly verbose: boolean;
  private readonly quiet: boolean;
  private readonly ugly: boolean;
  private readonly verboseUgly: boolean;
  private readonly dryRunMode: boolean;
  private readonly plan: boolean;
  private readonly force: boolean;
  private readonly completed: Set<string>;

  constructor(dependencies: IRunnerDependencies) {
    // Core data
    this.tasks = dependencies.tasks;
    this.globalVariables = dependencies.globalVariables;
    this.globalConstants = dependencies.globalConstants;
    this.globalEnvironmentVariables = dependencies.globalEnvironmentVariables;
    this.options = dependencies.options;
    
    // Infrastructure dependencies
    this.graph = dependencies.taskGraph;
    this.state = dependencies.stateManager;
    this.fileWatcher = dependencies.fileWatcher;
    this.outputManager = dependencies.outputManager;
    this.inputManager = dependencies.inputManager;
    
    // Create circular dependencies (following original JS pattern)
    this.internalFunctionRegistry = dependencies.createInternalFunctionRegistry(this);
    this.shellContentManager = dependencies.createShellContentManager();
    this.commandExecutor = dependencies.createCommandExecutor(this.executeInternalFunction.bind(this));
    this.taskOrchestrator = dependencies.createTaskOrchestrator();
    
    // Initialize global variables in task orchestrator
    this.taskOrchestrator.setGlobalVariables(this.globalVariables, this.globalConstants, this.globalEnvironmentVariables);
    
    // Configure ShellContentManager for internal function processing
    this.taskOrchestrator.setShellContentManager(this.shellContentManager);
    
    // Configuration
    this.config = RunnerConfig.fromOptions(this.options);
    this.maxJobs = this.config.maxJobs;
    this.verbose = this.config.verbose;
    this.quiet = this.config.quiet;
    this.ugly = this.config.ugly;
    this.verboseUgly = this.config.verboseUgly;
    this.dryRunMode = this.config.dryRunMode;
    this.plan = this.config.plan;
    this.force = this.config.force;
    this.completed = new Set();
  }

  // ==================== EXECUTION METHODS ====================
  
  /**
   * Execute internal function - delegates to registry using Strategy pattern
   * This is the callback used by CommandExecutor for circular dependency resolution
   */
  public async executeInternalFunction(
    internalFunction: unknown,
    variables: Map<string, string>,
    taskId: string,
    taskPromises: Map<string, Promise<boolean>>,
    limit: (fn: () => Promise<boolean>) => Promise<boolean>,
    serialLimit: (fn: () => Promise<boolean>) => Promise<boolean>
  ): Promise<void> {
    await this.internalFunctionRegistry.execute(
      internalFunction as any,
      variables as any,
      taskId,
      taskPromises as any,
      limit as any,
      serialLimit as any
    );
  }
  
  public async execute(taskCalls: TaskCall[]): Promise<ExecutionResult> {
    // Build execution plan with parameters
    const executionPlan = await this.buildExecutionPlan(taskCalls);
    
    // Delegate to TaskOrchestrator
    return await this.taskOrchestrator.execute(executionPlan);
  }

  public async buildExecutionPlan(taskCalls: TaskCall[]): Promise<TaskInstance[]> {
    // Delegate to TaskOrchestrator - proper separation of concerns
    return await this.taskOrchestrator.buildExecutionPlan(taskCalls);
  }

  // ==================== CACHE METHODS ====================
  
  public async clean(): Promise<void> {
    await this.state.cleanAll();
  }

  // ==================== DISPLAY METHODS ====================
  
  // These methods are handled by CLI commands directly, not by Runner

  // ==================== GETTER METHODS ====================
  
  public getGraph(): ITaskGraph {
    return this.graph;
  }

  public getTasks(): ITaskMap {
    return this.tasks;
  }

  // ==================== TASK UTILITY METHODS ====================
  
  public hasModifier(task: any, modifier: string): boolean {
    return task.modifiers && task.modifiers.includes(modifier);
  }

  public getWatches(task: any): string[] {
    return task.watchedFiles || [];
  }

  public async shouldTaskRun(taskInstance: TaskInstance): Promise<boolean> {
    // Always run tasks with 'always' modifier
    if (this.hasModifier(taskInstance.task, 'always')) {
      return true;
    }
    
    // Check if task result is cached
    return !(await this.state.isTaskDone(taskInstance.id));
  }

  public async getAnalyzeDryRun(executionPlan: TaskInstance[]): Promise<any> {
    let willExecute = 0;
    let cached = 0;
    
    for (const taskInstance of executionPlan) {
      const needsRun = await this.shouldTaskRun(taskInstance);
      if (needsRun) {
        willExecute++;
      } else {
        cached++;
      }
    }
    
    return {
      willExecute,
      cached,
      estimatedTime: `~${Math.max(1, Math.ceil(willExecute / this.maxJobs))}s`
    };
  }

  public getTaskColors(): ITaskColorMap {
    // Simple color mapping - could be enhanced with proper color service
    const chalkColors = [chalk.cyan, chalk.yellow, chalk.green, chalk.magenta, chalk.blue, chalk.red];
    const taskColors = new Map();
    const taskNames = Array.from(this.tasks.keys());
    
    taskNames.forEach((taskName, index) => {
      taskColors.set(taskName, chalkColors[index % chalkColors.length]);
    });
    
    return taskColors as ITaskColorMap;
  }

  // ==================== INTERNAL FUNCTION METHODS ====================
  

  public registerInternalFunction(functionHandler: unknown): void {
    this.internalFunctionRegistry.register(functionHandler);
  }

  public unregisterInternalFunction(functionName: string): boolean {
    return this.internalFunctionRegistry.unregister(functionName);
  }

  public getAvailableInternalFunctions(): string[] {
    return this.internalFunctionRegistry.getRegisteredFunctions();
  }

  // ==================== CORE TASK PROCESSING ====================
  
  /**
   * Check if task needs unified processing (has internal functions or comments)
   */
  public taskNeedsUnifiedProcessing(task: unknown): boolean {
    const typedTask = task as any;
    
    // If task has internal functions, it needs unified processing
    if (typedTask.internalFunctions && typedTask.internalFunctions.length > 0) {
      return true;
    }
    
    // Also check if regular commands need processing (comments, etc.)
    const fullContent = typedTask.commands.join('\n');
    return (this._getShellContentManager() as any).needsProcessing(fullContent);
  }

  // ==================== GETTERS (ENCAPSULATION) ====================

  public getState(): IStateManager {
    return this.state;
  }

  public getFileWatcher(): FileWatcher {
    return this.fileWatcher;
  }

  public getMaxJobs(): number {
    return this.maxJobs;
  }

  public isVerbose(): boolean {
    return this.verbose;
  }

  public isQuiet(): boolean {
    return this.quiet;
  }

  // Service layer getters removed - using factory pattern with direct component access

  public getInternalFunctionRegistry(): IInternalFunctionRegistry {
    return this.internalFunctionRegistry;
  }

  /**
   * Execute a task call from internal functions (__call)
   * This is part of the Runner's interface exposed to internal functions
   */
  public async executeCall(
    call: any, 
    variables: Map<string, any>, 
    taskPromises: Map<string, Promise<any>>, 
    limit: any, 
    serialLimit: any
  ): Promise<void> {
    // Delegate to TaskOrchestrator which handles the actual task execution
    return await this.taskOrchestrator.executeCall(call, variables, taskPromises, limit, serialLimit);
  }

  // Private helper methods
  private _getShellContentManager(): unknown {
    // This will need to be injected as a service in the future
    // For now, maintain backwards compatibility
    return (this as any).shellContentManager;
  }
}