import { BaseFunction } from '../functions/BaseFunction.js';

/**
 * Plugin capability: Provides internal functions
 * Interface Segregation: Only for plugins that provide functions
 */
export interface IFunctionProvider {
  getFunctions(): Record<string, BaseFunction>;
}