import type { AstNode } from '../ast/types/ast-node.js';
import { PluginManager } from './PluginManager.js';
import { PluginIntegrator } from './PluginIntegrator.js';
import type { ImportStatement } from './types/ImportStatement.js';
import type { IFunctionPluginRegistry } from '../internal-functions/interfaces/function-plugin-registry.interface.js';
import type { IModifierRegistry } from '../modifiers/interfaces/modifier-registry.interface.js';
import type { CommandRegistry } from '../commands/command-registry.js';

/**
 * Plugin resolver - Processes import statements and integrates plugins
 * Single Responsibility: Resolve and integrate plugins from AST imports
 */
export class PluginResolver {
  private pluginManager: PluginManager;
  private pluginIntegrator: PluginIntegrator;

  constructor(
    workingDirectory: string,
    functionRegistry: IFunctionPluginRegistry,
    modifierRegistry: IModifierRegistry,
    commandRegistry: CommandRegistry
  ) {
    this.pluginManager = new PluginManager(workingDirectory);
    this.pluginIntegrator = new PluginIntegrator(
      functionRegistry,
      modifierRegistry,
      commandRegistry
    );
  }

  /**
   * Process import statements from parsed AST
   */
  async processImports(ast: AstNode): Promise<void> {
    if (!ast.imports || ast.imports.length === 0) {
      return;
    }

    try {
      // Convert AST imports to ImportStatement format
      const importStatements = this.convertAstImports(ast.imports);

      // Resolve and load plugins
      await this.pluginManager.resolveImports(importStatements);

      // Get loaded plugins
      const loadedPlugins = Array.from(this.pluginManager.getLoadedPlugins().values());

      // Integrate plugins with existing registries
      this.pluginIntegrator.integratePlugins(loadedPlugins);

    } catch (error) {
      throw new Error(`Failed to process plugin imports: ${error}`);
    }
  }

  /**
   * Get the plugin manager instance
   */
  getPluginManager(): PluginManager {
    return this.pluginManager;
  }

  private convertAstImports(astImports: any[]): ImportStatement[] {
    return astImports.map(astImport => ({
      type: 'import',
      source: astImport.source,
      version: astImport.version,
      location: astImport.location
    }));
  }
}