import { BaseCommand } from './base-command.js';
import { CommandResult } from '../core/types/command-result.interface.js';
import { CommandOptions } from '../core/types/command-options.interface.js';
import chalk from 'chalk';

/**
 * List command implementation
 * Shows all available tasks with their modifiers and dependencies
 */
export class ListCommand extends BaseCommand {
  public getDescription(): string {
    return 'List all available tasks with their modifiers and dependencies';
  }
  
  public async execute(): Promise<CommandResult> {
    try {
      if (this.runner.isQuiet()) {
        return { success: true, message: 'Tasks listed (quiet mode)' };
      }
      
      console.log(chalk.green.bold('Available tasks:'));
      console.log();
      
      for (const [name, task] of this.runner.getTasks()) {
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
        if (this.runner.isVerbose() && taskCommands.length > 0) {
          for (const cmd of taskCommands.slice(0, 3)) {
            const display = cmd.length > 50 ? cmd.substring(0, 47) + '...' : cmd;
            console.log(chalk.gray(`    → ${display}`));
          }
          if (taskCommands.length > 3) {
            console.log(chalk.gray(`    → ... ${taskCommands.length - 3} more`));
          }
        }
      }
      
      return {
        success: true,
        message: 'Tasks listed successfully',
        data: { taskCount: this.runner.getTasks().size }
      };
      
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to list tasks'
      };
    }
  }
}