import type { YamppPlugin, IFunctionProvider } from '@yampp/plugin-types';
import type { IFunctionPlugin } from '../../internal-functions/interfaces/function-plugin.interface.js';
import { BaseInternalFunction } from '../../internal-functions/base-function.js';
import { FunctionMetadata } from '../../core/function-metadata.js';

/**
 * Adapter to integrate YamppPlugin with existing FunctionPluginRegistry
 * Single Responsibility: Bridge between new plugin system and existing function registry
 */
export class FunctionPluginAdapter implements IFunctionPlugin {
  private yamppPlugin: YamppPlugin & IFunctionProvider;
  private adaptedFunctions: Map<string, BaseInternalFunction> = new Map();

  constructor(yamppPlugin: YamppPlugin & IFunctionProvider) {
    this.yamppPlugin = yamppPlugin;
    this.adaptFunctions();
  }

  getName(): string {
    return this.yamppPlugin.name;
  }

  getVersion(): string {
    return this.yamppPlugin.version;
  }

  getDescription(): string {
    return this.yamppPlugin.description || '';
  }

  isCompatible(): boolean {
    // All YamppPlugins are compatible if they implement IFunctionProvider
    return true;
  }

  initialize(runner: any): void {
    // Initialize the yampp plugin if it has initialize method
    if ('initialize' in this.yamppPlugin && typeof this.yamppPlugin.initialize === 'function') {
      // Create a context for the plugin
      const context = this.createPluginContext(runner);
      this.yamppPlugin.initialize(context);
    }
  }

  getFunctions(): Map<string, BaseInternalFunction> {
    return new Map(this.adaptedFunctions);
  }

  private adaptFunctions(): void {
    const functions = this.yamppPlugin.getFunctions();

    for (const [name, func] of Object.entries(functions)) {
      const namespacedName = `${this.yamppPlugin.name}::${name}`;
      // Use normalized name for proxy system (this is what gets registered and used)
      const normalizedName = namespacedName.replace(/::/g, '_').replace(/-/g, '_');

      const adaptedFunction = this.createAdaptedFunction(normalizedName, func);

      // Only register with normalized name for unified function handling
      this.adaptedFunctions.set(normalizedName, adaptedFunction);
    }
  }

  private createAdaptedFunction(name: string, pluginFunction: any): BaseInternalFunction {
    return new (class extends BaseInternalFunction {
      getName(): string {
        return name;
      }

      getDescription(): string {
        return pluginFunction.getMetadata().getDescription();
      }

      getMetadata(): FunctionMetadata {
        const pluginMetadata = pluginFunction.getMetadata();
        return new FunctionMetadata()
          .setName(name)
          .setDescription(pluginMetadata.getDescription())
          .setReturnVariable(pluginMetadata.hasReturnVariable());
      }

      async execute(args: string[], context: any): Promise<string> {
        // Convert context to proper InternalFunctionExecutionContext
        const internalContext = {
          variables: context.variables || new Map(),
          signature: context.signature || '',
          taskPromises: context.taskPromises || new Map(),
          limit: context.limit || (() => {}),
          serialLimit: context.serialLimit || (() => {})
        };

        // Check if this is a return value function
        const hasReturnValue = pluginFunction.getMetadata().hasReturnVariable();

        if (hasReturnValue) {
          // For return value functions, first arg is variable name (added by bash processor)
          // Rest of args are for the plugin function
          if (args.length < 1) {
            throw new Error(`${name} requires at least 1 argument: variable name`);
          }

          const variableName = args[0];
          const pluginArgs = args.slice(1); // Arguments for the actual plugin function

          // Execute plugin function with actual arguments
          const result = await pluginFunction.execute(pluginArgs, internalContext);

          // Store result in variables using the variable name
          internalContext.variables.set(variableName, result);

          return result;
        } else {
          // For void functions, pass all args directly to plugin
          return pluginFunction.execute(args, internalContext);
        }
      }
    })();
  }

  private createPluginContext(runner: any): any {
    // Create a context that matches IPluginContext from @yampp/plugin-types
    return {
      version: '0.12.5', // TODO: Get from package.json
      workingDirectory: process.cwd(),
      logger: {
        debug: (msg: string) => console.debug(msg),
        info: (msg: string) => console.info(msg),
        warn: (msg: string) => console.warn(msg),
        error: (msg: string) => console.error(msg)
      },
      fileSystem: {
        readFile: async (path: string) => {
          const fs = await import('fs/promises');
          return fs.readFile(path, 'utf-8');
        },
        writeFile: async (path: string, content: string) => {
          const fs = await import('fs/promises');
          return fs.writeFile(path, content);
        },
        exists: async (path: string) => {
          const fs = await import('fs');
          return fs.existsSync(path);
        },
        mkdir: async (path: string, recursive = false) => {
          const fs = await import('fs/promises');
          return fs.mkdir(path, { recursive });
        },
        remove: async (path: string, recursive = false) => {
          const fs = await import('fs/promises');
          return fs.rm(path, { recursive, force: true });
        }
      },
      shell: {
        execute: async (command: string, options = {}) => {
          const { execSync } = await import('child_process');
          try {
            const start = Date.now();
            const result = execSync(command, { encoding: 'utf-8', ...options });
            return {
              exitCode: 0,
              stdout: result,
              stderr: '',
              duration: Date.now() - start
            };
          } catch (error: any) {
            return {
              exitCode: error.status || 1,
              stdout: error.stdout || '',
              stderr: error.stderr || error.message,
              duration: Date.now() - Date.now()
            };
          }
        }
      },
      config: {
        get: (key: string) => undefined, // TODO: Implement config system
        set: (key: string, value: any) => {}, // TODO: Implement config system
        has: (key: string) => false // TODO: Implement config system
      }
    };
  }
}