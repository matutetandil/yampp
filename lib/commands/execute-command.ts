import { BaseCommand } from './base-command.js';
import { CommandResult } from '../core/types/command-result.interface.js';
import { CommandOptions } from '../core/types/command-options.interface.js';
import { TaskCall } from '../tasks/types/task-call.js';
import chalk from 'chalk';

/**
 * Execute command implementation
 * Main command for executing tasks with dependency resolution and parallel execution
 */
export class ExecuteCommand extends BaseCommand {
  public getDescription(): string {
    return 'Execute specified tasks with dependency resolution, parallel execution, and intelligent caching';
  }
  
  public async execute(taskCalls: TaskCall[]): Promise<CommandResult> {
    const startTime = Date.now();
    
    try {
      // Delegate to runner's execute method which contains the complex execution logic
      const result = await this.runner.execute(taskCalls);
      
      return {
        success: result.success,
        message: result.success ? 'Tasks executed successfully' : 'Task execution failed',
        data: {
          completed: result.completed || 0,
          failed: result.failed || 0,
          duration: ((Date.now() - startTime) / 1000).toFixed(2),
          executedTasks: taskCalls.map(t => t.taskName)
        }
      };
      
    } catch (error: any) {
      if (!this.runner.isQuiet()) {
        console.error(chalk.red.bold('Execution error:'), error.message);
        if (this.runner.isVerbose()) {
          console.error(error.stack);
        }
      }
      
      return {
        success: false,
        error: error.message,
        message: 'Task execution failed',
        data: {
          completed: 0,
          failed: 1,
          duration: ((Date.now() - startTime) / 1000).toFixed(2)
        }
      };
    }
  }
}