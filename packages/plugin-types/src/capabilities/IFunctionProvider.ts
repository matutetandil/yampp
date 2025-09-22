import type { IInternalFunction } from '../abstractions/IInternalFunction.js';

/**
 * Plugin capability: Provides internal functions
 * Interface Segregation: Only for plugins that provide functions
 */
export interface IFunctionProvider {
  getFunctions(): Record<string, IInternalFunction>;
}