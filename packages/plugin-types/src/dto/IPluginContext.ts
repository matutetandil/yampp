import type { ILogger } from '../abstractions/ILogger.js';
import type { IFileSystem } from '../abstractions/IFileSystem.js';
import type { IShellExecutor } from '../abstractions/IShellExecutor.js';
import type { IConfigurationManager } from '../abstractions/IConfigurationManager.js';

/**
 * Plugin context DTO
 * Single Responsibility: Context data for plugin initialization
 */
export interface IPluginContext {
  readonly version: string;
  readonly workingDirectory: string;
  readonly logger: ILogger;
  readonly fileSystem: IFileSystem;
  readonly shell: IShellExecutor;
  readonly config: IConfigurationManager;
}