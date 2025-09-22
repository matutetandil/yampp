import { IFunctionPlugin } from './function-plugin.interface.js';

export interface IFunctionPluginRegistry {
  /**
   * Register a plugin
   * @param plugin - The plugin to register
   */
  registerPlugin(plugin: IFunctionPlugin): void;

  /**
   * Get all registered plugins
   * @returns Array of registered plugins
   */
  getPlugins(): IFunctionPlugin[];

  /**
   * Get plugin by name
   * @param name - The plugin name
   * @returns The plugin or null if not found
   */
  getPlugin(name: string): IFunctionPlugin | null;

  /**
   * Initialize all registered plugins
   * @param runner - The runner instance
   */
  initializePlugins(runner: any): void;

  /**
   * Get all functions from all plugins
   * @returns Map of function name to function instance
   */
  getAllFunctions(): Map<string, any>;

  /**
   * Check if a plugin is registered
   * @param name - The plugin name
   * @returns True if plugin is registered
   */
  hasPlugin(name: string): boolean;

  /**
   * Unregister a plugin
   * @param name - The plugin name
   * @returns True if plugin was unregistered
   */
  unregisterPlugin(name: string): boolean;
}