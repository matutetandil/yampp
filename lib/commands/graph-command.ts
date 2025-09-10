import { BaseCommand } from './base-command.js';
import { CommandResult } from '../core/types/command-result.interface.js';
import { CommandOptions } from '../core/types/command-options.interface.js';
import { GraphFormatterRegistry } from './graph-formatters/index.js';
import chalk from 'chalk';
import type { Runner } from '../runner.js';

interface GraphCommandArgs {
  taskName?: string;
  format?: string;
}

/**
 * Graph command implementation
 * Shows task dependency graph in multiple formats (text, dot, json)
 * Uses Strategy pattern for format handling
 */
export class GraphCommand extends BaseCommand {
  private readonly formatterRegistry: GraphFormatterRegistry;

  constructor(runner: Runner, options: any = {}) {
    super(runner, options);
    this.formatterRegistry = new GraphFormatterRegistry();
  }

  public getDescription(): string {
    return 'Show task dependency graph in text, DOT, or JSON format';
  }
  
  public async execute(args: GraphCommandArgs): Promise<CommandResult> {
    try {
      const { taskName, format = 'text' } = args;
      
      if (this.runner.isQuiet()) {
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
      } catch (formatterError: any) {
        return {
          success: false,
          error: formatterError.message,
          message: 'Failed to format graph'
        };
      }
      
      return {
        success: true,
        message: `Graph displayed in ${format} format`,
        data: {
          format,
          taskName: taskName || 'all tasks'
        }
      };
      
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to display graph'
      };
    }
  }
}