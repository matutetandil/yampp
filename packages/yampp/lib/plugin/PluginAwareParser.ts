import { Parser } from '../parser.js';
import { PluginResolver } from './PluginResolver.js';
import type { ParseResult } from '../ast/types/parse-result.js';
import type { ParseOptions } from '../parser/types/parse-options.interface.js';
import type { IFunctionPluginRegistry } from '../internal-functions/interfaces/function-plugin-registry.interface.js';
import type { IModifierRegistry } from '../modifiers/interfaces/modifier-registry.interface.js';
import type { CommandRegistry } from '../commands/command-registry.js';

/**
 * Plugin-aware parser - Extends base parser with plugin processing
 * Single Responsibility: Parse yamfiles and process plugin imports
 */
export class PluginAwareParser extends Parser {
  private pluginResolver: PluginResolver | null = null;

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
      // For now, skip plugin processing if not initialized
      // This allows gradual integration without breaking existing functionality
      console.warn('Plugin imports found but plugin system not initialized. Skipping plugin processing.');
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
    // TODO: Make this async when we're ready for breaking changes
    return super.parse(content, options);
  }

  /**
   * Get the plugin resolver (for testing or advanced usage)
   */
  getPluginResolver(): PluginResolver | null {
    return this.pluginResolver;
  }
}