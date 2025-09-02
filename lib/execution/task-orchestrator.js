import chalk from 'chalk';
import pLimit from 'p-limit';
import { platformDetector } from '../platform/index.js';
import { VariableSubstitution } from './variable-substitution.js';
import { TaskStatusManager } from './task-status-manager.js';
import { EXECUTION_CONFIG } from '../config/constants.js';

/**
 * TaskOrchestrator handles task execution coordination and dependency management
 * Separated from Runner for Single Responsibility Principle
 */
export class TaskOrchestrator {
  constructor(outputManager, commandExecutor, internalFunctionRegistry, state, fileWatcher, options = {}) {
    this.outputManager = outputManager;
    this.commandExecutor = commandExecutor;
    this.internalFunctionRegistry = internalFunctionRegistry;
    this.state = state;
    this.fileWatcher = fileWatcher;
    this.maxJobs = options.maxJobs || EXECUTION_CONFIG.DEFAULT_PARALLEL_JOBS;
    this.quiet = options.quiet || false;
    this.force = options.force || false;
    this.statusManager = new TaskStatusManager();
  }

  /**
   * Execute tasks according to execution plan
   * @param {Array} executionPlan - Array of task instances to execute
   * @param {Array} taskCalls - Original task calls for logging
   * @returns {Object} - Execution result with success/failure counts
   */
  async execute(executionPlan, taskCalls) {
    const startTime = Date.now();
    
    if (executionPlan.length === 0) {
      this.outputManager.log('No tasks to execute', chalk.yellow);
      return { success: true, completed: 0, failed: 0 };
    }
    
    if (!this.quiet) {
      console.log(chalk.green('→'), `Executing tasks: ${taskCalls.map(t => t.taskName).join(', ')}`);
      console.log(chalk.green('→'), `Executing ${executionPlan.length} task instance(s) with max ${this.maxJobs} parallel job(s)`);
      console.log();
    }
    
    // Create a concurrency limiter
    const limit = pLimit(this.maxJobs);
    const serialLimit = pLimit(EXECUTION_CONFIG.SINGLE_JOB_LIMIT);
    
    // Track task promises
    const taskPromises = new Map();
    
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
   * Execute a single task instance with dependency and cache management
   * @param {Object} taskInstance - Task instance to execute
   * @param {Map} taskPromises - Map of task promises for dependency coordination
   * @param {Function} limit - Parallel execution limiter
   * @param {Function} serialLimit - Serial execution limiter
   */
  async executeTaskInstance(taskInstance, taskPromises, limit, serialLimit) {
    const { task, parameters, signature } = taskInstance;
    
    // Wait for dependencies
    for (const depName of task.dependencies) {
      const depParams = task.dependencyParams[depName] || [];
      const resolvedParams = depParams.map(param => {
        if (param.type === 'variable') {
          const paramIndex = task.parameters.indexOf(param.name);
          return paramIndex >= 0 ? parameters[paramIndex] : param.name;
        } else {
          return param.value;
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
    if (!task.isAlways && !this.force && await this.state.isTaskDone(taskInstance.id)) {
      // Check if task has watched files that are newer than cache
      if (task.hasWatchedFiles()) {
        const cacheTimestamp = await this.state.getTaskTimestamp(taskInstance.id);
        const filesNewer = await this.fileWatcher.areFilesNewer(task.watchedFiles, cacheTimestamp);
        
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
    const limiter = task.isSerial ? serialLimit : limit;
    
    // Execute task with concurrency control
    return limiter(async () => {
      this.outputManager.startTask(taskInstance.id, signature);
      this.statusManager.startTask(taskInstance.id);
      
      try {
        // Set up variables for this task instance
        const taskCopy = this.prepareTaskVariables(task, parameters);
        
        // Pre-export task parameters to shell for cooperative control system (v0.8.2)
        const preExportCommands = this.buildPreExportCommands(task, parameters);
        
        // Execute commands
        if (this.hasInternalFunctions(taskCopy.content)) {
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
          for (const command of taskCopy.content) {
            if (this.isAssignmentCommand(command)) {
              await this.handleAssignment(command, taskCopy.variables);
            } else {
              // Regular command with variable substitution
              const substitutedCommand = this.substituteVariables(command, taskCopy.variables);
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
        this.outputManager.completeTask(taskInstance.id, false, error.message);
        this.statusManager.failTask(taskInstance.id, error.message);
      }
    });
  }

  /**
   * Set up variables for task execution
   * @param {Object} task - Task definition
   * @param {Array} parameters - Task parameters
   * @returns {Object} - Task copy with variables set up
   */
  prepareTaskVariables(task, parameters) {
    const taskCopy = { ...task };
    taskCopy.variables = VariableSubstitution.setupTaskVariables(
      task, 
      parameters, 
      this.globalConstants, 
      this.globalVariables, 
      this.globalEnvironmentVariables
    );
    
    return taskCopy;
  }

  /**
   * Build pre-export commands for cooperative control system
   * @param {Object} task - Task definition  
   * @param {Array} parameters - Task parameters
   * @returns {Array} - Array of export commands
   */
  buildPreExportCommands(task, parameters) {
    return VariableSubstitution.buildPreExportCommands(task, parameters);
  }

  /**
   * Execute unified task content (with internal functions)
   * @param {Object} taskCopy - Task copy with variables
   * @param {string} signature - Task signature
   * @param {string} taskId - Task ID
   * @param {Array} preExportCommands - Pre-export commands
   * @returns {Promise<boolean>} - Success status
   */
  async executeUnifiedTaskContent(taskCopy, signature, taskId, preExportCommands) {
    // Combine pre-exports with task content into single execution block
    const fullContent = [
      ...preExportCommands,
      ...taskCopy.content
    ].join('\n');
    
    // Process through ShellContentManager (comments, proxies, etc.)
    const executionContext = this.shellContentManager.process(fullContent);
    
    // Execute as single unit
    return this.commandExecutor.executePreparedCommand(executionContext, signature, taskId);
  }

  /**
   * Check if task has internal functions
   * @param {Array} content - Task content commands
   * @returns {boolean} - True if has internal functions
   */
  hasInternalFunctions(content) {
    const functionNames = this.internalFunctionRegistry.getFunctionNames();
    
    for (const funcName of functionNames) {
      for (const command of content) {
        if (command.includes(`__${funcName}`)) {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Check if command is variable assignment
   * @param {string} command - Command to check
   * @returns {boolean} - True if assignment command
   */
  isAssignmentCommand(command) {
    return VariableSubstitution.isAssignmentCommand(command);
  }

  /**
   * Handle variable assignment command
   * @param {string} command - Assignment command
   * @param {Map} variables - Variables map
   */
  async handleAssignment(command, variables) {
    if (command.startsWith('_assign ')) {
      return VariableSubstitution.handleAssignment(command, variables);
    } else {
      return VariableSubstitution.handleGenericAssignment(command, variables);
    }
  }

  /**
   * Substitute variables in command string
   * @param {string} command - Command with variables
   * @param {Map} variables - Variables map
   * @returns {string} - Command with substituted variables
   */
  substituteVariables(command, variables) {
    return VariableSubstitution.substituteVariables(command, variables);
  }

  /**
   * Log task message with color
   * @param {string} taskName - Task name
   * @param {string} message - Message
   * @param {Function} messageColor - Chalk color function
   */
  logTask(taskName, message, messageColor = chalk.white) {
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
   * @param {number} startTime - Start time
   */
  printSummary(startTime) {
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
   * @param {Object} func - Internal function object
   * @param {Map} variables - Variables map
   * @param {string} signature - Task signature
   * @param {Map} taskPromises - Task promises map
   * @param {Function} limit - Parallel limiter
   * @param {Function} serialLimit - Serial limiter
   */
  async executeInternalFunction(func, variables, signature, taskPromises, limit, serialLimit) {
    // This will be passed as a callback from Runner
    if (this.executeInternalFunctionCallback) {
      return this.executeInternalFunctionCallback(func, variables, signature, taskPromises, limit, serialLimit);
    }
    throw new Error('executeInternalFunction callback not provided');
  }

  /**
   * Set global variables for tasks
   * @param {Map} globalVariables - Global variables
   * @param {Map} globalConstants - Global constants
   * @param {Map} globalEnvironmentVariables - Global environment variables
   */
  setGlobalVariables(globalVariables, globalConstants, globalEnvironmentVariables) {
    this.globalVariables = globalVariables;
    this.globalConstants = globalConstants;
    this.globalEnvironmentVariables = globalEnvironmentVariables;
  }

  /**
   * Set task colors for display
   * @param {Map} taskColors - Task color mapping
   */
  setTaskColors(taskColors) {
    this.taskColors = taskColors;
  }

  /**
   * Set shell content manager
   * @param {Object} shellContentManager - Shell content manager instance
   */
  setShellContentManager(shellContentManager) {
    this.shellContentManager = shellContentManager;
  }
}