import { BaseCommand } from './base-command.js';
import chalk from 'chalk';

/**
 * Watch command implementation
 * Monitors files for changes and re-executes tasks automatically
 * Features double Ctrl+C to exit gracefully
 */
export class WatchCommand extends BaseCommand {
  getDescription() {
    return 'Watch for file changes and re-execute tasks automatically (Press Ctrl+C twice to exit)';
  }
  
  async execute(taskCalls) {
    try {
      if (!this.runner.quiet) {
        console.log(chalk.cyan.bold('🔍 Watch Mode'), 'Monitoring files for changes...');
        console.log(chalk.gray('Press Ctrl+C twice to exit watch mode\n'));
      }

      // Setup graceful exit handler for Ctrl+C
      let ctrlCCount = 0;
      let ctrlCTimeout = null;
      
      const exitHandler = () => {
        ctrlCCount++;
        
        if (ctrlCCount === 1) {
          console.log(chalk.yellow('\n⚠️  Press Ctrl+C again within 2 seconds to exit watch mode'));
          ctrlCTimeout = setTimeout(() => {
            ctrlCCount = 0;
          }, 2000);
        } else if (ctrlCCount >= 2) {
          if (ctrlCTimeout) clearTimeout(ctrlCTimeout);
          console.log(chalk.red('\n🛑 Exiting watch mode...'));
          process.removeListener('SIGINT', exitHandler);
          process.exit(0);
        }
      };

      process.on('SIGINT', exitHandler);

      // Initial execution
      if (!this.runner.quiet) {
        console.log(chalk.blue('⚡ Initial execution'));
      }
      await this.runner.execute(taskCalls);

      // Get all tasks that need to be monitored
      const watchedPatterns = new Set();
      const executionPlan = await this.runner.buildExecutionPlan(taskCalls);
      
      for (const taskInstance of executionPlan) {
        const task = this.runner.tasks.get(taskInstance.taskName);
        if (task && task.hasWatchedFiles()) {
          for (const pattern of task.watchedFiles) {
            watchedPatterns.add(pattern);
          }
        }
      }

      if (watchedPatterns.size === 0) {
        console.log(chalk.yellow('⚠️  No watched files found in tasks. Watch mode will monitor general file changes.'));
      } else {
        if (!this.runner.quiet) {
          console.log(chalk.gray(`👀 Watching patterns: ${Array.from(watchedPatterns).join(', ')}`));
        }
      }

      // Store current state
      let lastExecutionTime = Date.now();
      const watchPatterns = Array.from(watchedPatterns);
      
      // Continuous monitoring loop
      while (true) {
        try {
          await new Promise(resolve => setTimeout(resolve, 1000)); // Check every second

          // Check for file changes
          let hasChanges = false;
          
          if (watchPatterns.length > 0) {
            // Check specific watched patterns
            hasChanges = await this.runner.fileWatcher.areFilesNewer(watchPatterns, lastExecutionTime);
          } else {
            // Fallback: check common patterns if no specific watches
            const commonPatterns = ['**/*.js', '**/*.ts', '**/*.json', '**/*.yml', '**/*.yaml', '**/*.md'];
            hasChanges = await this.runner.fileWatcher.areFilesNewer(commonPatterns, lastExecutionTime);
          }

          if (hasChanges) {
            lastExecutionTime = Date.now();
            
            if (!this.runner.quiet) {
              console.log(chalk.green('\n🔄 File changes detected, re-executing tasks...\n'));
            }

            // Re-execute the tasks
            const result = await this.runner.execute(taskCalls);
            
            if (!this.runner.quiet) {
              if (result.success) {
                console.log(chalk.green('✅ Re-execution completed successfully'));
              } else {
                console.log(chalk.red('❌ Re-execution failed'));
              }
              console.log(chalk.gray('Continuing to watch for changes...\n'));
            }
          }
        } catch (error) {
          if (!this.runner.quiet) {
            console.error(chalk.red('Watch error:'), error.message);
            console.log(chalk.gray('Continuing to watch...\n'));
          }
        }
      }

    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Watch mode failed to start'
      };
    }
  }
}