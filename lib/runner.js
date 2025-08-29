import { spawn } from 'child_process';
import { Worker } from 'worker_threads';
import chalk from 'chalk';
import pLimit from 'p-limit';
import { TaskGraph } from './task.js';
import { StateManager } from './state.js';
import { FileWatcher } from './file-watcher.js';
import { ClaudeOutputManager } from './claude-output-manager.js';
import { InputManager } from './input-manager.js';
import { InternalFunctionRegistry } from './internal-functions/registry.js';
import { platformDetector } from './platform/index.js';
import os from 'os';

export class Runner {
  constructor(tasks, globalVariables = new Map(), globalConstants = new Map(), globalEnvironmentVariables = new Map(), options = {}) {
    this.tasks = tasks;
    this.globalVariables = globalVariables;
    this.globalConstants = globalConstants;
    this.globalEnvironmentVariables = globalEnvironmentVariables;
    this.graph = new TaskGraph(tasks);
    this.state = new StateManager();
    this.fileWatcher = new FileWatcher();
    this.outputManager = new ClaudeOutputManager({
      verbose: options.verbose,
      quiet: options.quiet,
      ugly: options.ugly,
      verboseUgly: options.verboseUgly
    });
    this.inputManager = new InputManager({
      overrides: options.inputOverrides || new Map(),
      dryRun: options.dryRun,
      plan: options.plan
    });
    this.internalFunctionRegistry = new InternalFunctionRegistry(this);
    this.maxJobs = options.maxJobs || os.cpus().length;
    this.verbose = options.verbose || false;
    this.quiet = options.quiet || false;
    this.ugly = options.ugly || false;
    this.verboseUgly = options.verboseUgly || false;
    this.dryRunMode = options.dryRun || false;
    this.plan = options.plan || false;
    this.completed = new Set();
    this.failed = new Set();
    this.running = new Map();
    this.taskColors = this.assignColors();
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
    const startTime = Date.now();
    
    try {
      // Build execution plan with parameters
      const executionPlan = await this.buildExecutionPlan(taskCalls);
      
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
      const serialLimit = pLimit(1);
      
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
      
      return {
        success: this.failed.size === 0,
        completed: this.completed.size,
        failed: this.failed.size
      };
      
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
        if (this.failed.has(depId)) {
          if (!this.quiet) {
            this.logTask(signature, `Skipped (dependency '${depId}' failed)`, chalk.gray);
          }
          this.failed.add(taskInstance.id);
          return;
        }
      }
    }
    
    // Check cache and file dependencies (use signature for cache key)
    if (!task.isAlways && await this.state.isTaskDone(taskInstance.id)) {
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
          this.completed.add(taskInstance.id);
          return;
        }
      } else {
        if (!this.quiet) {
          this.logTask(signature, 'Cached', chalk.gray);
        }
        this.completed.add(taskInstance.id);
        return;
      }
    }
    
    // Choose limiter based on serial modifier
    const limiter = task.isSerial ? serialLimit : limit;
    
    // Execute task with concurrency control
    return limiter(async () => {
      this.outputManager.startTask(taskInstance.id, signature);
      this.running.set(taskInstance.id, Date.now());
      
      try {
        // Set up variables for this task instance
        const taskCopy = { ...task };
        taskCopy.variables = new Map();
        
        // Add global variables and constants
        for (const [name, value] of this.globalConstants) {
          taskCopy.variables.set(name, value);
        }
        for (const [name, value] of this.globalVariables) {
          taskCopy.variables.set(name, value);
        }
        for (const [name, value] of this.globalEnvironmentVariables) {
          taskCopy.variables.set(name, value);
        }
        
        // Add local constants and variables (override globals if same name)
        for (const [name, value] of task.localConstants) {
          taskCopy.variables.set(name, value);
        }
        for (const [name, value] of task.localVariables) {
          taskCopy.variables.set(name, value);
        }
        for (const [name, value] of task.localEnvironmentVariables) {
          taskCopy.variables.set(name, value);
        }
        
        // Set parameter variables (override everything if same name)
        for (let i = 0; i < task.parameters.length; i++) {
          taskCopy.variables.set(task.parameters[i], parameters[i]);
        }
        
        // Process input prompts first (only in serial tasks)
        if (task.inputs && task.inputs.length > 0) {
          for (const input of task.inputs) {
            const value = await this.inputManager.getInput(
              input.type,
              input.prompt,
              input.variable,
              input.defaultValue,
              input.options
            );
            taskCopy.variables.set(input.variable, value);
          }
        }
        
        // Execute commands  
        for (const command of task.commands) {
          if (command.startsWith('_assign ')) {
            // Handle variable assignment
            await this.handleAssignment(command, taskCopy.variables);
          } else {
            // Regular command with variable substitution
            const substitutedCommand = this.substituteVariables(command, taskCopy.variables);
            const success = await this.executeCommand(substitutedCommand, signature, taskInstance.id);
            
            if (!success) {
              throw new Error(`Command failed: ${substitutedCommand}`);
            }
          }
        }
        
        // Execute internal functions using Strategy pattern
        if (task.internalFunctions && task.internalFunctions.length > 0) {
          for (const func of task.internalFunctions) {
            await this.executeInternalFunction(func, taskCopy.variables, signature, taskPromises, limit, serialLimit);
          }
        }
        
        // Mark as completed
        this.completed.add(taskInstance.id);
        this.running.delete(taskInstance.id);
        
        // Update cache
        if (!task.isAlways) {
          await this.state.markTaskDone(taskInstance.id);
        }
        
        this.outputManager.completeTask(taskInstance.id, true);
        
      } catch (error) {
        // Store detailed error information for summary
        const errorInfo = {
          taskId: taskInstance.id,
          taskName: signature,
          error: error.message
        };
        
        this.failed.add(errorInfo);
        this.running.delete(taskInstance.id);
        
        this.outputManager.completeTask(taskInstance.id, false);
        
        if (task.isCritical) {
          console.error(chalk.red.bold(`\nCritical task '${signature}' failed. Aborting execution.`));
          process.exit(1);
        }
      }
    });
  }
  
  substituteVariables(command, variables) {
    let result = command;
    
    // Replace $variable with actual values
    for (const [name, value] of variables) {
      const regex = new RegExp(`\\$${name}\\b`, 'g');
      result = result.replace(regex, value);
    }
    
    return result;
  }
  
  executeCommand(command, taskName, taskId) {
    return new Promise(async (resolve) => {
      // Get state manager and proxy manager
      const stateManager = platformDetector.currentPlatform.getStateManager();
      const proxyManager = platformDetector.currentPlatform.getShellProxyManager(this.internalFunctionRegistry);
      
      // Check if command needs proxy injection
      let executionContext;
      if (proxyManager.needsProxyInjection(command)) {
        // Use cooperative control with proxy functions
        executionContext = proxyManager.prepareCommandWithProxies(command);
      } else {
        // Use traditional execution without proxies
        executionContext = platformDetector.currentPlatform.prepareShellCommand(command);
        executionContext.hasProxies = false;
      }
      
      const { shell, args, processedCommand, hasProxies } = executionContext;
      
      const child = spawn(shell, args, {
        env: { ...process.env },
        stdio: ['ignore', 'pipe', 'pipe']  // Ignore stdin, pipe stdout and stderr
      });
      
      let stderrOutput = '';
      
      child.stdout.on('data', (data) => {
        const lines = data.toString().split('\n');
        for (const line of lines) {
          if (line.trim()) {  // Only log non-empty lines
            this.outputManager.addOutput(taskId, line, false);
          }
        }
      });
      
      child.stderr.on('data', (data) => {
        const dataString = data.toString();
        stderrOutput += dataString;
        
        if (hasProxies) {
          // Process intercept messages from proxy functions
          this.processInterceptMessages(dataString, proxyManager, stateManager, child.pid, taskId);
        }
        
        // Log stderr (but filter out intercept messages for cleaner output)
        const lines = dataString.split('\n');
        for (const line of lines) {
          if (line.trim() && !line.includes('YAMPP_INTERCEPT:')) {
            this.outputManager.addOutput(taskId, line, true);
          }
        }
      });
      
      child.on('close', async (code) => {
        // With proxy system, we don't need fallback interception
        // Commands either succeed or fail naturally
        resolve(code === 0);
      });
      
      child.on('error', (error) => {
        this.outputManager.addOutput(taskId, `Error: ${error.message}`, true);
        resolve(false);
      });
    });
  }
  
  async processInterceptMessages(stderr, proxyManager, stateManager, processId, taskId) {
    // Parse intercept request from shell proxy
    const interceptRequest = proxyManager.parseInterceptRequest(stderr);
    
    if (!interceptRequest) {
      return; // No intercept message found
    }

    const { functionName, rawArgs } = interceptRequest;
    
    try {
      // Parse the arguments using platform strategy
      const parsedParams = platformDetector.currentPlatform.parseInternalFunctionParams(rawArgs);
      
      // Resolve parameter variables using state manager
      const resolvedParams = platformDetector.currentPlatform.resolveParameterVariables(parsedParams, stateManager);
      
      // Create internal function object
      const internalFunction = {
        name: functionName,
        params: resolvedParams
      };
      
      // Execute internal function with state context
      const taskContext = {
        variables: stateManager.getInternalVariables(),
        taskPromises: new Map(),
        limit: (fn) => fn(),
        serialLimit: (fn) => fn()
      };
      
      await this.executeInternalFunction(
        internalFunction, 
        taskContext.variables, 
        `proxy-${functionName}`, 
        taskContext.taskPromises, 
        taskContext.limit, 
        taskContext.serialLimit
      );
      
      // Sync variables back to state manager
      stateManager.syncToShell();
      
      // Send success response to shell
      await proxyManager.sendInterceptResponse(processId, true);
      
    } catch (error) {
      // Log error and send failure response
      this.outputManager.addOutput(taskId, `Internal function error: ${error.message}`, true);
      await proxyManager.sendInterceptResponse(processId, false);
    }
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
  
  showGraph(taskName) {
    if (this.quiet) return;
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
  }
  
  async clean() {
    await this.state.cleanAll();
  }
  
  printSummary(startTime) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    this.outputManager.printSummary(Array.from(this.completed), Array.from(this.failed), duration);
  }
  
  async handleAssignment(command, variables) {
    // Parse assignment: _assign varname = value
    const match = command.match(/^_assign\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+)$/);
    if (!match) {
      throw new Error(`Invalid assignment syntax: ${command}`);
    }
    
    const [, varName, value] = match;
    const substitutedValue = this.substituteVariables(value, variables);
    
    // Update the variable (only for vars, not consts)
    variables.set(varName, substitutedValue);
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
        return this.substituteVariables(param.value, variables);
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
    console.log(chalk.blue.bold('🔍 Dry Run Mode - No commands will be executed'));
    console.log();
    
    try {
      // Build execution plan
      const executionPlan = await this.buildExecutionPlan(taskCalls);
      
      if (executionPlan.length === 0) {
        console.log(chalk.yellow('No tasks to execute'));
        return;
      }
      
      console.log(chalk.green('→'), `Would execute tasks: ${taskCalls.map(t => t.taskName).join(', ')}`);
      console.log(chalk.green('→'), `Would execute ${executionPlan.length} task instance(s) with max ${this.maxJobs} parallel job(s)`);
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
    if (await this.state.isTaskDone(taskInstance.id)) {
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
}