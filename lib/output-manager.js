import chalk from 'chalk';
import readline from 'readline';
import { performance } from 'perf_hooks';

export class OutputManager {
  constructor(options = {}) {
    this.quiet = options.quiet || false;
    this.verbose = options.verbose || false;
    this.ugly = options.ugly || false;
    this.isInteractive = process.stdout.isTTY && !options.forceNonInteractive && !this.ugly;
    this.taskBuffers = new Map(); // taskId -> { lines: [], status: 'running'|'completed'|'failed', position: Y }
    this.taskOrder = [];
    this.maxLinesPerTask = 10;
    this.currentRow = 0; // Track current cursor position
    this.initialRow = 0; // Remember where we started
    this.blockPositions = new Map(); // taskId -> start row position
    this.collapsedTasks = new Set(); // Track which tasks have been collapsed
    this.initialized = false;
  }

  initialize() {
    if (this.initialized || !this.isInteractive) return;
    // Get current cursor position to start tracking from here
    this.currentRow = 0;
    this.initialized = true;
  }

  startTask(taskId, taskName) {
    if (this.quiet) return;
    
    this.initialize();
    
    this.taskBuffers.set(taskId, {
      name: taskName,
      lines: [],
      status: 'running',
      startTime: performance.now()
    });
    
    if (!this.taskOrder.includes(taskId)) {
      this.taskOrder.push(taskId);
    }
    
    if (this.ugly) {
      // Ugly mode: simple start notification
      const prefix = chalk.cyan(`[${taskName}]`);
      console.log(`${prefix} ${chalk.yellow('Starting...')}`);
    } else if (this.isInteractive) {
      // Reserve space for this task block
      this.blockPositions.set(taskId, this.currentRow);
      
      // Show initial task header
      const prefix = chalk.cyan(`[${taskName}]`);
      console.log(`\n${prefix} ${chalk.yellow('Running')}:`);
      this.currentRow += 2; // Header + empty line for content
    } else {
      // Non-interactive mode - simple output
      const prefix = chalk.cyan(`[${taskName}]`);
      console.log(`\n${prefix} ${chalk.yellow('Running')}:`);
    }
  }

  addOutput(taskId, line, isError = false) {
    if (this.quiet) return;
    
    const buffer = this.taskBuffers.get(taskId);
    if (!buffer) return;
    
    // Store the line with metadata
    buffer.lines.push({
      text: line,
      isError,
      timestamp: Date.now()
    });
    
    // Keep only the last N lines for display
    if (buffer.lines.length > this.maxLinesPerTask) {
      buffer.lines = buffer.lines.slice(-this.maxLinesPerTask);
    }
    
    if (this.ugly) {
      // Ugly mode: output immediately with simple prefix
      const color = isError ? chalk.red : chalk.cyan;
      const prefix = color(`[${buffer.name}]`);
      const lineColor = isError ? chalk.red : chalk.white;
      console.log(`${prefix} ${lineColor(line)}`);
    } else if (this.isInteractive) {
      this.scheduleRender();
    } else {
      // For non-interactive mode, print in organized blocks
      this.renderTaskBlock(taskId, line, isError);
    }
  }

  renderTaskBlock(taskId, newLine = null, isError = false) {
    const buffer = this.taskBuffers.get(taskId);
    if (!buffer) return;
    
    // Add new line to buffer
    if (newLine) {
      buffer.lines.push({ text: newLine, isError, timestamp: Date.now() });
      // Keep only the last N lines
      if (buffer.lines.length > this.maxLinesPerTask) {
        buffer.lines = buffer.lines.slice(-this.maxLinesPerTask);
      }
    }
    
    if (this.isInteractive) {
      this.updateTaskBlock(taskId);
    } else {
      // Non-interactive mode - just show the line if verbose
      if (this.verbose && newLine) {
        const color = isError ? chalk.red : chalk.gray;
        console.log(`  │ ${color(newLine)}`);
      }
    }
  }

  updateTaskBlock(taskId) {
    const buffer = this.taskBuffers.get(taskId);
    if (!buffer || this.collapsedTasks.has(taskId)) return;
    
    const blockRow = this.blockPositions.get(taskId);
    if (blockRow === undefined) return;
    
    // Save current cursor position
    process.stdout.write('\x1b[s');
    
    // Move to task block position (skip header line)
    process.stdout.write(`\x1b[${blockRow + 2};1H`);
    
    // Clear area below header
    process.stdout.write('\x1b[0J');
    
    // Render task content if verbose
    if (this.verbose && buffer.lines.length > 0) {
      for (const line of buffer.lines) {
        const color = line.isError ? chalk.red : chalk.gray;
        console.log(`  │ ${color(line.text)}`);
      }
    }
    
    // Restore cursor position
    process.stdout.write('\x1b[u');
  }

  completeTask(taskId, success = true) {
    if (this.quiet) return;
    
    const buffer = this.taskBuffers.get(taskId);
    if (!buffer) return;
    
    buffer.status = success ? 'completed' : 'failed';
    buffer.endTime = performance.now();
    buffer.duration = ((buffer.endTime - buffer.startTime) / 1000).toFixed(2);
    
    const statusText = success ? 'Completed' : 'Failed';
    const color = success ? chalk.green : chalk.red;
    const prefix = chalk.cyan(`[${buffer.name}]`);
    
    if (this.ugly) {
      // Ugly mode: simple completion notification
      console.log(`${prefix} ${color(statusText)} (${buffer.duration}s)`);
    } else if (this.isInteractive) {
      const blockRow = this.blockPositions.get(taskId);
      if (blockRow !== undefined) {
        // Save current cursor position
        process.stdout.write('\x1b[s');
        
        // Move to task header position
        process.stdout.write(`\x1b[${blockRow + 1};1H`);
        
        if (success) {
          // For successful tasks: collapse to just completion status
          process.stdout.write('\x1b[0J'); // Clear everything below header
          console.log(`${prefix} ${color(statusText)} (${buffer.duration}s)`);
          this.collapsedTasks.add(taskId);
        } else {
          // For failed tasks: keep content visible, just update header
          console.log(`${prefix} ${color(statusText)} (${buffer.duration}s)`);
          // Don't collapse - keep output visible for debugging
        }
        
        // Restore cursor position
        process.stdout.write('\x1b[u');
      }
    } else {
      // Non-interactive mode
      console.log(`${prefix} ${color(statusText)} (${buffer.duration}s)`);
    }
  }

  scheduleRender() {
    if (!this.isInteractive) return;
    
    // Debounce rendering to avoid too frequent updates
    if (this.renderTimer) {
      clearTimeout(this.renderTimer);
    }
    
    const now = performance.now();
    const timeSinceLastRender = now - this.lastRenderTime;
    
    if (timeSinceLastRender >= this.renderInterval) {
      this.render();
    } else {
      this.renderTimer = setTimeout(() => {
        this.render();
      }, this.renderInterval - timeSinceLastRender);
    }
  }

  render() {
    if (!this.isInteractive || this.quiet) return;
    
    // Build the output we want to display
    const output = [];
    
    for (const taskId of this.taskOrder) {
      const buffer = this.taskBuffers.get(taskId);
      if (!buffer) continue;
      
      // Task header
      const prefix = chalk.cyan(`[${buffer.name}]`);
      let statusText = '';
      
      switch (buffer.status) {
        case 'running':
          statusText = chalk.yellow('Running');
          break;
        case 'completed':
          statusText = chalk.green(`Completed (${buffer.duration}s)`);
          break;
        case 'failed':
          statusText = chalk.red(`Failed (${buffer.duration}s)`);
          break;
      }
      
      output.push(`${prefix} ${statusText}`);
      
      // Task output lines (indented) - only for running tasks
      if (buffer.status === 'running' && buffer.lines.length > 0) {
        for (const line of buffer.lines) {
          const color = line.isError ? chalk.red : chalk.gray;
          output.push(`  │ ${color(line.text)}`);
        }
        output.push(''); // Empty line after task output
      }
    }
    
    // If we haven't rendered before, just print
    if (!this.hasRendered) {
      if (output.length > 0) {
        console.log(output.join('\n'));
        this.hasRendered = true;
      }
    } else {
      // Clear previous output and rewrite
      const outputText = output.join('\n') + '\n';
      
      // Move cursor up to overwrite previous output
      const linesToClear = this.taskOrder.length * 3; // Rough estimate
      process.stdout.write(`\x1b[${linesToClear}A`); // Move cursor up
      process.stdout.write('\x1b[0J'); // Clear from cursor down
      
      // Write new output
      process.stdout.write(outputText);
    }
    
    this.lastRenderTime = performance.now();
  }

  clear() {
    if (this.isInteractive && !this.quiet) {
      // Clear entire screen
      process.stdout.write('\x1b[2J\x1b[H');
    }
  }

  printSummary(completed, failed, duration) {
    if (this.quiet) return;
    
    console.log();
    console.log(chalk.gray('─'.repeat(50)));
    console.log(chalk.bold('Execution Summary'));
    console.log(chalk.gray('─'.repeat(50)));
    
    if (completed.size > 0) {
      console.log(chalk.green('✔'), `Completed (${completed.size}):`);
      for (const task of completed) {
        console.log(`    ${chalk.green('•')} ${task}`);
      }
    }
    
    if (failed.size > 0) {
      console.log(chalk.red('✗'), `Failed (${failed.size}):`);
      for (const task of failed) {
        console.log(`    ${chalk.red('•')} ${task}`);
      }
    }
    
    console.log();
    console.log(`Duration: ${duration}s`);
    
    const total = completed.size + failed.size;
    const successRate = total > 0 ? Math.round((completed.size / total) * 100) : 100;
    console.log(`Success rate: ${successRate === 100 ? chalk.green(successRate + '%') : 
                                  successRate >= 50 ? chalk.yellow(successRate + '%') : 
                                  chalk.red(successRate + '%')}`);
  }

  log(message, color = chalk.white) {
    if (!this.quiet) {
      console.log(color(message));
    }
  }

  error(message) {
    if (!this.quiet) {
      console.error(chalk.red(message));
    }
  }
}