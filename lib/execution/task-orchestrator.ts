import chalk, { type ChalkInstance } from 'chalk';
import pLimit from 'p-limit';
import { platformDetector } from '../platform/index.js';
import { VariableSubstitution } from './variable-substitution.js';
import { TaskStatusManager } from './task-status-manager.js';
import { EXECUTION_CONFIG } from '../config/constants.js';
import { OutputManager } from '../output/types/output-manager.js';
import { CommandExecutor } from '../core/types/command-executor.js';
import { InternalFunctionRegistry } from '../internal-functions/internal-function-registry.js';
import { ExecutionState } from './types/execution-state.js';
import { FileWatcher } from '../core/types/file-watcher.js';
import { TaskOrchestratorOptions } from '../tasks/types/task-orchestrator-options.js';
import { TaskInstance } from '../tasks/types/task-instance.js';
import { TaskCall } from '../tasks/types/task-call.js';
import { Task } from '../models/task.js';
import { ShellContentManager } from '../shell/types/shell-content-manager.js';
import { ExecuteInternalFunctionCallback } from '../internal-functions/execute-internal-function-callback.js';
import { VariableSubstitutionStatic } from '../core/types/variable-substitution.js';

/**
 * TaskOrchestrator handles task execution coordination and dependency management
 * Separated from Runner for Single Responsibility Principle
 */
export class TaskOrchestrator {
  private readonly outputManager: OutputManager;
  private readonly commandExecutor: CommandExecutor;
  private readonly internalFunctionRegistry: InternalFunctionRegistry;
  private readonly state: ExecutionState;
  private readonly fileWatcher: FileWatcher;
  private readonly maxJobs: number;
  private readonly quiet: boolean;
  private readonly force: boolean;
  private readonly statusManager: TaskStatusManager;
  
  private globalVariables?: Map<string, string>;
  private globalConstants?: Map<string, string>;
  private globalEnvironmentVariables?: Map<string, string>;
  private taskColors?: Map<string, ChalkInstance>;
  private shellContentManager?: ShellContentManager;
  private executeInternalFunctionCallback?: ExecuteInternalFunctionCallback;
  private ugly?: boolean;
  private verboseUgly?: boolean;
  private tasks: Map<string, any>;

  constructor(
    outputManager: OutputManager,
    commandExecutor: CommandExecutor,
    internalFunctionRegistry: InternalFunctionRegistry,
    state: ExecutionState,
    fileWatcher: FileWatcher,
    tasks: Map<string, any>,
    options: TaskOrchestratorOptions = {}
  ) {
    this.outputManager = outputManager;
    this.commandExecutor = commandExecutor;
    this.internalFunctionRegistry = internalFunctionRegistry;
    this.state = state;
    this.fileWatcher = fileWatcher;
    this.tasks = tasks;
    this.maxJobs = options.maxJobs || EXECUTION_CONFIG.DEFAULT_PARALLEL_JOBS;
    this.quiet = options.quiet || false;
    this.force = options.force || false;
    this.statusManager = new TaskStatusManager();
  }

  /**
   * Execute tasks according to execution plan
   * @param executionPlan - Array of task instances to execute
   * @param taskCalls - Original task calls for logging
   * @returns Execution result with success/failure counts
   */
  public async execute(
    executionPlan: TaskInstance[], 
    taskCalls: TaskCall[]
  ): Promise<{ success: boolean; completed: number; failed: number }> {
    const startTime = Date.now();
    
    if (executionPlan.length === 0) {
      this.outputManager.log('No tasks to execute');
      return { success: true, completed: 0, failed: 0 };
    }
    
    if (!this.quiet) {
      const taskNames = (taskCalls || []).map(t => t?.taskName || 'unknown').join(', ');
      console.log(chalk.green('→'), `Executing tasks: ${taskNames}`);
      console.log(chalk.green('→'), `Executing ${executionPlan.length} task instance(s) with max ${this.maxJobs} parallel job(s)`);
      console.log();
    }
    
    // Create a concurrency limiter
    const limit = pLimit(this.maxJobs);
    const serialLimit = pLimit(EXECUTION_CONFIG.SINGLE_JOB_LIMIT);
    
    // Track task promises
    const taskPromises = new Map<string, Promise<void>>();
    
    // Execute tasks according to plan
    for (const taskInstance of executionPlan) {
      // Create promise for this task instance
      const taskPromise = this.executeTaskInstance(taskInstance, taskPromises, limit, serialLimit);
      taskPromises.set(taskInstance.id, taskPromise);
    }
    
    // Wait for all tasks to complete
    await Promise.all(taskPromises.values());
    
    // Print summary
    this.printSummary(startTime);
    
    return this.statusManager.getExecutionSummary();
  }

  /**
   * Build execution plan from task calls
   * Creates topologically sorted list of task instances 
   */
  public async buildExecutionPlan(taskCalls: TaskCall[]): Promise<TaskInstance[]> {
    const plan: TaskInstance[] = [];
    const visited = new Set<string>();
    const processing = new Set<string>();
    
    for (const taskCall of taskCalls) {
      await this.collectTaskInstances(taskCall.taskName, taskCall.parameters || [], plan, visited, processing);
    }
    
    return plan;
  }

  /**
   * Recursively collect task instances with dependency resolution
   */
  private async collectTaskInstances(
    taskName: string, 
    parameters: any[], 
    plan: TaskInstance[], 
    visited: Set<string>, 
    processing: Set<string>
  ): Promise<void> {
    const task = this.tasks.get(taskName);
    if (!task) return;
    
    const instanceId = `${taskName}(${parameters.join(',')})`;
    
    if (processing.has(instanceId)) {
      throw new Error(`Circular dependency detected involving ${instanceId}`);
    }
    
    if (visited.has(instanceId)) {
      return;
    }
    
    processing.add(instanceId);
    
    // Process dependencies first (topological order)
    const typedTask = task as any;
    for (const depName of typedTask.dependencies || []) {
      const depParams = (typedTask.dependencyParams?.[depName] || []);
      
      // Ensure depParams is an array before mapping
      const safeDepParams = Array.isArray(depParams) ? depParams : [];
      
      // Resolve parameter references 
      const resolvedParams = safeDepParams.map((param: any) => {
        if (param.type === 'variable') {
          // Variable reference: look up in task parameters
          const paramIndex = typedTask.parameters?.indexOf(param.name) ?? -1;
          if (paramIndex >= 0) {
            return parameters[paramIndex];
          } else {
            throw new Error(`Parameter '${param.name}' referenced in dependency '${depName}' is not defined in task '${taskName}'`);
          }
        } else {
          // Literal value
          return param.value;
        }
      });
      
      await this.collectTaskInstances(depName, resolvedParams, plan, visited, processing);
    }
    
    // Add this task instance with properly prepared task (variables processed)
    const preparedTask = this.prepareTaskVariables(task, parameters);
    const taskInstance: TaskInstance = {
      id: instanceId,
      taskName,
      task: preparedTask,
      parameters: parameters,
      signature: parameters.length > 0 ? `${taskName}(${parameters.join(', ')})` : taskName
    };
    
    plan.push(taskInstance);
    visited.add(instanceId);
    processing.delete(instanceId);
  }

  /**
   * Execute a single task instance with dependency and cache management
   * @param taskInstance - Task instance to execute
   * @param taskPromises - Map of task promises for dependency coordination
   * @param limit - Parallel execution limiter
   * @param serialLimit - Serial execution limiter
   */
  private async executeTaskInstance(
    taskInstance: TaskInstance, 
    taskPromises: Map<string, Promise<void>>, 
    limit: (fn: () => Promise<void>) => Promise<void>, 
    serialLimit: (fn: () => Promise<void>) => Promise<void>
  ): Promise<void> {
    const { task, parameters, signature } = taskInstance;
    const typedTask = task as Task;
    
    // Wait for dependencies
    for (const depName of typedTask.getDependencies()) {
      const depParams = typedTask.getDependencyParams()[depName] || [];
      const resolvedParams = depParams.map((param: any) => {
        const typedParam = param as { type: string; name?: string; value?: string };
        if (typedParam.type === 'variable') {
          const taskParams = typedTask.getParameters();
          const paramIndex = taskParams.findIndex((p: any) => p.name === typedParam.name!);
          return paramIndex >= 0 ? parameters[paramIndex] : typedParam.name;
        } else {
          return typedParam.value;
        }
      });
      
      const depId = `${depName}(${resolvedParams.join(',')})`;
      const depPromise = taskPromises.get(depId);
      
      if (depPromise) {
        await depPromise;
        
        // Check if dependency failed
        if (this.statusManager.isTaskFailed(depId)) {
          if (!this.quiet) {
            this.logTask(signature, `Skipped (dependency '${depId}' failed)`, chalk.gray);
          }
          this.statusManager.failTask(taskInstance.id);
          return;
        }
      }
    }
    
    // Check cache and file dependencies (use signature for cache key)
    if (!typedTask.isAlways && !this.force && await this.state.isTaskDone(taskInstance.id)) {
      // Check if task has watched files that are newer than cache
      if (typedTask.hasWatchedFiles()) {
        const cacheTimestamp = await this.state.getTaskTimestamp(taskInstance.id);
        const filesNewer = await this.fileWatcher.areFilesNewer(typedTask.getWatchedFiles()!, cacheTimestamp);
        
        if (filesNewer) {
          if (!this.quiet) {
            this.logTask(signature, 'Files changed, rebuilding', chalk.yellow);
          }
        } else {
          if (!this.quiet) {
            this.logTask(signature, 'Cached (files up-to-date)', chalk.gray);
          }
          this.statusManager.completeTask(taskInstance.id);
          return;
        }
      } else {
        if (!this.quiet) {
          this.logTask(signature, 'Cached', chalk.gray);
        }
        this.statusManager.completeTask(taskInstance.id);
        return;
      }
    }
    
    // Choose limiter based on serial modifier
    const limiter = typedTask.isSerial ? serialLimit : limit;
    
    // Execute task with concurrency control
    return limiter(async () => {
      this.outputManager.startTask(taskInstance.id, signature);
      this.statusManager.startTask(taskInstance.id);
      
      try {
        // Set up variables for this task instance
        const taskCopy = this.prepareTaskVariables(typedTask, parameters);
        
        // Pre-export task parameters to shell for cooperative control system (v0.8.2)
        const preExportCommands = this.buildPreExportCommands(typedTask, parameters);
        
        // Execute commands
        if (this.hasInternalFunctions(taskCopy.getCommands()) || this.hasInternalFunctionsInVariables(taskCopy)) {
          // Unified processing for tasks with internal functions
          const success = await this.executeUnifiedTaskContent(taskCopy, signature, taskInstance.id, preExportCommands);
          
          if (!success) {
            throw new Error(`Task failed: ${signature}`);
          }
        } else {
          // Traditional command-by-command execution
          if (preExportCommands.length > 0) {
            // Execute pre-export commands first
            for (const exportCmd of preExportCommands) {
              await this.commandExecutor.executeCommand(exportCmd, signature, taskInstance.id, taskCopy.variables);
            }
          }
          
          // Execute task content commands
          for (const command of taskCopy.getCommands()) {
            if (this.isAssignmentCommand(command)) {
              await this.handleAssignment(command, taskCopy.variables!);
            } else {
              // Regular command with variable substitution
              const substitutedCommand = this.substituteVariables(command, taskCopy.variables!);
              const success = await this.commandExecutor.executeCommand(substitutedCommand, signature, taskInstance.id, taskCopy.variables);
              
              if (!success) {
                throw new Error(`Command failed: ${substitutedCommand}`);
              }
            }
          }
        }
        
        this.outputManager.completeTask(taskInstance.id, true);
        this.statusManager.completeTask(taskInstance.id);
        await this.state.markTaskDone(taskInstance.id);
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.outputManager.completeTask(taskInstance.id, false);
        this.statusManager.failTask(taskInstance.id, errorMessage);
      }
    });
  }

  /**
   * Set up variables for task execution
   * @param task - Task definition
   * @param parameters - Task parameters
   * @returns Task copy with variables set up
   */
  private prepareTaskVariables(task: Task, parameters: string[]): Task & { variables: Map<string, string> } {
    
    // TEMP DEBUG: Check original task properties
    
    const variables = (VariableSubstitution as unknown as VariableSubstitutionStatic).setupTaskVariables(
      task, 
      parameters, 
      this.globalConstants, 
      this.globalVariables, 
      this.globalEnvironmentVariables
    );
    
    // Add variables property to task (task instances are ephemeral)
    (task as any).variables = variables;
    return task as Task & { variables: Map<string, string> };
  }

  /**
   * Build pre-export commands for cooperative control system
   * @param task - Task definition  
   * @param parameters - Task parameters
   * @returns Array of export commands
   */
  private buildPreExportCommands(task: Task, parameters: string[]): string[] {
    return (VariableSubstitution as unknown as VariableSubstitutionStatic).buildPreExportCommands(task, parameters);
  }

  /**
   * Execute unified task content (with internal functions)
   * @param taskCopy - Task copy with variables
   * @param signature - Task signature
   * @param taskId - Task ID
   * @param preExportCommands - Pre-export commands
   * @returns Success status
   */
  private async executeUnifiedTaskContent(
    taskCopy: Task & { variables: Map<string, string> }, 
    signature: string, 
    taskId: string, 
    preExportCommands: string[]
  ): Promise<boolean> {
    if (!this.shellContentManager) {
      throw new Error('ShellContentManager not set');
    }
    
    // Combine pre-exports with task content into single execution block
    const fullContent = [
      ...preExportCommands,
      ...taskCopy.getCommands()
    ].join('\n');
    
    // Convert Maps to arrays for the processor
    const localVariables = Array.from(taskCopy.getLocalVariables().entries()).map(([name, value]) => ({
      name,
      value
    }));
    const localConstants = Array.from(taskCopy.getLocalConstants().entries()).map(([name, value]) => ({
      name,
      value
    }));
    
    // Process through ShellContentManager (comments, proxies, etc.)
    const executionContext = this.shellContentManager.process(fullContent, localVariables, localConstants);
    
    // Execute as single unit
    return this.commandExecutor.executePreparedCommand(executionContext as any, signature, taskId);
  }

  /**
   * Check if task has internal functions
   * @param content - Task content commands
   * @returns True if has internal functions
   */
  private hasInternalFunctions(content: string[]): boolean {
    const functionNames = (this.internalFunctionRegistry as any).getFunctionNames();
    
    for (const funcName of functionNames) {
      for (const command of content) {
        if (command.includes(`__${funcName}`)) {
          return true;
        }
      }
    }
    return false;
  }

  private hasInternalFunctionsInVariables(task: Task): boolean {
    const functionNames = (this.internalFunctionRegistry as any).getFunctionNames();
    
    // Check local variables for internal functions
    for (const [name, value] of task.getLocalVariables()) {
      for (const funcName of functionNames) {
        if (typeof value === 'string' && value.includes(`__${funcName}`)) {
          return true;
        }
      }
    }
    
    // Check local constants for internal functions
    for (const [name, value] of task.getLocalConstants()) {
      for (const funcName of functionNames) {
        if (typeof value === 'string' && value.includes(`__${funcName}`)) {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Check if command is variable assignment
   * @param command - Command to check
   * @returns True if assignment command
   */
  private isAssignmentCommand(command: string): boolean {
    return (VariableSubstitution as unknown as VariableSubstitutionStatic).isAssignmentCommand(command);
  }

  /**
   * Handle variable assignment command
   * @param command - Assignment command
   * @param variables - Variables map
   */
  private async handleAssignment(command: string, variables: Map<string, string>): Promise<void> {
    if (command.startsWith('_assign ')) {
      return (VariableSubstitution as unknown as VariableSubstitutionStatic).handleAssignment(command, variables);
    } else {
      return (VariableSubstitution as unknown as VariableSubstitutionStatic).handleGenericAssignment(command, variables);
    }
  }

  /**
   * Substitute variables in command string
   * @param command - Command with variables
   * @param variables - Variables map
   * @returns Command with substituted variables
   */
  private substituteVariables(command: string, variables: Map<string, string>): string {
    return (VariableSubstitution as unknown as VariableSubstitutionStatic).substituteVariables(command, variables);
  }

  /**
   * Log task message with color
   * @param taskName - Task name
   * @param message - Message
   * @param messageColor - Chalk color function
   */
  private logTask(taskName: string, message: string, messageColor: ChalkInstance = chalk.white): void {
    const color = this.taskColors?.get(taskName) || chalk.white;
    const prefix = color(`[${taskName}]`);
    
    if (this.ugly || this.verboseUgly) {
      console.log(`${prefix} ${messageColor(message)}`);
    } else {
      this.outputManager.log(`${prefix} ${messageColor(message)}`);
    }
  }

  /**
   * Print execution summary
   * @param startTime - Start time
   */
  private printSummary(startTime: number): void {
    if (this.quiet) return;
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    const summary = this.statusManager.getExecutionSummary();
    
    console.log();
    console.log('Execution Summary:');
    
    if (summary.completed > 0) {
      console.log(chalk.green('✓'), `${summary.completed} task${summary.completed === 1 ? '' : 's'} completed successfully`);
    }
    
    if (summary.failed > 0) {
      console.log(chalk.red('✗'), `${summary.failed} task${summary.failed === 1 ? '' : 's'} failed`);
    }
    
    console.log(`Total: ${summary.completed + summary.failed} tasks in ${duration}s`);
  }

  /**
   * Execute internal function (callback to Runner's method)
   * @param func - Internal function object
   * @param variables - Variables map
   * @param signature - Task signature
   * @param taskPromises - Task promises map
   * @param limit - Parallel limiter
   * @param serialLimit - Serial limiter
   */
  public async executeInternalFunction(
    func: unknown, 
    variables: Map<string, string>, 
    signature: string, 
    taskPromises: Map<string, Promise<boolean>>, 
    limit: (fn: () => Promise<boolean>) => Promise<boolean>, 
    serialLimit: (fn: () => Promise<boolean>) => Promise<boolean>
  ): Promise<void> {
    // This will be passed as a callback from Runner
    if (this.executeInternalFunctionCallback) {
      return this.executeInternalFunctionCallback(func, variables, signature, taskPromises, limit, serialLimit);
    }
    throw new Error('executeInternalFunction callback not provided');
  }

  /**
   * Set global variables for tasks
   * @param globalVariables - Global variables
   * @param globalConstants - Global constants
   * @param globalEnvironmentVariables - Global environment variables
   */
  public setGlobalVariables(
    globalVariables: Map<string, string>, 
    globalConstants: Map<string, string>, 
    globalEnvironmentVariables: Map<string, string>
  ): void {
    this.globalVariables = globalVariables;
    this.globalConstants = globalConstants;
    this.globalEnvironmentVariables = globalEnvironmentVariables;
  }

  /**
   * Set task colors for display
   * @param taskColors - Task color mapping
   */
  public setTaskColors(taskColors: Map<string, ChalkInstance>): void {
    this.taskColors = taskColors;
  }

  /**
   * Set shell content manager
   * @param shellContentManager - Shell content manager instance
   */
  public setShellContentManager(shellContentManager: ShellContentManager): void {
    this.shellContentManager = shellContentManager;
  }

  /**
   * Execute a task call from internal functions (__call)
   * @param call - Call object with taskName and params
   * @param variables - Current variable map
   * @param taskPromises - Map of running task promises
   * @param limit - General execution limit
   * @param serialLimit - Serial execution limit
   */
  public async executeCall(call: any, variables: Map<string, any>, taskPromises: Map<string, Promise<any>>, limit: any, serialLimit: any): Promise<void> {
    // Resolve parameters for the call using the same logic as the original
    const resolvedParams = call.params.map((param: any) => {
      if (param && param.type === 'variable') {
        const value = variables.get(param.name);
        if (value === undefined) {
          throw new Error(`Variable '$${param.name}' is not defined`);
        }
        return value;
      } else if (typeof param === 'string') {
        // Simple string parameter
        return (VariableSubstitution as unknown as VariableSubstitutionStatic).substituteVariables(param, variables);
      } else {
        // Object with value property
        return (VariableSubstitution as unknown as VariableSubstitutionStatic).substituteVariables(param.value || param, variables);
      }
    });
    
    // Get the task to call
    const calledTask = this.tasks.get(call.taskName);
    if (!calledTask) {
      throw new Error(`Task '${call.taskName}' not found for __call`);
    }
    
    const callId = `${call.taskName}(${resolvedParams.join(',')})`;
    
    // Check if this call is already running
    if (taskPromises.has(callId)) {
      await taskPromises.get(callId);
      return;
    }
    
    // Create and execute the called task instance
    const taskInstance: TaskInstance = {
      id: callId,
      taskName: call.taskName,
      task: calledTask,
      parameters: resolvedParams,
      signature: resolvedParams.length > 0 ? `${call.taskName}(${resolvedParams.join(', ')})` : call.taskName
    };
    
    const callPromise = this.executeTaskInstance(taskInstance, taskPromises, limit, serialLimit);
    taskPromises.set(callId, callPromise);
    
    await callPromise;
  }
}