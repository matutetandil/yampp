import type { YamppPlugin, IFunctionProvider, IModifierProvider, ICommandProvider } from '@yampp/plugin-types';
import { FunctionPluginAdapter } from './adapters/FunctionPluginAdapter.js';
import { ModifierAdapter } from './adapters/ModifierAdapter.js';
import { CommandAdapter } from './adapters/CommandAdapter.js';
import type { IFunctionPluginRegistry } from '../internal-functions/interfaces/function-plugin-registry.interface.js';
import type { IModifierRegistry } from '../modifiers/interfaces/modifier-registry.interface.js';
import type { CommandRegistry } from '../commands/command-registry.js';

/**
 * Plugin integrator - Coordinates plugin integration with existing registries
 * Single Responsibility: Integrate loaded plugins with yampp's existing systems
 */
export class PluginIntegrator {
  constructor(
    private functionRegistry: IFunctionPluginRegistry,
    private modifierRegistry: IModifierRegistry,
    private commandRegistry: CommandRegistry
  ) {}

  /**
   * Integrate a loaded plugin with all applicable registries
   */
  integratePlugin(plugin: YamppPlugin): void {
    // Integrate functions if plugin provides them
    if (this.implementsInterface<IFunctionProvider>(plugin, 'getFunctions')) {
      this.integrateFunctions(plugin);
    }

    // Integrate modifiers if plugin provides them
    if (this.implementsInterface<IModifierProvider>(plugin, 'getModifiers')) {
      this.integrateModifiers(plugin);
    }

    // Integrate commands if plugin provides them
    if (this.implementsInterface<ICommandProvider>(plugin, 'getCommands')) {
      this.integrateCommands(plugin);
    }
  }

  /**
   * Integrate multiple plugins
   */
  integratePlugins(plugins: YamppPlugin[]): void {
    for (const plugin of plugins) {
      try {
        this.integratePlugin(plugin);
      } catch (error) {
        console.warn(`Failed to integrate plugin '${plugin.name}': ${error}`);
      }
    }
  }

  private integrateFunctions(plugin: YamppPlugin & IFunctionProvider): void {
    const adapter = new FunctionPluginAdapter(plugin);
    this.functionRegistry.registerPlugin(adapter);
  }

  private integrateModifiers(plugin: YamppPlugin & IModifierProvider): void {
    const adapter = new ModifierAdapter(plugin, this.modifierRegistry);
    adapter.registerModifiers();
  }

  private integrateCommands(plugin: YamppPlugin & ICommandProvider): void {
    const adapter = new CommandAdapter(plugin);
    const commandClasses = adapter.createCommandClasses();

    for (const [name, CommandClass] of commandClasses) {
      this.commandRegistry.register(name, CommandClass);
    }
  }

  private implementsInterface<T>(obj: any, methodName: keyof T): obj is T {
    return obj && typeof obj[methodName] === 'function';
  }
}