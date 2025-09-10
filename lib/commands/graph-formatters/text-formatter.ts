import { BaseGraphFormatter } from './base-formatter.js';
import chalk from 'chalk';

/**
 * Text formatter for graph output
 * Displays human-readable hierarchical text format
 */
export class TextGraphFormatter extends BaseGraphFormatter {
  public getName(): string {
    return 'text';
  }
  
  public format(taskName?: string): void {
    console.log(chalk.green.bold('Task dependency graph:'));
    console.log();
    
    if (taskName) {
      this.formatSingleTask(taskName);
    } else {
      this.formatAllTasks();
    }
  }
  
  private formatSingleTask(taskName: string): void {
    const task = this.tasks.get(taskName);
    if (!task) {
      throw new Error(`Task '${taskName}' not found`);
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
  }
  
  private formatAllTasks(): void {
    console.log(this.graph.getGraphVisualization());
  }
}