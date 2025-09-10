import { BaseCommand } from './base-command.js';
import { CommandResult } from '../core/types/command-result.interface.js';
import { CommandOptions } from '../core/types/command-options.interface.js';

/**
 * Clean command implementation
 * Removes all cache files and state
 */
export class CleanCommand extends BaseCommand {
  public getDescription(): string {
    return 'Clean all .done cache files and task state';
  }
  
  public async execute(): Promise<CommandResult> {
    try {
      await this.runner.getState().cleanAll();
      return {
        success: true,
        message: 'Cache cleaned successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to clean cache'
      };
    }
  }
}