import chalk from 'chalk';
import { IWatchService } from '../core/types/watch-service.interface.js';
import { TaskCall } from '../tasks/types/task-call.js';
import { ITaskExecutionService } from '../tasks/interfaces/task-execution-service.interface.js';
import { ITaskMap } from '../tasks/interfaces/task-map.interface.js';
import { FileWatcher } from '../file-watcher.js';

export class WatchService implements IWatchService {
  constructor(
    private readonly _tasks: ITaskMap,
    private readonly _fileWatcher: FileWatcher,
    private readonly _taskExecutionService: ITaskExecutionService,
    private readonly _quiet: boolean
  ) {}

  public async watch(taskCalls: TaskCall[]): Promise<void> {
    if (!this._quiet) {
      console.log(chalk.cyan.bold('🔍 Watch Mode'), 'Monitoring files for changes...');
      console.log(chalk.gray('Press Ctrl+C twice to exit watch mode\n'));
    }

    // Setup graceful exit handler for Ctrl+C
    let ctrlCCount = 0;
    let ctrlCTimeout: NodeJS.Timeout | null = null;
    
    const exitHandler = (): void => {
      ctrlCCount++;
      
      if (ctrlCCount === 1) {
        console.log(chalk.yellow('\n⚠️  Press Ctrl+C again within 2 seconds to exit watch mode'));
        ctrlCTimeout = setTimeout(() => {
          ctrlCCount = 0;
        }, 2000);
      } else if (ctrlCCount >= 2) {
        if (ctrlCTimeout) clearTimeout(ctrlCTimeout);
        console.log(chalk.red('\n🛑 Exiting watch mode...'));
        process.exit(0);
      }
    };

    process.on('SIGINT', exitHandler);

    // Initial execution
    if (!this._quiet) {
      console.log(chalk.blue('⚡ Initial execution'));
    }
    await this._taskExecutionService.execute(taskCalls);

    // Get all tasks that need to be monitored
    const watchedPatterns = new Set<string>();
    const executionPlan = await this._taskExecutionService.buildExecutionPlan(taskCalls);
    
    for (const taskInstance of executionPlan) {
      const task = this._tasks.get(taskInstance.taskName);
      if (task && task.hasWatchedFiles()) {
        for (const pattern of task.getWatchedFiles()) {
          watchedPatterns.add(pattern);
        }
      }
    }

    if (watchedPatterns.size === 0) {
      console.log(chalk.yellow('⚠️  No watched files found in tasks. Watch mode will monitor general file changes.'));
    } else {
      if (!this._quiet) {
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
          hasChanges = await this._fileWatcher.areFilesNewer(watchPatterns, lastExecutionTime);
        } else {
          // Fallback: check common patterns if no specific watches
          const commonPatterns = ['**/*.js', '**/*.ts', '**/*.json', '**/*.yml', '**/*.yaml', '**/*.md'];
          hasChanges = await this._fileWatcher.areFilesNewer(commonPatterns, lastExecutionTime);
        }

        if (hasChanges) {
          lastExecutionTime = Date.now();
          
          if (!this._quiet) {
            console.log(chalk.green('\n🔄 File changes detected, re-executing tasks...\n'));
          }

          // Re-execute the tasks
          const result = await this._taskExecutionService.execute(taskCalls);
          
          if (!this._quiet) {
            if (result.success) {
              console.log(chalk.green('✅ Re-execution completed successfully'));
            } else {
              console.log(chalk.red('❌ Re-execution failed'));
            }
            console.log(chalk.gray('Continuing to watch for changes...\n'));
          }
        }
      } catch (error: unknown) {
        if (!this._quiet) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error(chalk.red('Watch error:'), errorMessage);
          console.log(chalk.gray('Continuing to watch...\n'));
        }
      }
    }

    // Cleanup (this will never be reached in normal operation)
    process.removeListener('SIGINT', exitHandler);
  }

  public hasModifier(task: unknown, modifier: string): boolean {
    const typedTask = task as any;
    return typedTask.modifiers && typedTask.modifiers.has && typedTask.modifiers.has(modifier);
  }

  public getWatches(task: unknown): string[] {
    const typedTask = task as any;
    return Array.isArray(typedTask.watches) ? typedTask.watches : [];
  }
}