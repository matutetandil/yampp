import chalk from 'chalk';
import readline from 'readline';
import { performance } from 'perf_hooks';
import stripAnsi from 'strip-ansi';

/**
 * Claude Code Interface Style Output Manager
 * Provides beautiful, professional task output with parallel support
 */
export class ClaudeOutputManager {
  constructor(options = {}) {
    this.quiet = options.quiet || false;
    this.verbose = options.verbose || false;
    this.ugly = options.ugly || false;
    this.isInteractive = process.stdout.isTTY && !options.forceNonInteractive && !this.ugly;
    
    // Task management
    this.tasks = new Map(); // taskId -> task data
    this.taskOrder = [];
    this.activeBlocks = new Map(); // taskId -> block position
    
    // Display configuration
    this.maxOutputLines = 6; // Claude Code style: max 6 lines of output
    this.spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    this.spinnerIndex = 0;
    this.spinnerInterval = null;
    
    // Screen management
    this.currentLine = 0;
    this.reservedLines = new Map(); // taskId -> number of lines reserved
    this.lastRenderTime = 0;
    this.renderThrottle = 50; // ms between renders
    
    // ANSI escape codes
    this.ESC = '\x1b';
    this.clearLine = `${this.ESC}[2K`;
    this.moveCursorUp = (n) => `${this.ESC}[${n}A`;
    this.moveCursorDown = (n) => `${this.ESC}[${n}B`;
    this.saveCursor = `${this.ESC}[s`;
    this.restoreCursor = `${this.ESC}[u`;
    this.hideCursor = `${this.ESC}[?25l`;
    this.showCursor = `${this.ESC}[?25h`;
  }

  initialize() {
    if (this.ugly) return;
    
    if (this.isInteractive) {
      // Hide cursor for cleaner animation
      process.stdout.write(this.hideCursor);
      
      // Start spinner animation
      this.startSpinnerAnimation();
      
      // Handle cleanup on exit
      process.on('exit', () => this.cleanup());
      process.on('SIGINT', () => this.cleanup());
      process.on('SIGTERM', () => this.cleanup());
    }
  }

  cleanup() {
    // Only stop spinner and show cursor, don't move cursor or clear screen
    if (this.spinnerInterval) {
      clearInterval(this.spinnerInterval);
      this.spinnerInterval = null;
    }
    if (this.isInteractive) {
      process.stdout.write(this.showCursor);
    }
  }

  startSpinnerAnimation() {
    if (!this.isInteractive || this.spinnerInterval) return;
    
    this.spinnerInterval = setInterval(() => {
      this.spinnerIndex = (this.spinnerIndex + 1) % this.spinnerFrames.length;
      this.renderAllBlocks();
    }, 80);
  }

  startTask(taskId, taskName) {
    if (this.quiet) return;
    
    if (!this.tasks.size) {
      this.initialize();
    }
    
    const task = {
      id: taskId,
      name: taskName,
      status: 'running',
      output: [],
      startTime: performance.now(),
      command: null,
      hasError: false
    };
    
    this.tasks.set(taskId, task);
    if (!this.taskOrder.includes(taskId)) {
      this.taskOrder.push(taskId);
    }
    
    if (this.ugly) {
      // Ugly mode: simple output
      const prefix = chalk.cyan(`[${taskName}]`);
      console.log(`${prefix} ${chalk.yellow('Starting...')}`);
    } else {
      this.renderAllBlocks();
    }
  }

  addTaskOutput(taskId, data) {
    if (this.quiet) return;
    
    const task = this.tasks.get(taskId);
    if (!task) return;
    
    // Store the command if this is the first output
    if (!task.command && data.trim()) {
      task.command = data.trim().split('\n')[0];
    }
    
    // Process output lines
    const lines = data.toString().split('\n').filter(line => line.trim());
    
    if (this.ugly) {
      // Ugly mode: direct output with prefix
      const prefix = chalk.cyan(`[${task.name}]`);
      lines.forEach(line => {
        console.log(`${prefix} ${line}`);
      });
    } else {
      // Add lines to task output buffer
      task.output.push(...lines);
      
      // Keep only the most recent lines for display
      if (task.output.length > this.maxOutputLines) {
        task.output = task.output.slice(-this.maxOutputLines);
      }
      
      this.throttledRender();
    }
  }

  throttledRender() {
    const now = Date.now();
    if (now - this.lastRenderTime > this.renderThrottle) {
      this.lastRenderTime = now;
      this.renderAllBlocks();
    }
  }

  completeTask(taskId, success = true) {
    const task = this.tasks.get(taskId);
    if (!task) return;
    
    task.status = success ? 'completed' : 'failed';
    task.endTime = performance.now();
    task.duration = ((task.endTime - task.startTime) / 1000).toFixed(1);
    
    if (this.ugly) {
      // Ugly mode: simple completion message
      const prefix = chalk.cyan(`[${task.name}]`);
      const status = success ? chalk.green('✓ Completed') : chalk.red('✗ Failed');
      console.log(`${prefix} ${status} (${task.duration}s)`);
    } else if (!this.isInteractive) {
      // Non-interactive mode: simple output
      const statusIcon = success ? '✅' : '❌';
      const statusColor = success ? chalk.green : chalk.red;
      const statusText = success ? 'Completed' : 'Failed';
      console.log(`${statusIcon} ${chalk.bold(task.name)} ${statusColor(statusText)} ${chalk.gray(`[${task.duration}s]`)}`);
    } else {
      // Interactive mode: mark as collapsed and re-render all blocks
      if (success) {
        task.collapsed = true;
      }
      this.renderAllBlocks();
    }
  }


  renderAllBlocks() {
    if (!this.isInteractive || this.ugly) return;
    
    // Clear screen from current position
    process.stdout.write(this.clearLine);
    process.stdout.write(`\r`);
    
    // Move to start of our output area
    if (this.currentLine > 0) {
      process.stdout.write(this.moveCursorUp(this.currentLine));
    }
    
    let totalLines = 0;
    
    // Render each task block
    this.taskOrder.forEach(taskId => {
      const task = this.tasks.get(taskId);
      if (!task) return;
      
      const lines = this.renderTaskBlock(task);
      totalLines += lines;
    });
    
    this.currentLine = totalLines;
  }
  
  renderCompletedView() {
    // Don't render anything here - let the summary handle final display
    // The tasks are already in their collapsed state
  }

  renderTaskBlock(task) {
    const width = process.stdout.columns || 80;
    
    let lines = [];
    
    // Determine status indicator
    let statusIcon = '';
    let statusColor = chalk.blue;
    if (task.status === 'running') {
      statusIcon = this.spinnerFrames[this.spinnerIndex];
      statusColor = chalk.blue;
    } else if (task.status === 'completed') {
      statusIcon = '✅';
      statusColor = chalk.green;
    } else if (task.status === 'failed') {
      statusIcon = '❌';
      statusColor = chalk.red;
    }
    
    // Calculate elapsed time
    const elapsed = task.endTime 
      ? task.duration 
      : ((performance.now() - task.startTime) / 1000).toFixed(1);
    
    // If task is collapsed, show only one line
    if (task.collapsed) {
      const summary = `${statusIcon} ${chalk.bold(task.name)} ${statusColor('Completed')} ${chalk.gray(`[${elapsed}s]`)}`;
      process.stdout.write(summary + '\n');
      return 1;
    }
    
    // Build header (no borders)
    const header = `${statusIcon} ${chalk.bold(task.name)} ${chalk.gray(`[${elapsed}s]`)}`;
    lines.push(header);
    
    // Show command if available
    if (task.command && this.verbose) {
      const cmdLine = `  ${chalk.gray('$')} ${chalk.cyan(this.truncateLine(task.command, width - 4))}`;
      lines.push(cmdLine);
    }
    
    // Show output lines (indented)
    const outputToShow = task.output.slice(-this.maxOutputLines);
    outputToShow.forEach((line, index) => {
      const truncated = this.truncateLine(line, width - 3);
      lines.push(`  ${truncated}`);
    });
    
    // Show truncation indicator if needed
    if (task.output.length > this.maxOutputLines) {
      const truncMsg = chalk.gray(`  [${task.output.length - this.maxOutputLines} lines truncated]`);
      lines.push(truncMsg);
    }
    
    // Add spacing between blocks
    lines.push('');
    
    // Write all lines
    lines.forEach(line => {
      process.stdout.write(this.clearLine + line + '\n');
    });
    
    return lines.length;
  }

  truncateLine(text, maxLength) {
    const stripped = stripAnsi(text);
    if (stripped.length <= maxLength) return text;
    
    // Try to preserve ANSI codes while truncating
    return text.substring(0, maxLength - 3) + '...';
  }

  // Interface compatibility methods
  log(message) {
    if (!this.quiet) {
      console.log(message);
    }
  }

  error(message) {
    if (!this.quiet) {
      console.error(chalk.red(message));
    }
  }

  addOutput(taskId, data, isError = false) {
    // Map to our addTaskOutput method
    this.addTaskOutput(taskId, data);
    
    // Mark task as having error if needed
    if (isError) {
      const task = this.tasks.get(taskId);
      if (task) {
        task.hasError = true;
      }
    }
  }

  printSummary(completed, failed, duration) {
    if (this.quiet) return;
    
    // Stop spinner animation
    if (this.spinnerInterval) {
      clearInterval(this.spinnerInterval);
      this.spinnerInterval = null;
    }
    
    // Show cursor
    if (this.isInteractive) {
      process.stdout.write(this.showCursor);
    }
    
    // Clean up any remaining output from the last render
    if (this.isInteractive && this.currentLine > 0) {
      // Clear from current position to end of screen
      process.stdout.write('\x1b[0J');
    }
    
    // Ensure arrays are valid - handle both arrays and sets
    const completedTasks = Array.isArray(completed) ? completed : 
                          completed instanceof Set ? Array.from(completed) : [];
    const failedTasks = Array.isArray(failed) ? failed : 
                       failed instanceof Set ? Array.from(failed) : [];
    
    // Add proper spacing and summary
    console.log('\n' + chalk.bold('Execution Summary:'));
    
    if (completedTasks.length > 0) {
      console.log(chalk.green(`✓ ${completedTasks.length} task${completedTasks.length > 1 ? 's' : ''} completed successfully`));
      if (this.verbose) {
        completedTasks.forEach(task => {
          const time = task.duration ? `(${task.duration}s)` : '';
          console.log(chalk.green(`  ✓ ${task.name} ${time}`));
        });
      }
    }
    
    if (failedTasks.length > 0) {
      console.log(chalk.red(`✗ ${failedTasks.length} task${failedTasks.length > 1 ? 's' : ''} failed`));
      failedTasks.forEach(taskInfo => {
        // Handle both task objects and task IDs (backward compatibility)
        let taskName, taskError;
        
        if (typeof taskInfo === 'string') {
          // Legacy: just task ID
          taskName = taskInfo;
          taskError = 'Command failed';
        } else if (taskInfo.taskName && taskInfo.error) {
          // New format: detailed error info
          taskName = taskInfo.taskName;
          taskError = taskInfo.error;
        } else {
          // Fallback
          taskName = taskInfo.name || taskInfo.taskId || taskInfo;
          taskError = taskInfo.error || 'Unknown error';
        }
        
        // Clean up task name: remove empty parentheses but keep ones with parameters
        if (taskName.endsWith('()')) {
          taskName = taskName.substring(0, taskName.length - 2);
        }
        
        console.log(chalk.red(`  ✗ ${taskName}: ${taskError}`));
      });
    }
    
    const totalTime = duration ? ` in ${duration}s` : '';
    console.log(chalk.gray(`Total: ${completedTasks.length + failedTasks.length} tasks${totalTime}`));
  }

  showSummary(results) {
    if (this.quiet) return;
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log('\n' + chalk.bold('Summary:'));
    
    if (successful.length > 0) {
      console.log(chalk.green(`✓ ${successful.length} task${successful.length > 1 ? 's' : ''} completed successfully`));
    }
    
    if (failed.length > 0) {
      console.log(chalk.red(`✗ ${failed.length} task${failed.length > 1 ? 's' : ''} failed`));
      failed.forEach(task => {
        console.log(chalk.red(`  - ${task.name}: ${task.error}`));
      });
    }
  }
}