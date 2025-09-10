import { Runner } from '../runner.js';
import { CommandResult } from '../core/types/command-result.interface.js';
import { CommandOptions } from '../core/types/command-options.interface.js';

/**
 * Abstract base class for all CLI commands
 * Implements Strategy pattern for command execution
 */
export abstract class BaseCommand {
  protected readonly runner: Runner;
  protected readonly options: CommandOptions;

  constructor(runner: Runner, options: CommandOptions = {}) {
    this.runner = runner;
    this.options = options;
  }
  
  /**
   * Execute the command with given arguments
   */
  public abstract execute(args?: any): Promise<CommandResult>;
  
  /**
   * Get human-readable description of this command
   */
  public abstract getDescription(): string;
  
  /**
   * Get command name for registry
   */
  public getName(): string {
    return this.constructor.name.toLowerCase().replace('command', '');
  }
}