import { BaseCommand } from './base-command.js';
import chalk from 'chalk';

/**
 * Dry Run command implementation
 * Analyzes what would be executed without actually running tasks
 */
export class DryRunCommand extends BaseCommand {
  getDescription() {
    return 'Analyze what would be executed without running tasks, including time estimation and cache analysis';
  }
  
  async execute(taskCalls) {
    try {
      if (!this.runner.quiet) {
        console.log(chalk.blue.bold('🔍 Enhanced Dry Run Analysis'));
        console.log();
      }
      
      // Build execution plan
      const executionPlan = await this.runner.buildExecutionPlan(taskCalls);
      
      if (executionPlan.length === 0) {
        if (!this.runner.quiet) {
          console.log(chalk.yellow('No tasks to execute'));
        }
        return {
          success: true,
          message: 'No tasks to execute',
          analysis: { willExecute: 0, cached: 0, totalCommands: 0 }
        };
      }
      
      // Analyze execution
      const analysis = await this.runner.analyzeDryRun(executionPlan);
      
      if (!this.runner.quiet) {
        // Summary
        console.log(chalk.green.bold('📊 Execution Summary:'));
        console.log(`  Tasks requested: ${chalk.cyan(taskCalls.map(t => t.taskName).join(', '))}`);
        console.log(`  Total task instances: ${chalk.cyan(executionPlan.length)}`);
        console.log(`  Would execute: ${chalk.green(analysis.willExecute)} ${chalk.gray('|')} Cached: ${chalk.yellow(analysis.cached)}`);
        console.log(`  Max parallelism: ${chalk.cyan(this.runner.maxJobs)} jobs`);
        console.log(`  Estimated duration: ${chalk.cyan(analysis.estimatedTime)}`);
        console.log();
        
        // Show what would be executed for each task
        await this.displayTaskAnalysis(executionPlan);
      }
      
      return {
        success: true,
        message: 'Dry run analysis completed',
        analysis,
        executionPlan: executionPlan.length
      };
      
    } catch (error) {
      if (!this.runner.quiet) {
        console.error(chalk.red.bold('Error in dry run:'), error.message);
      }
      return {
        success: false,
        error: error.message,
        message: 'Dry run analysis failed'
      };
    }
  }
  
  async displayTaskAnalysis(executionPlan) {
    for (const taskInstance of executionPlan) {
      const color = this.runner.taskColors.get(taskInstance.taskName) || chalk.white;
      const prefix = color(`[${taskInstance.signature}]`);
      
      console.log(`${prefix} Would execute:`);
      
      // Check if task needs to run (file watching, cache, etc.)
      const needsRun = await this.runner.shouldTaskRun(taskInstance);
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
  }
}