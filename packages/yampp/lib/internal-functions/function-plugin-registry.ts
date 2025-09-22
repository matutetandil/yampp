import { IFunctionPluginRegistry } from './interfaces/function-plugin-registry.interface.js';
import { IFunctionPlugin } from './interfaces/function-plugin.interface.js';
import { CoreFunctionsPlugin } from './plugins/core-functions-plugin.js';
import { BaseInternalFunction } from './base-function.js';

export class FunctionPluginRegistry implements IFunctionPluginRegistry {
  private readonly plugins = new Map<string, IFunctionPlugin>();
  private runner: any;

  constructor() {
    // Register core functions plugin by default
    this.registerPlugin(new CoreFunctionsPlugin());
  }

  public registerPlugin(plugin: IFunctionPlugin): void {
    if (!plugin.isCompatible()) {
      console.warn(`Plugin ${plugin.getName()} is not compatible with this system`);
      return;
    }

    this.plugins.set(plugin.getName(), plugin);
    
    // Initialize if runner is available
    if (this.runner) {
      plugin.initialize(this.runner);
    }
  }

  public getPlugins(): IFunctionPlugin[] {
    return Array.from(this.plugins.values());
  }

  public getPlugin(name: string): IFunctionPlugin | null {
    return this.plugins.get(name) || null;
  }

  public initializePlugins(runner: any): void {
    this.runner = runner;
    
    for (const plugin of this.plugins.values()) {
      try {
        plugin.initialize(runner);
      } catch (error) {
        console.warn(`Failed to initialize plugin ${plugin.getName()}:`, error);
      }
    }
  }

  public getAllFunctions(): Map<string, BaseInternalFunction> {
    const allFunctions = new Map<string, BaseInternalFunction>();
    
    for (const plugin of this.plugins.values()) {
      const pluginFunctions = plugin.getFunctions();
      
      for (const [name, func] of pluginFunctions) {
        if (allFunctions.has(name)) {
          console.warn(`Function name collision: '${name}' is provided by multiple plugins`);
        }
        allFunctions.set(name, func);
      }
    }
    
    return allFunctions;
  }

  public hasPlugin(name: string): boolean {
    return this.plugins.has(name);
  }

  public unregisterPlugin(name: string): boolean {
    return this.plugins.delete(name);
  }
}