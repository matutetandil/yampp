import { Worker } from 'worker_threads';
import chalk from 'chalk';
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
import { VariableSubstitution } from './execution/variable-substitution.js';
import { RunnerConfig } from './config/runner-config.js';
import os from 'os';
import { writeFileSync } from 'fs';

export class Runner {
  constructor(dependencies) {
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
    
    // Create circular dependencies
    this.internalFunctionRegistry = dependencies.createInternalFunctionRegistry(this);
    this.shellContentManager = dependencies.createShellContentManager();
    this.commandExecutor = dependencies.createCommandExecutor(this.executeInternalFunction.bind(this));
    this.taskOrchestrator = dependencies.createTaskOrchestrator();
    
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
    this.failed = new Set();
    this.running = new Map();
    this.taskColors = this.assignColors();
    
    // Configure TaskOrchestrator with dependencies
    this.taskOrchestrator.setGlobalVariables(this.globalVariables, this.globalConstants, this.globalEnvironmentVariables);
    this.taskOrchestrator.setTaskColors(this.taskColors);
    this.taskOrchestrator.setShellContentManager(this.shellContentManager);
  }
  
  assignColors() {
    const colors = [
      chalk.cyan,
      chalk.green,
      chalk.yellow,
      chalk.blue,
      chalk.magenta,
      chalk.cyanBright,
      chalk.greenBright,
      chalk.yellowBright,
      chalk.blueBright,
      chalk.magentaBright
    ];
    
    const colorMap = new Map();
    let colorIndex = 0;
    
    for (const [name] of this.tasks) {
      colorMap.set(name, colors[colorIndex % colors.length]);
      colorIndex++;
    }
    
    return colorMap;
  }

  hasModifier(task, modifier) {
    return task.modifiers && task.modifiers.has && task.modifiers.has(modifier);
  }

  getWatches(task) {
    return Array.isArray(task.watches) ? task.watches : [];
  }
  
  async execute(taskCalls) {
    try {
      // Build execution plan with parameters
      const executionPlan = await this.buildExecutionPlan(taskCalls);
      
      // Delegate to TaskOrchestrator
      return this.taskOrchestrator.execute(executionPlan, taskCalls);
      
    } catch (error) {
      this.outputManager.error(`Execution error: ${error.message}`);
      return {
        success: false,
        completed: this.completed.size,
        failed: this.failed.size
      };
    }
  }
  
  async buildExecutionPlan(taskCalls) {
    const plan = [];
    const visited = new Set();
    const processing = new Set();
    
    for (const taskCall of taskCalls) {
      await this.collectTaskInstances(taskCall.taskName, taskCall.parameters, plan, visited, processing);
    }
    
    return plan;
  }
  
  async collectTaskInstances(taskName, parameters, plan, visited, processing) {
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
    
    // Process dependencies first
    for (const depName of task.dependencies) {
      const depParams = task.dependencyParams[depName] || [];
      
      // Resolve parameter references with new syntax
      const resolvedParams = depParams.map(param => {
        if (param.type === 'variable') {
          // Variable reference: look up in task parameters
          const paramIndex = task.parameters.indexOf(param.name);
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
    
    // Add this task instance
    const taskInstance = {
      id: instanceId,
      taskName,
      task,
      parameters,
      signature: parameters.length > 0 ? `${taskName}(${parameters.join(', ')})` : taskName
    };
    
    plan.push(taskInstance);
    visited.add(instanceId);
    processing.delete(instanceId);
  }
  
  
  
  /**
   * Check if task needs unified processing (has internal functions or comments)
   * @param {Task} task - Task to check
   * @returns {boolean} - True if unified processing needed
   */
  taskNeedsUnifiedProcessing(task) {
    // If task has internal functions, it needs unified processing
    if (task.internalFunctions && task.internalFunctions.length > 0) {
      return true;
    }
    
    // Also check if regular commands need processing (comments, etc.)
    const fullContent = task.commands.join('\n');
    return this.shellContentManager.needsProcessing(fullContent);
  }

  /**
   * Execute task commands as unified block with cooperative control
   * @param {Task} task - Task to execute
   * @param {string} signature - Task signature
   * @param {string} taskId - Task instance ID
   * @param {Map} variables - Task variables
   * @returns {Promise<boolean>} - Success result
   */
  async executeUnifiedTaskBlock(task, signature, taskId, variables, taskInstance) {
    // Reconstruct the original task block by combining internal functions and commands
    const allLines = [];
    
    // Add internal functions as __function calls (reconstruct original syntax)
    if (task.internalFunctions) {
      for (const func of task.internalFunctions) {
        
        const params = func.params.map(param => {
          if (typeof param === 'object' && param.value !== undefined) {
            return param.type === 'string' ? `"${param.value}"` : param.value;
          }
          return param;
        }).join(' ');
        
        allLines.push(`__${func.name} ${params}`);
      }
    }
    
    // Add regular commands
    allLines.push(...task.commands);
    
    // Combine into single block
    let fullContent = allLines.join('\n');
    
    // For task parameters in unified blocks, we need to pre-export them to bash
    // so they're available from the start of script execution
    const preExportCommands = [];
    // For parametrized tasks, extract parameter names from signature and export values
    if (taskInstance?.parameters && taskInstance.parameters.length > 0 && signature.includes('(')) {
      // Extract parameter names from signature like "manolo(TestValue)" -> ["TestValue"]
      // But we need the parameter names, not values. Let's get them from the task definition.
      // For now, use common parameter names based on position
      const commonParamNames = ['name', 'text', 'value', 'input', 'arg1', 'arg2', 'arg3'];
      
      for (let i = 0; i < taskInstance.parameters.length; i++) {
        const paramName = task.params?.[i] || commonParamNames[i] || `param${i + 1}`;
        const paramValue = taskInstance.parameters[i];
        // Escape single quotes for bash safety
        const escapedValue = String(paramValue).replace(/'/g, "'\"'\"'");
        preExportCommands.push(`export ${paramName}='${escapedValue}'`);
      }
    }
    
    // Prepend export commands to the script
    if (preExportCommands.length > 0) {
      fullContent = preExportCommands.join('\n') + '\n' + fullContent;
    }
    
    // Process through ShellContentManager (comments, proxies, etc.)
    const executionContext = this.shellContentManager.process(fullContent);
    
    // Execute as single unit
    return this.commandExecutor.executePreparedCommand(executionContext, signature, taskId);
  }


  

  logTask(taskName, message, messageColor = chalk.white) {
    const color = this.taskColors.get(taskName) || chalk.white;
    const prefix = color(`[${taskName}]`);
    console.log(prefix, messageColor(message));
  }
  
  listTasks() {
    if (this.quiet) return;
    
    console.log(chalk.green.bold('Available tasks:'));
    console.log();
    
    for (const [name, task] of this.tasks) {
      let line = `  ${chalk.bold(name)}`;
      
      if (task.modifiers.size > 0) {
        line += chalk.yellow(` [${Array.from(task.modifiers).join(', ')}]`);
      }
      
      if (task.dependencies.length > 0) {
        line += chalk.cyan(` needs ${task.dependencies.join(', ')}`);
      }
      
      console.log(line);
      
      if (this.verbose && task.commands.length > 0) {
        for (const cmd of task.commands.slice(0, 3)) {
          const display = cmd.length > 50 ? cmd.substring(0, 47) + '...' : cmd;
          console.log(chalk.gray(`    → ${display}`));
        }
        if (task.commands.length > 3) {
          console.log(chalk.gray(`    → ... ${task.commands.length - 3} more`));
        }
      }
    }
  }
  
  showGraph(taskName, format = 'text') {
    if (this.quiet) return;
    
    const validFormats = ['text', 'dot', 'json'];
    if (!validFormats.includes(format)) {
      console.error(chalk.red(`Invalid graph format '${format}'. Valid formats: ${validFormats.join(', ')}`));
      return;
    }
    
    switch (format) {
      case 'dot':
        console.log(this.graph.toDotFormat());
        break;
      case 'json':
        console.log(JSON.stringify(this.graph.toJSON(), null, 2));
        break;
      case 'text':
      default:
        console.log(chalk.green.bold('Task dependency graph:'));
        console.log();
        
        if (taskName) {
          const task = this.tasks.get(taskName);
          if (!task) {
            console.error(chalk.red(`Task '${taskName}' not found`));
            return;
          }
          
          const allDeps = this.graph.getAllDependencies(taskName);
          console.log(chalk.bold(`Dependencies for '${taskName}':`));
          
          if (allDeps.length === 0) {
            console.log(chalk.gray('  (no dependencies)'));
          } else {
            for (const dep of allDeps) {
              console.log(`  → ${dep}`);
            }
          }
        } else {
          console.log(this.graph.getGraphVisualization());
        }
        break;
    }
  }
  
  async clean() {
    await this.state.cleanAll();
  }
  
  
  async executeCall(call, variables, taskPromises, limit, serialLimit) {
    // Resolve parameters for the call
    const resolvedParams = call.params.map(param => {
      if (param.type === 'variable') {
        const value = variables.get(param.name);
        if (value === undefined) {
          throw new Error(`Variable '$${param.name}' is not defined`);
        }
        return value;
      } else {
        return VariableSubstitution.substituteVariables(param.value, variables);
      }
    });
    
    // Create a task instance for the called task
    const calledTask = this.tasks.get(call.taskName);
    if (!calledTask) {
      throw new Error(`Task '${call.taskName}' not found for __call`);
    }
    
    const callId = `${call.taskName}(${resolvedParams.join(',')})`;
    
    // Check if this call is already running or completed
    if (taskPromises.has(callId) || this.completed.has(callId)) {
      // If already running, wait for it
      if (taskPromises.has(callId)) {
        await taskPromises.get(callId);
      }
      return;
    }
    
    // Create and execute the called task instance
    const taskInstance = {
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

  async dryRun(taskCalls) {
    console.log(chalk.blue.bold('🔍 Enhanced Dry Run Analysis'));
    console.log();
    
    try {
      // Build execution plan
      const executionPlan = await this.buildExecutionPlan(taskCalls);
      
      if (executionPlan.length === 0) {
        console.log(chalk.yellow('No tasks to execute'));
        return;
      }
      
      // Analyze execution
      const analysis = await this.analyzeDryRun(executionPlan);
      
      // Summary
      console.log(chalk.green.bold('📊 Execution Summary:'));
      console.log(`  Tasks requested: ${chalk.cyan(taskCalls.map(t => t.taskName).join(', '))}`);
      console.log(`  Total task instances: ${chalk.cyan(executionPlan.length)}`);
      console.log(`  Would execute: ${chalk.green(analysis.willExecute)} ${chalk.gray('|')} Cached: ${chalk.yellow(analysis.cached)}`);
      console.log(`  Max parallelism: ${chalk.cyan(this.maxJobs)} jobs`);
      console.log(`  Estimated duration: ${chalk.cyan(analysis.estimatedTime)}`);
      console.log();
      
      // Show what would be executed for each task
      for (const taskInstance of executionPlan) {
        const color = this.taskColors.get(taskInstance.taskName) || chalk.white;
        const prefix = color(`[${taskInstance.signature}]`);
        
        console.log(`${prefix} Would execute:`);
        
        // Check if task needs to run (file watching, cache, etc.)
        const needsRun = await this.shouldTaskRun(taskInstance);
        if (!needsRun) {
          console.log(`${prefix} ${chalk.gray('→ Skipped (cached)')}`);
          console.log();
          continue;
        }
        
        // Show inputs that would be prompted
        if (taskInstance.task.inputs && taskInstance.task.inputs.length > 0) {
          for (const input of taskInstance.task.inputs) {
            const defaultText = input.defaultValue ? ` (default: ${input.defaultValue})` : '';
            if (input.type === 'select') {
              console.log(`${prefix} ${chalk.gray(`→ Prompt [${input.type}]: "${input.prompt}" → ${input.variable}${defaultText}`)}`);
              console.log(`${prefix} ${chalk.gray(`  Options: ${input.options.join(', ')}`)}`);
            } else {
              console.log(`${prefix} ${chalk.gray(`→ Prompt [${input.type}]: "${input.prompt}" → ${input.variable}${defaultText}`)}`);
            }
          }
        }
        
        // Show commands that would run
        for (let i = 0; i < taskInstance.task.commands.length; i++) {
          const command = taskInstance.task.commands[i];
          if (typeof command === 'string') {
            // Simple string command
            console.log(`${prefix} ${chalk.gray(`→ ${command}`)}`);
          } else if (command.type === 'set_var') {
            console.log(`${prefix} ${chalk.gray(`→ Set $${command.name} = "${command.value}"`)}`);
          } else if (command.type === 'call') {
            console.log(`${prefix} ${chalk.gray(`→ Call ${command.taskName}(${command.params.join(', ')})`)}`);
          } else {
            console.log(`${prefix} ${chalk.gray(`→ ${command.command || command}`)}`);
          }
        }
        console.log();
      }
      
    } catch (error) {
      console.error(chalk.red.bold('Error in dry run:'), error.message);
      throw error;
    }
  }

  async showPlan(taskCalls) {
    console.log(chalk.blue.bold('📋 Execution Plan'));
    console.log();
    
    try {
      // Build execution plan
      const executionPlan = await this.buildExecutionPlan(taskCalls);
      
      if (executionPlan.length === 0) {
        console.log(chalk.yellow('No tasks to execute'));
        return;
      }
      
      // Show plan summary
      console.log(chalk.green('Plan Summary:'));
      console.log(`  Tasks to run: ${taskCalls.map(t => t.taskName).join(', ')}`);
      console.log(`  Total task instances: ${executionPlan.length}`);
      console.log(`  Max parallel jobs: ${this.maxJobs}`);
      console.log();
      
      // Analyze dependencies
      const dependencies = new Map();
      for (const taskInstance of executionPlan) {
        const deps = this.graph.getDependencies(taskInstance.taskName);
        dependencies.set(taskInstance.signature, deps);
      }
      
      // Show execution order and dependencies
      console.log(chalk.green('Execution Plan:'));
      for (let i = 0; i < executionPlan.length; i++) {
        const taskInstance = executionPlan[i];
        const color = this.taskColors.get(taskInstance.taskName) || chalk.white;
        const deps = dependencies.get(taskInstance.signature);
        
        const status = await this.shouldTaskRun(taskInstance) ? 
          chalk.green('⚡ Run') : chalk.gray('⏭ Skip (cached)');
        
        console.log(`  ${i + 1}. ${color(taskInstance.signature)} ${status}`);
        
        if (deps.length > 0) {
          console.log(`     ${chalk.gray(`Dependencies: ${deps.join(', ')}`)}`);
        }
        
        if (this.hasModifier(taskInstance.task, 'serial')) {
          console.log(`     ${chalk.yellow('⚠ Serial execution (no parallelism)')}`);
        }
        
        if (this.hasModifier(taskInstance.task, 'always')) {
          console.log(`     ${chalk.blue('🔄 Always run (ignores cache)')}`);
        }
        
        if (this.hasModifier(taskInstance.task, 'critical')) {
          console.log(`     ${chalk.red('🚨 Critical (failure stops all)')}`);
        }
        
        const watches = this.getWatches(taskInstance.task);
        if (watches.length > 0) {
          console.log(`     ${chalk.cyan(`Watches: ${watches.join(', ')}`)}`);
        }
        
        if (taskInstance.task.inputs && taskInstance.task.inputs.length > 0) {
          console.log(`     ${chalk.magenta(`🎯 Interactive: ${taskInstance.task.inputs.length} input prompt(s)`)}`);
        }
      }
      
      console.log();
      console.log(chalk.gray('Use --dry-run to see the actual commands that would be executed'));
      
    } catch (error) {
      console.error(chalk.red.bold('Error creating plan:'), error.message);
      throw error;
    }
  }

  async shouldTaskRun(taskInstance) {
    // Always run if 'always' modifier
    if (this.hasModifier(taskInstance.task, 'always')) {
      return true;
    }
    
    // Check cache
    if (!this.force && await this.state.isTaskDone(taskInstance.id)) {
      // Check file watching if applicable
      const watches = this.getWatches(taskInstance.task);
      if (watches.length > 0) {
        const cacheTime = await this.state.getTaskTimestamp(taskInstance.id);
        const hasChanges = await this.fileWatcher.hasChanges(watches, cacheTime);
        return hasChanges;
      }
      return false; // Cached and no file watching
    }
    
    return true; // Not cached, needs to run
  }

  /**
   * Execute internal function using Strategy pattern
   * This method replaces the large switch/case with a clean delegation to the registry
   */
  async executeInternalFunction(func, variables, signature, taskPromises, limit, serialLimit) {
    // Delegate to the registry using Strategy pattern
    return await this.internalFunctionRegistry.execute(
      func, 
      variables, 
      signature, 
      taskPromises, 
      limit, 
      serialLimit
    );
  }

  /**
   * Register a new internal function handler (for plugins)
   * @param {BaseFunction} functionHandler - The function handler to register
   */
  registerInternalFunction(functionHandler) {
    this.internalFunctionRegistry.register(functionHandler);
  }

  /**
   * Unregister an internal function handler (for plugins)
   * @param {string} functionName - The name of the function to unregister
   */
  unregisterInternalFunction(functionName) {
    return this.internalFunctionRegistry.unregister(functionName);
  }

  /**
   * Get list of available internal functions
   * @returns {string[]} - Array of function names
   */
  getAvailableInternalFunctions() {
    return this.internalFunctionRegistry.getRegisteredFunctions();
  }
  
  async analyzeDryRun(executionPlan) {
    let willExecute = 0;
    let cached = 0;
    let totalCommands = 0;
    const platforms = new Set();
    const modifiers = new Set();
    
    for (const taskInstance of executionPlan) {
      const needsRun = await this.shouldTaskRun(taskInstance);
      
      if (needsRun) {
        willExecute++;
        totalCommands += taskInstance.task.commands.length;
      } else {
        cached++;
      }
      
      // Collect metadata
      if (taskInstance.task.platforms) {
        taskInstance.task.platforms.forEach(p => platforms.add(p));
      }
      taskInstance.task.modifiers.forEach(m => modifiers.add(m));
    }
    
    // Estimate execution time (very rough)
    const avgCommandTime = 0.5; // seconds per command
    const parallelEfficiency = Math.min(this.maxJobs, willExecute) / willExecute || 1;
    const estimatedSeconds = (totalCommands * avgCommandTime) / parallelEfficiency;
    
    const formatTime = (seconds) => {
      if (seconds < 1) return '<1s';
      if (seconds < 60) return `${Math.round(seconds)}s`;
      if (seconds < 3600) return `${Math.round(seconds / 60)}m ${Math.round(seconds % 60)}s`;
      return `${Math.round(seconds / 3600)}h ${Math.round((seconds % 3600) / 60)}m`;
    };
    
    return {
      willExecute,
      cached,
      totalCommands,
      platforms: Array.from(platforms),
      modifiers: Array.from(modifiers),
      estimatedTime: formatTime(estimatedSeconds)
    };
  }

  async watch(taskCalls) {
    if (!this.quiet) {
      console.log(chalk.cyan.bold('🔍 Watch Mode'), 'Monitoring files for changes...');
      console.log(chalk.gray('Press Ctrl+C twice to exit watch mode\n'));
    }

    // Setup graceful exit handler for Ctrl+C
    let ctrlCCount = 0;
    let ctrlCTimeout = null;
    
    const exitHandler = () => {
      ctrlCCount++;
      
      if (ctrlCCount === 1) {
        console.log(chalk.yellow('\n⚠️  Press Ctrl+C again within 2 seconds to exit watch mode'));
        ctrlCTimeout = setTimeout(() => {
          ctrlCCount = 0;
        }, 2000);
      } else if (ctrlCCount >= 2) {
        if (ctrlCTimeout) clearTimeout(ctrlCTimeout);
        console.log(chalk.red('\n🛑 Exiting watch mode...'));
        process.exit(0);
      }
    };

    process.on('SIGINT', exitHandler);

    // Initial execution
    if (!this.quiet) {
      console.log(chalk.blue('⚡ Initial execution'));
    }
    await this.execute(taskCalls);

    // Get all tasks that need to be monitored
    const watchedPatterns = new Set();
    const executionPlan = await this.buildExecutionPlan(taskCalls);
    
    for (const taskInstance of executionPlan) {
      const task = this.tasks.get(taskInstance.taskName);
      if (task && task.hasWatchedFiles()) {
        for (const pattern of task.watchedFiles) {
          watchedPatterns.add(pattern);
        }
      }
    }

    if (watchedPatterns.size === 0) {
      console.log(chalk.yellow('⚠️  No watched files found in tasks. Watch mode will monitor general file changes.'));
    } else {
      if (!this.quiet) {
        console.log(chalk.gray(`👀 Watching patterns: ${Array.from(watchedPatterns).join(', ')}`));
      }
    }

    // Store current state
    let lastExecutionTime = Date.now();
    const watchPatterns = Array.from(watchedPatterns);
    
    // Continuous monitoring loop
    while (true) {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Check every second

        // Check for file changes
        let hasChanges = false;
        
        if (watchPatterns.length > 0) {
          // Check specific watched patterns
          hasChanges = await this.fileWatcher.areFilesNewer(watchPatterns, lastExecutionTime);
        } else {
          // Fallback: check common patterns if no specific watches
          const commonPatterns = ['**/*.js', '**/*.ts', '**/*.json', '**/*.yml', '**/*.yaml', '**/*.md'];
          hasChanges = await this.fileWatcher.areFilesNewer(commonPatterns, lastExecutionTime);
        }

        if (hasChanges) {
          lastExecutionTime = Date.now();
          
          if (!this.quiet) {
            console.log(chalk.green('\n🔄 File changes detected, re-executing tasks...\n'));
          }

          // Re-execute the tasks
          const result = await this.execute(taskCalls);
          
          if (!this.quiet) {
            if (result.success) {
              console.log(chalk.green('✅ Re-execution completed successfully'));
            } else {
              console.log(chalk.red('❌ Re-execution failed'));
            }
            console.log(chalk.gray('Continuing to watch for changes...\n'));
          }
        }
      } catch (error) {
        if (!this.quiet) {
          console.error(chalk.red('Watch error:'), error.message);
          console.log(chalk.gray('Continuing to watch...\n'));
        }
      }
    }

    // Cleanup (this will never be reached in normal operation)
    process.removeListener('SIGINT', exitHandler);
  }
}