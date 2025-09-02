import { BaseCommand } from './base-command.js';
import chalk from 'chalk';

/**
 * List command implementation
 * Shows all available tasks with their modifiers and dependencies
 */
export class ListCommand extends BaseCommand {
  getDescription() {
    return 'List all available tasks with their modifiers and dependencies';
  }
  
  async execute() {
    try {
      if (this.runner.quiet) {
        return { success: true, message: 'Tasks listed (quiet mode)' };
      }
      
      console.log(chalk.green.bold('Available tasks:'));
      console.log();
      
      for (const [name, task] of this.runner.tasks) {
        let line = `  ${chalk.bold(name)}`;
        
        if (task.modifiers.size > 0) {
          line += chalk.yellow(` [${Array.from(task.modifiers).join(', ')}]`);
        }
        
        if (task.dependencies.length > 0) {
          line += chalk.cyan(` needs ${task.dependencies.join(', ')}`);
        }
        
        console.log(line);
        
        if (this.runner.verbose && task.commands.length > 0) {
          for (const cmd of task.commands.slice(0, 3)) {
            const display = cmd.length > 50 ? cmd.substring(0, 47) + '...' : cmd;
            console.log(chalk.gray(`    → ${display}`));
          }
          if (task.commands.length > 3) {
            console.log(chalk.gray(`    → ... ${task.commands.length - 3} more`));
          }
        }
      }
      
      return {
        success: true,
        message: 'Tasks listed successfully',
        taskCount: this.runner.tasks.size
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to list tasks'
      };
    }
  }
}