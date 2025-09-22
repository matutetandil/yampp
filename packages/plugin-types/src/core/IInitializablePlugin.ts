import type { IPlugin } from './IPlugin.js';
import type { IPluginContext } from '../dto/IPluginContext.js';

/**
 * Plugin that can be initialized
 * Single Responsibility: Plugin initialization lifecycle
 */
export interface IInitializablePlugin extends IPlugin {
  initialize(context: IPluginContext): Promise<void>;
}