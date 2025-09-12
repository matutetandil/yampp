import { BaseInternalFunction } from './base-function.js';
import { InternalFunctionExecutionContext } from './internal-function-execution-context.interface.js';
import { FunctionMetadata } from '../core/function-metadata.js';
import { IInternalFunctionRegistry } from './internal-function-registry.interface.js';
import { IVariableMap } from '../core/types/variable-map.interface.js';
import { ITaskPromiseMap } from '../tasks/interfaces/task-promise-map.interface.js';
import { ILimit } from '../core/types/limit.interface.js';
import { IInternalFunction } from './internal-function.interface.js';
import { IFunctionPluginRegistry } from './interfaces/function-plugin-registry.interface.js';
import { FunctionPluginRegistry } from './function-plugin-registry.js';

/**
 * Registry for internal functions
 * Manages all internal function strategies and provides a clean API
 */

export class InternalFunctionRegistry implements IInternalFunctionRegistry {
  private readonly runner: any;
  private readonly functions: Map<string, BaseInternalFunction>;
  private readonly pluginRegistry: IFunctionPluginRegistry;

  constructor(runner: any, pluginRegistry?: IFunctionPluginRegistry) {
    this.runner = runner;
    this.functions = new Map();
    this.pluginRegistry = pluginRegistry || new FunctionPluginRegistry();
    this.initializePlugins();
  }

  /**
   * Initialize plugins and load their functions
   */
  private initializePlugins(): void {
    this.pluginRegistry.initializePlugins(this.runner);
    const pluginFunctions = this.pluginRegistry.getAllFunctions();
    
    for (const [name, func] of pluginFunctions) {
      this.functions.set(name, func);
    }
  }

  /**
   * Register a new internal function
   */
  public register(functionHandler: unknown): void {
    if (functionHandler instanceof BaseInternalFunction) {
      // Extract name from the handler (assuming it has a getName method or similar)
      const name = (functionHandler as any).getName?.() || (functionHandler as any).name;
      if (name) {
        this.functions.set(name, functionHandler);
      }
    }
  }

  /**
   * Register a new internal function by name
   */
  private registerByName(name: string, handler: BaseInternalFunction): void {
    this.functions.set(name, handler);
  }

  /**
   * Execute an internal function
   */
  public async execute(
    func: IInternalFunction,
    variables: IVariableMap,
    signature: string,
    taskPromises: ITaskPromiseMap,
    limit: ILimit,
    serialLimit: ILimit
  ): Promise<unknown> {
    const handler = this.functions.get(func.name);
    
    if (!handler) {
      if (!this.runner.quiet) {
        console.warn(`Warning: Unknown internal function __${func.name}`);
      }
      return null;
    }

    // Extract args from func.params for the handler
    const rawArgs = func.params || [];
    
    // Convert parameter objects to their values
    const args = rawArgs.map((param: any) => {
      if (param && typeof param === 'object' && param.value !== undefined) {
        return param.value;
      }
      return param;
    });
    
    const context = {
      variables,
      signature,
      taskPromises,
      limit,
      serialLimit
    };
    
    return await handler.execute(args, context);
  }

  /**
   * Check if a function is registered
   */
  public has(name: string): boolean {
    return this.functions.has(name);
  }

  /**
   * Get all registered function names
   */
  public getFunctionNames(): string[] {
    return Array.from(this.functions.keys());
  }

  /**
   * Unregister a function
   */
  public unregister(functionName: string): boolean {
    return this.functions.delete(functionName);
  }

  /**
   * Get all registered functions (alias for getFunctionNames for interface compatibility)
   */
  public getRegisteredFunctions(): string[] {
    return this.getFunctionNames();
  }

  /**
   * Get function metadata by name
   */
  public getFunctionMetadata(name: string): FunctionMetadata | null {
    const handler = this.functions.get(name);
    if (handler && typeof handler.getMetadata === 'function') {
      return handler.getMetadata();
    }
    return null;
  }

  /**
   * Register a plugin and load its functions
   */
  public registerPlugin(plugin: any): void {
    this.pluginRegistry.registerPlugin(plugin);
    
    // Reload all functions from plugins
    const pluginFunctions = this.pluginRegistry.getAllFunctions();
    this.functions.clear();
    
    for (const [name, func] of pluginFunctions) {
      this.functions.set(name, func);
    }
  }

  /**
   * Get the plugin registry for advanced plugin management
   */
  public getPluginRegistry(): IFunctionPluginRegistry {
    return this.pluginRegistry;
  }
}