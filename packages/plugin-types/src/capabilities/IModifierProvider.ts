import type { IModifier } from '../abstractions/IModifier.js';

/**
 * Plugin capability: Provides task modifiers
 * Interface Segregation: Only for plugins that provide modifiers
 */
export interface IModifierProvider {
  getModifiers(): Record<string, IModifier>;
}