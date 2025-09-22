import type { IShellOptions } from '../dto/IShellOptions.js';
import type { IShellResult } from '../dto/IShellResult.js';

/**
 * Shell executor abstraction
 * Dependency Inversion: Plugin depends on abstraction, not implementation
 */
export interface IShellExecutor {
  execute(command: string, options?: IShellOptions): Promise<IShellResult>;
}