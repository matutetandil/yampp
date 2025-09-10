import chalk from 'chalk';
import { ITaskDisplayService } from '../tasks/interfaces/task-display-service.interface.js';
import { TaskCall } from '../tasks/types/task-call.js';
import { TaskInstance } from '../tasks/types/task-instance.js';
import { DryRunAnalysis } from '../core/types/dry-run-analysis.js';
import { ITaskMap } from '../tasks/interfaces/task-map.interface.js';
import { ITaskGraph } from '../tasks/interfaces/task-graph.interface.js';
import { ITaskColorMap } from '../tasks/interfaces/task-color-map.interface.js';
import { ITaskExecutionService } from '../tasks/interfaces/task-execution-service.interface.js';

export class TaskDisplayService implements ITaskDisplayService {
  constructor(
    private readonly _tasks: ITaskMap,
    private readonly _taskGraph: ITaskGraph,
    private readonly _taskColors: ITaskColorMap,
    private readonly _taskExecutionService: ITaskExecutionService,
    private readonly _maxJobs: number,
    private readonly _verbose: boolean,
    private readonly _quiet: boolean
  ) {}

  public listTasks(): void {
    if (this._quiet) return;
    
    console.log(chalk.green.bold('Available tasks:'));
    console.log();
    
    for (const [name, task] of this._tasks) {
      let line = `  ${chalk.bold(name)}`;
      
      const taskModifiers = task.getModifiers();
      if (taskModifiers.size > 0) {
        line += chalk.yellow(` [${Array.from(taskModifiers).join(', ')}]`);
      }
      
      const taskDependencies = task.getDependencies();
      if (taskDependencies.length > 0) {
        line += chalk.cyan(` needs ${taskDependencies.join(', ')}`);
      }
      
      console.log(line);
      
      const taskCommands = task.getCommands();
      if (this._verbose && taskCommands.length > 0) {
        for (const cmd of taskCommands.slice(0, 3)) {
          const display = cmd.length > 50 ? cmd.substring(0, 47) + '...' : cmd;
          console.log(chalk.gray(`    → ${display}`));
        }
        if (taskCommands.length > 3) {
          console.log(chalk.gray(`    → ... ${taskCommands.length - 3} more`));
        }
      }
    }
  }

  public showGraph(taskName?: string, format: string = 'text'): void {
    if (this._quiet) return;
    
    const validFormats = ['text', 'dot', 'json'];
    if (!validFormats.includes(format)) {
      console.error(chalk.red(`Invalid graph format '${format}'. Valid formats: ${validFormats.join(', ')}`));
      return;
    }
    
    switch (format) {
      case 'dot':
        console.log(this._taskGraph.toDotFormat());
        break;
      case 'json':
        console.log(JSON.stringify(this._taskGraph.toJSON(), null, 2));
        break;
      case 'text':
      default:
        console.log(chalk.green.bold('Task dependency graph:'));
        console.log();
        
        if (taskName) {
          const task = this._tasks.get(taskName);
          if (!task) {
            console.error(chalk.red(`Task '${taskName}' not found`));
            return;
          }
          
          const allDeps = this._taskGraph.getAllDependencies(taskName);
          console.log(chalk.bold(`Dependencies for '${taskName}':`));
          
          if (allDeps.length === 0) {
            console.log(chalk.gray('  (no dependencies)'));
          } else {
            for (const dep of allDeps) {
              console.log(`  → ${dep}`);
            }
          }
        } else {
          console.log(this._taskGraph.getGraphVisualization());
        }
        break;
    }
  }

  public async dryRun(taskCalls: TaskCall[]): Promise<void> {
    console.log(chalk.blue.bold('🔍 Enhanced Dry Run Analysis'));
    console.log();
    
    try {
      // Build execution plan
      const executionPlan = await this._taskExecutionService.buildExecutionPlan(taskCalls);
      
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
      console.log(`  Max parallelism: ${chalk.cyan(this._maxJobs)} jobs`);
      console.log(`  Estimated duration: ${chalk.cyan(analysis.estimatedTime)}`);
      console.log();
      
      // Show what would be executed for each task
      for (const taskInstance of executionPlan) {
        await this._showTaskInstanceDryRun(taskInstance);
      }
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(chalk.red.bold('Error in dry run:'), errorMessage);
      throw error;
    }
  }

  public async showPlan(taskCalls: TaskCall[]): Promise<void> {
    console.log(chalk.blue.bold('📋 Execution Plan'));
    console.log();
    
    try {
      // Build execution plan
      const executionPlan = await this._taskExecutionService.buildExecutionPlan(taskCalls);
      
      if (executionPlan.length === 0) {
        console.log(chalk.yellow('No tasks to execute'));
        return;
      }
      
      // Show plan summary
      console.log(chalk.green('Plan Summary:'));
      console.log(`  Tasks to run: ${taskCalls.map(t => t.taskName).join(', ')}`);
      console.log(`  Total task instances: ${executionPlan.length}`);
      console.log(`  Max parallel jobs: ${this._maxJobs}`);
      console.log();
      
      // Show execution order and dependencies
      await this._showExecutionPlan(executionPlan);
      
      console.log();
      console.log(chalk.gray('Use --dry-run to see the actual commands that would be executed'));
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(chalk.red.bold('Error creating plan:'), errorMessage);
      throw error;
    }
  }

  public logTask(taskName: string, message: string, messageColor: Function = chalk.white): void {
    const color = this._taskColors.get(taskName) || chalk.white;
    const prefix = color(`[${taskName}]`);
    console.log(prefix, messageColor(message));
  }

  public async analyzeDryRun(executionPlan: TaskInstance[]): Promise<DryRunAnalysis> {
    let willExecute = 0;
    let cached = 0;
    let totalCommands = 0;
    const platforms = new Set<string>();
    const modifiers = new Set<string>();
    
    for (const taskInstance of executionPlan) {
      const needsRun = await this._taskExecutionService.shouldTaskRun(taskInstance);
      
      if (needsRun) {
        willExecute++;
        totalCommands += taskInstance.task.commands.length;
      } else {
        cached++;
      }
      
      // Collect metadata
      if (taskInstance.task.platforms) {
        taskInstance.task.platforms.forEach((p: string) => platforms.add(p));
      }
      taskInstance.task.modifiers.forEach((m: string) => modifiers.add(m));
    }
    
    // Estimate execution time (very rough)
    const avgCommandTime = 0.5; // seconds per command
    const parallelEfficiency = Math.min(this._maxJobs, willExecute) / willExecute || 1;
    const estimatedSeconds = (totalCommands * avgCommandTime) / parallelEfficiency;
    
    return {
      willExecute,
      cached,
      totalCommands,
      platforms: Array.from(platforms),
      modifiers: Array.from(modifiers),
      estimatedTime: this._formatTime(estimatedSeconds)
    };
  }

  private async _showTaskInstanceDryRun(taskInstance: TaskInstance): Promise<void> {
    const color = this._taskColors.get(taskInstance.taskName) || chalk.white;
    const prefix = color(`[${taskInstance.signature}]`);
    
    console.log(`${prefix} Would execute:`);
    
    // Check if task needs to run (file watching, cache, etc.)
    const needsRun = await this._taskExecutionService.shouldTaskRun(taskInstance);
    if (!needsRun) {
      console.log(`${prefix} ${chalk.gray('→ Skipped (cached)')}`);
      console.log();
      return;
    }
    
    // Show inputs that would be prompted
    if (taskInstance.task.inputs && taskInstance.task.inputs.length > 0) {
      for (const input of taskInstance.task.inputs) {
        const typedInput = input as any;
        const defaultText = typedInput.defaultValue ? ` (default: ${typedInput.defaultValue})` : '';
        if (typedInput.type === 'select') {
          console.log(`${prefix} ${chalk.gray(`→ Prompt [${typedInput.type}]: "${typedInput.prompt}" → ${typedInput.variable}${defaultText}`)}`);
          console.log(`${prefix} ${chalk.gray(`  Options: ${typedInput.options.join(', ')}`)}`);
        } else {
          console.log(`${prefix} ${chalk.gray(`→ Prompt [${typedInput.type}]: "${typedInput.prompt}" → ${typedInput.variable}${defaultText}`)}`);
        }
      }
    }
    
    // Show commands that would run
    for (let i = 0; i < taskInstance.task.commands.length; i++) {
      const command = taskInstance.task.commands[i];
      if (typeof command === 'string') {
        console.log(`${prefix} ${chalk.gray(`→ ${command}`)}`);
      } else {
        const typedCommand = command as any;
        if (typedCommand.type === 'set_var') {
          console.log(`${prefix} ${chalk.gray(`→ Set $${typedCommand.name} = "${typedCommand.value}"`)}`);
        } else if (typedCommand.type === 'call') {
          console.log(`${prefix} ${chalk.gray(`→ Call ${typedCommand.taskName}(${typedCommand.params.join(', ')})`)}`);
        } else {
          console.log(`${prefix} ${chalk.gray(`→ ${typedCommand.command || typedCommand}`)}`);
        }
      }
    }
    console.log();
  }

  private async _showExecutionPlan(executionPlan: TaskInstance[]): Promise<void> {
    // Analyze dependencies
    const dependencies = new Map();
    for (const taskInstance of executionPlan) {
      const deps = this._taskGraph.getDependencies(taskInstance.taskName);
      dependencies.set(taskInstance.signature, deps);
    }
    
    console.log(chalk.green('Execution Plan:'));
    for (let i = 0; i < executionPlan.length; i++) {
      const taskInstance = executionPlan[i];
      if (!taskInstance) continue;
      
      const color = this._taskColors.get(taskInstance.taskName) || chalk.white;
      const deps = dependencies.get(taskInstance.signature);
      
      const status = await this._taskExecutionService.shouldTaskRun(taskInstance) ? 
        chalk.green('⚡ Run') : chalk.gray('⏭ Skip (cached)');
      
      console.log(`  ${i + 1}. ${color(taskInstance.signature)} ${status}`);
      
      if (deps && deps.length > 0) {
        console.log(`     ${chalk.gray(`Dependencies: ${deps.join(', ')}`)}`);
      }
      
      if (this._hasModifier(taskInstance.task, 'serial')) {
        console.log(`     ${chalk.yellow('⚠ Serial execution (no parallelism)')}`);
      }
      
      if (this._hasModifier(taskInstance.task, 'always')) {
        console.log(`     ${chalk.blue('🔄 Always run (ignores cache)')}`);
      }
      
      if (this._hasModifier(taskInstance.task, 'critical')) {
        console.log(`     ${chalk.red('🚨 Critical (failure stops all)')}`);
      }
      
      const watches = this._getWatches(taskInstance.task);
      if (watches.length > 0) {
        console.log(`     ${chalk.cyan(`Watches: ${watches.join(', ')}`)}`);
      }
      
      if (taskInstance.task.inputs && taskInstance.task.inputs.length > 0) {
        console.log(`     ${chalk.magenta(`🎯 Interactive: ${taskInstance.task.inputs.length} input prompt(s)`)}`);
      }
    }
  }

  private _formatTime(seconds: number): string {
    if (seconds < 1) return '<1s';
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m ${Math.round(seconds % 60)}s`;
    return `${Math.round(seconds / 3600)}h ${Math.round((seconds % 3600) / 60)}m`;
  }

  private _hasModifier(task: unknown, modifier: string): boolean {
    const typedTask = task as any;
    return typedTask.modifiers && typedTask.modifiers.has && typedTask.modifiers.has(modifier);
  }

  private _getWatches(task: unknown): string[] {
    const typedTask = task as any;
    return Array.isArray(typedTask.watches) ? typedTask.watches : [];
  }
}