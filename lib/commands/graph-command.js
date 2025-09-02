import { BaseCommand } from './base-command.js';
import { GraphFormatterRegistry } from './graph-formatters/index.js';
import chalk from 'chalk';

/**
 * Graph command implementation
 * Shows task dependency graph in multiple formats (text, dot, json)
 * Uses Strategy pattern for format handling
 */
export class GraphCommand extends BaseCommand {
  constructor(runner, options = {}) {
    super(runner, options);
    this.formatterRegistry = new GraphFormatterRegistry();
  }
  getDescription() {
    return 'Show task dependency graph in text, DOT, or JSON format';
  }
  
  async execute(args) {
    try {
      const { taskName, format = 'text' } = args;
      
      if (this.runner.quiet) {
        return { success: true, message: 'Graph displayed (quiet mode)' };
      }
      
      // Use formatter registry to handle format validation and execution
      if (!this.formatterRegistry.hasFormat(format)) {
        return {
          success: false,
          error: `Invalid graph format '${format}'. Valid formats: ${this.formatterRegistry.getAvailableFormats().join(', ')}`,
          message: 'Invalid format specified'
        };
      }
      
      // Get appropriate formatter using Strategy pattern
      const formatter = this.formatterRegistry.getFormatter(format, this.runner);
      
      // Check if formatter supports task filtering
      if (taskName && !formatter.supportsTaskFilter()) {
        console.log(chalk.yellow(`Note: ${format} format displays the complete graph. Task filter '${taskName}' ignored.`));
      }
      
      // Execute the formatter strategy
      try {
        formatter.format(taskName);
      } catch (formatterError) {
        return {
          success: false,
          error: formatterError.message,
          message: 'Failed to format graph'
        };
      }
      
      return {
        success: true,
        message: `Graph displayed in ${format} format`,
        format,
        taskName: taskName || 'all tasks'
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to display graph'
      };
    }
  }
}