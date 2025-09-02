import { BaseCommand } from './base-command.js';

/**
 * Clean command implementation
 * Removes all cache files and state
 */
export class CleanCommand extends BaseCommand {
  getDescription() {
    return 'Clean all .done cache files and task state';
  }
  
  async execute() {
    try {
      await this.runner.state.cleanAll();
      return {
        success: true,
        message: 'Cache cleaned successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to clean cache'
      };
    }
  }
}