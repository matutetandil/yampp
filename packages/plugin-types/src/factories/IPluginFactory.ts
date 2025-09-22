import type { IPlugin } from '../core/IPlugin.js';
import type { IPluginConfig } from '../dto/IPluginConfig.js';

/**
 * Plugin factory interface
 * Single Responsibility: Plugin creation
 */
export interface IPluginFactory {
  createPlugin(config: IPluginConfig): IPlugin;
}