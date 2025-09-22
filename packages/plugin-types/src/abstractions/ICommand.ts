import type { ICommandOption } from '../dto/ICommandOption.js';

/**
 * CLI command abstraction
 * Single Responsibility: Define contract for CLI commands
 */
export interface ICommand {
  readonly name: string;
  readonly description?: string;
  readonly options?: readonly ICommandOption[];
  execute(args: string[], options: Record<string, any>): Promise<void>;
}