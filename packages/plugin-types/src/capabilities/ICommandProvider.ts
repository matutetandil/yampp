import type { ICommand } from '../abstractions/ICommand.js';

/**
 * Plugin capability: Provides CLI commands
 * Interface Segregation: Only for plugins that provide commands
 */
export interface ICommandProvider {
  getCommands(): Record<string, ICommand>;
}