import { BaseInternalFunction } from '../base-function.js';

export interface IFunctionPlugin {
  /**
   * Get the name of this plugin
   */
  getName(): string;

  /**
   * Get the version of this plugin
   */
  getVersion(): string;

  /**
   * Get the description of this plugin
   */
  getDescription(): string;

  /**
   * Get all functions provided by this plugin
   * @returns Map of function name to function instance
   */
  getFunctions(): Map<string, BaseInternalFunction>;

  /**
   * Initialize the plugin with the runner context
   * @param runner - The runner instance
   */
  initialize(runner: any): void;

  /**
   * Check if the plugin is compatible with the current system
   * @returns True if compatible, false otherwise
   */
  isCompatible(): boolean;
}