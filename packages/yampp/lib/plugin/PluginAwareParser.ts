import { Parser } from '../parser.js';
import { PluginResolver } from './PluginResolver.js';
import type { ParseResult } from '../ast/types/parse-result.js';
import type { ParseOptions } from '../parser/types/parse-options.interface.js';
import type { IFunctionPluginRegistry } from '../internal-functions/interfaces/function-plugin-registry.interface.js';
import type { IModifierRegistry } from '../modifiers/interfaces/modifier-registry.interface.js';
import type { CommandRegistry } from '../commands/command-registry.js';
import { ModifierRegistry } from '../modifiers/modifier-registry.js';
import { FunctionPluginRegistry } from '../internal-functions/function-plugin-registry.js';
import { CommandRegistry as ConcreteCommandRegistry } from '../commands/command-registry.js';

/**
 * Plugin-aware parser - Extends base parser with plugin processing
 * Single Responsibility: Parse yamfiles and process plugin imports
 */
export class PluginAwareParser extends Parser {
  private pluginResolver: PluginResolver | null = null;
  private functionRegistry: IFunctionPluginRegistry | null = null;

  /**
   * Initialize plugin resolver with registries
   */
  initializePluginResolver(
    workingDirectory: string,
    functionRegistry: IFunctionPluginRegistry,
    modifierRegistry: IModifierRegistry,
    commandRegistry: CommandRegistry
  ): void {
    this.pluginResolver = new PluginResolver(
      workingDirectory,
      functionRegistry,
      modifierRegistry,
      commandRegistry
    );
  }

  /**
   * Parse content and process plugins
   */
  async parseWithPlugins(content: string, options: ParseOptions = {}): Promise<ParseResult> {
    // First, do normal parsing
    const parseResult = this.parse(content, options);

    // Initialize plugin resolver if needed and there are imports
    if (!this.pluginResolver && parseResult.ast.imports && parseResult.ast.imports.length > 0) {
      this.autoInitializePluginResolver();
    }

    // Then process plugins if resolver is initialized
    if (this.pluginResolver && parseResult.ast.imports && parseResult.ast.imports.length > 0) {
      try {
        await this.pluginResolver.processImports(parseResult.ast);
      } catch (error) {
        throw new Error(`Plugin processing failed: ${error}`);
      }
    }

    return parseResult;
  }

  /**
   * Override parse to use parseWithPlugins by default
   */
  parse(content: string, options: ParseOptions = {}): ParseResult {
    // For now, just call parent parse to maintain compatibility
    const result = super.parse(content, options);


    return result;
  }

  /**
   * Auto-initialize plugin resolver with minimal registries
   * This enables basic plugin processing without external dependencies
   */
  private autoInitializePluginResolver(): void {
    // Create minimal registries for plugin processing
    this.functionRegistry = new FunctionPluginRegistry();
    const modifierRegistry = new ModifierRegistry();
    const commandRegistry = new ConcreteCommandRegistry();

    // Initialize with current working directory
    this.initializePluginResolver(
      process.cwd(),
      this.functionRegistry,
      modifierRegistry,
      commandRegistry
    );

  }

  /**
   * Get the plugin resolver (for testing or advanced usage)
   */
  getPluginResolver(): PluginResolver | null {
    return this.pluginResolver;
  }

  /**
   * Get loaded plugin functions as BaseInternalFunction for unified registry
   */
  getPluginFunctions(): Map<string, any> {
    if (!this.functionRegistry) {
      return new Map();
    }

    // Access the function registry that was created during auto-initialization
    // It contains the adapted plugin functions
    return this.functionRegistry.getAllFunctions();
  }
}