import { BaseCommand } from './base-command.js';
import { CommandResult } from '../core/types/command-result.interface.js';
import { CommandOptions } from '../core/types/command-options.interface.js';
import type { TaskCall } from '../tasks/types/task-call.js';
import type { TaskInstance } from '../tasks/types/task-instance.js';
import chalk from 'chalk';

/**
 * Plan command implementation
 * Shows execution plan with dependencies and task order (similar to Terraform plan)
 */
export class PlanCommand extends BaseCommand {
  public getDescription(): string {
    return 'Show execution plan with dependencies, modifiers, and task order (similar to Terraform plan)';
  }
  
  public async execute(taskCalls: TaskCall[]): Promise<CommandResult> {
    try {
      if (!this.runner.isQuiet()) {
        console.log(chalk.blue.bold('📋 Execution Plan'));
        console.log();
      }
      
      // Build execution plan
      const executionPlan = await this.runner.buildExecutionPlan(taskCalls);
      
      if (executionPlan.length === 0) {
        if (!this.runner.isQuiet()) {
          console.log(chalk.yellow('No tasks to execute'));
        }
        return {
          success: true,
          message: 'No tasks to execute',
          data: { plan: [] }
        };
      }
      
      if (!this.runner.isQuiet()) {
        // Show plan summary
        console.log(chalk.green('Plan Summary:'));
        console.log(`  Tasks to run: ${taskCalls.map(t => t.taskName).join(', ')}`);
        console.log(`  Total task instances: ${executionPlan.length}`);
        console.log(`  Max parallel jobs: ${this.runner.getMaxJobs()}`);
        console.log();
        
        await this.displayExecutionPlan(executionPlan);
        
        console.log();
        console.log(chalk.gray('Use --dry-run to see the actual commands that would be executed'));
      }
      
      return {
        success: true,
        message: 'Execution plan displayed',
        data: {
          plan: executionPlan.map(t => t.signature),
          taskCount: executionPlan.length
        }
      };
      
    } catch (error: any) {
      if (!this.runner.isQuiet()) {
        console.error(chalk.red.bold('Error creating plan:'), error.message);
      }
      return {
        success: false,
        error: error.message,
        message: 'Failed to create execution plan'
      };
    }
  }
  
  private async displayExecutionPlan(executionPlan: TaskInstance[]): Promise<void> {
    // Analyze dependencies
    const dependencies = new Map<string, string[]>();
    for (const taskInstance of executionPlan) {
      const deps = this.runner.getGraph().getDependencies(taskInstance.taskName);
      dependencies.set(taskInstance.signature, deps);
    }
    
    // Show execution order and dependencies
    console.log(chalk.green('Execution Plan:'));
    for (let i = 0; i < executionPlan.length; i++) {
      const taskInstance = executionPlan[i];
      if (!taskInstance) continue;
      
      const color = this.runner.getTaskColors().get(taskInstance.taskName) || chalk.white;
      const deps = dependencies.get(taskInstance.signature)!;
      
      const status = await this.runner.shouldTaskRun(taskInstance) ? 
        chalk.green('⚡ Run') : chalk.gray('⏭ Skip (cached)');
      
      console.log(`  ${i + 1}. ${color(taskInstance.signature)} ${status}`);
      
      if (deps.length > 0) {
        console.log(`     ${chalk.gray(`Dependencies: ${deps.join(', ')}`)}`);
      }
      
      if (this.runner.hasModifier(taskInstance.task, 'serial')) {
        console.log(`     ${chalk.yellow('⚠ Serial execution (no parallelism)')}`);
      }
      
      if (this.runner.hasModifier(taskInstance.task, 'always')) {
        console.log(`     ${chalk.blue('🔄 Always run (ignores cache)')}`);
      }
      
      if (this.runner.hasModifier(taskInstance.task, 'critical')) {
        console.log(`     ${chalk.red('🚨 Critical (failure stops all)')}`);
      }
      
      const watches = this.runner.getWatches(taskInstance.task);
      if (watches.length > 0) {
        console.log(`     ${chalk.cyan(`Watches: ${watches.join(', ')}`)}`);
      }
      
      if (taskInstance.task.inputs && taskInstance.task.inputs.length > 0) {
        console.log(`     ${chalk.magenta(`🎯 Interactive: ${taskInstance.task.inputs.length} input prompt(s)`)}`); 
      }
    }
  }
}