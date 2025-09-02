import { BaseGraphFormatter } from './base-formatter.js';
import chalk from 'chalk';

/**
 * Text formatter for graph output
 * Displays human-readable hierarchical text format
 */
export class TextGraphFormatter extends BaseGraphFormatter {
  getName() {
    return 'text';
  }
  
  format(taskName) {
    console.log(chalk.green.bold('Task dependency graph:'));
    console.log();
    
    if (taskName) {
      this.formatSingleTask(taskName);
    } else {
      this.formatAllTasks();
    }
  }
  
  formatSingleTask(taskName) {
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
  
  formatAllTasks() {
    console.log(this.graph.getGraphVisualization());
  }
}