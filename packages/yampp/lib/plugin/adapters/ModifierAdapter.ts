import type { YamppPlugin, IModifierProvider } from '@yampp/plugin-types';
import type { IModifierRegistry } from '../../modifiers/interfaces/modifier-registry.interface.js';

/**
 * Adapter to integrate YamppPlugin modifiers with existing ModifierRegistry
 * Single Responsibility: Bridge between new plugin modifiers and existing modifier registry
 */
export class ModifierAdapter {
  constructor(
    private yamppPlugin: YamppPlugin & IModifierProvider,
    private modifierRegistry: IModifierRegistry
  ) {}

  /**
   * Register all plugin modifiers with the existing registry
   */
  registerModifiers(): void {
    const modifiers = this.yamppPlugin.getModifiers();

    for (const [name, modifier] of Object.entries(modifiers)) {
      // Register modifier name and description with existing registry
      const modifierData = modifier as any;
      this.modifierRegistry.registerModifier(name, modifierData.description);
    }
  }

  /**
   * Get all modifier names from the plugin
   */
  getModifierNames(): string[] {
    const modifiers = this.yamppPlugin.getModifiers();
    return Object.keys(modifiers);
  }
}