import { join } from 'path';
import { mkdir, writeFile, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import type { YamppPlugin } from '@yampp/plugin-types';
import { AuthStrategyManager } from './auth/AuthStrategyManager.js';
import { ImportResolverManager } from './resolvers/ImportResolverManager.js';
import type { ImportStatement } from './types/ImportStatement.js';

/**
 * Plugin manager - Central coordinator for plugin system
 * Single Responsibility: Manage plugin lifecycle (resolve, load, register)
 */
export class PluginManager {
  private loadedPlugins: Map<string, YamppPlugin> = new Map();
  private pluginsDir: string;
  private authManager: AuthStrategyManager;
  private resolverManager: ImportResolverManager;

  constructor(workingDirectory: string) {
    this.pluginsDir = join(workingDirectory, '.yampp-plugins');
    this.authManager = new AuthStrategyManager();
    this.resolverManager = new ImportResolverManager(this.pluginsDir, this.authManager);
  }

  /**
   * Initialize plugins directory and package.json
   */
  async initialize(): Promise<void> {
    await mkdir(this.pluginsDir, { recursive: true });
    await this.ensurePackageJson();
  }

  /**
   * Resolve and load plugins from import statements
   */
  async resolveImports(imports: ImportStatement[]): Promise<void> {
    await this.initialize();

    for (const importStmt of imports) {
      try {
        await this.resolveAndLoadPlugin(importStmt);
      } catch (error) {
        throw new Error(`Failed to resolve import ${JSON.stringify(importStmt.source)}: ${error}`);
      }
    }
  }

  /**
   * Get all loaded plugins
   */
  getLoadedPlugins(): ReadonlyMap<string, YamppPlugin> {
    return this.loadedPlugins;
  }

  /**
   * Get plugin by name
   */
  getPlugin(name: string): YamppPlugin | undefined {
    return this.loadedPlugins.get(name);
  }

  private async resolveAndLoadPlugin(importStmt: ImportStatement): Promise<void> {
    // Resolve plugin location using new string-based approach
    const pluginPath = await this.resolverManager.resolve(importStmt.source);

    // Load plugin
    const plugin = await this.loadPlugin(pluginPath);

    // Register plugin
    this.registerPlugin(plugin);
  }

  private async loadPlugin(pluginPath: string): Promise<YamppPlugin> {
    try {
      // Try to find the main entry point
      const entryPoint = await this.findEntryPoint(pluginPath);

      // Dynamic import the plugin
      const pluginModule = await import(entryPoint);
      const plugin = pluginModule.default || pluginModule;

      if (!this.isValidPlugin(plugin)) {
        throw new Error('Invalid plugin structure');
      }

      return plugin;
    } catch (error) {
      throw new Error(`Failed to load plugin from ${pluginPath}: ${error}`);
    }
  }

  private async findEntryPoint(pluginPath: string): Promise<string> {
    // Check for package.json main field
    const packageJsonPath = join(pluginPath, 'package.json');
    if (existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf-8'));
        if (packageJson.main) {
          return join(pluginPath, packageJson.main);
        }
      } catch {
        // Fall through to default checks
      }
    }

    // Try common entry points
    const candidates = [
      'index.js',
      'index.mjs',
      'plugin.js',
      'plugin.mjs',
      'dist/index.js',
      'lib/index.js'
    ];

    for (const candidate of candidates) {
      const candidatePath = join(pluginPath, candidate);
      if (existsSync(candidatePath)) {
        return candidatePath;
      }
    }

    throw new Error(`No entry point found in plugin directory: ${pluginPath}`);
  }

  private isValidPlugin(plugin: any): plugin is YamppPlugin {
    return plugin &&
           typeof plugin === 'object' &&
           typeof plugin.name === 'string' &&
           typeof plugin.version === 'string';
  }

  private registerPlugin(plugin: YamppPlugin): void {
    if (this.loadedPlugins.has(plugin.name)) {
      throw new Error(`Plugin '${plugin.name}' is already loaded`);
    }

    this.loadedPlugins.set(plugin.name, plugin);
  }

  private async ensurePackageJson(): Promise<void> {
    const packageJsonPath = join(this.pluginsDir, 'package.json');

    if (!existsSync(packageJsonPath)) {
      const packageJson = {
        name: 'yampp-plugins',
        version: '1.0.0',
        private: true,
        type: 'module',
        dependencies: {}
      };

      await writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
    }
  }
}