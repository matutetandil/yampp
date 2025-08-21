import { spawn } from 'child_process';
import { Worker } from 'worker_threads';
import chalk from 'chalk';
import pLimit from 'p-limit';
import { TaskGraph } from './task.js';
import { StateManager } from './state.js';
import { FileWatcher } from './file-watcher.js';
import os from 'os';

export class Runner {
  constructor(tasks, globalVariables = new Map(), globalConstants = new Map(), options = {}) {
    this.tasks = tasks;
    this.globalVariables = globalVariables;
    this.globalConstants = globalConstants;
    this.graph = new TaskGraph(tasks);
    this.state = new StateManager();
    this.fileWatcher = new FileWatcher();
    this.maxJobs = options.maxJobs || os.cpus().length;
    this.verbose = options.verbose || false;
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
  
  async execute(taskCalls) {
    const startTime = Date.now();
    
    try {
      // Build execution plan with parameters
      const executionPlan = await this.buildExecutionPlan(taskCalls);
      
      if (executionPlan.length === 0) {
        console.log(chalk.yellow('No tasks to execute'));
        return { success: true, completed: 0, failed: 0 };
      }
      
      console.log(chalk.green('→'), `Executing ${executionPlan.length} task instance(s) with max ${this.maxJobs} parallel job(s)`);
      console.log();
      
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
      console.error(chalk.red.bold('Execution error:'), error.message);
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
          this.logTask(signature, `Skipped (dependency '${depId}' failed)`, chalk.gray);
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
          this.logTask(signature, 'Files changed, rebuilding', chalk.yellow);
        } else {
          this.logTask(signature, 'Cached (files up-to-date)', chalk.gray);
          this.completed.add(taskInstance.id);
          return;
        }
      } else {
        this.logTask(signature, 'Cached', chalk.gray);
        this.completed.add(taskInstance.id);
        return;
      }
    }
    
    // Choose limiter based on serial modifier
    const limiter = task.isSerial ? serialLimit : limit;
    
    // Execute task with concurrency control
    return limiter(async () => {
      this.logTask(signature, 'Starting', chalk.white);
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
        
        // Add local constants and variables (override globals if same name)
        for (const [name, value] of task.localConstants) {
          taskCopy.variables.set(name, value);
        }
        for (const [name, value] of task.localVariables) {
          taskCopy.variables.set(name, value);
        }
        
        // Set parameter variables (override everything if same name)
        for (let i = 0; i < task.parameters.length; i++) {
          taskCopy.variables.set(task.parameters[i], parameters[i]);
        }
        
        // Execute commands and _call statements
        for (const command of task.commands) {
          if (command.startsWith('_assign ')) {
            // Handle variable assignment
            await this.handleAssignment(command, taskCopy.variables);
          } else {
            // Regular command with variable substitution
            const substitutedCommand = this.substituteVariables(command, taskCopy.variables);
            const success = await this.executeCommand(substitutedCommand, signature);
            
            if (!success) {
              throw new Error(`Command failed: ${substitutedCommand}`);
            }
          }
        }
        
        // Execute _call statements
        for (const call of task.calls) {
          await this.executeCall(call, taskCopy.variables, taskPromises, limit, serialLimit);
        }
        
        // Mark as completed
        this.completed.add(taskInstance.id);
        this.running.delete(taskInstance.id);
        
        // Update cache
        if (!task.isAlways) {
          await this.state.markTaskDone(taskInstance.id);
        }
        
        this.logTask(signature, 'Completed', chalk.green);
        
      } catch (error) {
        this.failed.add(taskInstance.id);
        this.running.delete(taskInstance.id);
        
        this.logTask(signature, `Failed: ${error.message}`, chalk.red);
        
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
  
  executeCommand(command, taskName) {
    return new Promise((resolve) => {
      const child = spawn('sh', ['-c', command], {
        shell: true,
        env: { ...process.env }
      });
      
      child.stdout.on('data', (data) => {
        const lines = data.toString().split('\n').filter(Boolean);
        for (const line of lines) {
          this.logTask(taskName, line, chalk.white);
        }
      });
      
      child.stderr.on('data', (data) => {
        const lines = data.toString().split('\n').filter(Boolean);
        for (const line of lines) {
          this.logTask(taskName, line, chalk.redBright);
        }
      });
      
      child.on('close', (code) => {
        resolve(code === 0);
      });
      
      child.on('error', (error) => {
        this.logTask(taskName, `Error: ${error.message}`, chalk.red);
        resolve(false);
      });
    });
  }
  
  logTask(taskName, message, messageColor = chalk.white) {
    const color = this.taskColors.get(taskName) || chalk.white;
    const prefix = color(`[${taskName}]`);
    console.log(prefix, messageColor(message));
  }
  
  listTasks() {
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
    
    console.log();
    console.log(chalk.gray('─'.repeat(50)));
    console.log(chalk.green.bold('Execution Summary'));
    console.log(chalk.gray('─'.repeat(50)));
    
    if (this.completed.size > 0) {
      console.log(chalk.green('✔'), `Completed (${this.completed.size}):`);
      for (const task of this.completed) {
        console.log(`    ${chalk.green('•')} ${task}`);
      }
    }
    
    if (this.failed.size > 0) {
      console.log(chalk.red('✘'), `Failed (${this.failed.size}):`);
      for (const task of this.failed) {
        console.log(`    ${chalk.red('•')} ${task}`);
      }
    }
    
    const total = this.completed.size + this.failed.size;
    const successRate = total > 0 ? Math.round((this.completed.size / total) * 100) : 0;
    
    console.log();
    console.log(`Duration: ${duration}s`);
    console.log(`Success rate: ${successRate === 100 ? chalk.green(successRate + '%') : 
                                  successRate >= 50 ? chalk.yellow(successRate + '%') : 
                                  chalk.red(successRate + '%')}`);
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
      throw new Error(`Task '${call.taskName}' not found for _call`);
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
}