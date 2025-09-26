import type { IImportResolver, ImportSource } from './IImportResolver.js';
import { NpmResolver } from './NpmResolver.js';
import { GitResolver } from './GitResolver.js';
import { HttpsResolver } from './HttpsResolver.js';
import { FileResolver } from './FileResolver.js';
import type { AuthStrategyManager } from '../auth/AuthStrategyManager.js';

/**
 * Import resolver manager
 * Single Responsibility: Coordinate different import resolvers
 */
export class ImportResolverManager {
  private resolvers: Map<string, IImportResolver> = new Map();

  constructor(pluginsDir: string, authManager: AuthStrategyManager) {
    this.registerDefaultResolvers(pluginsDir, authManager);
  }

  private registerDefaultResolvers(pluginsDir: string, authManager: AuthStrategyManager): void {
    this.addResolver(new FileResolver(process.cwd(), pluginsDir)); // Add file resolver with current working directory and plugins dir
    this.addResolver(new NpmResolver(pluginsDir));
    this.addResolver(new GitResolver(pluginsDir));
    this.addResolver(new HttpsResolver(pluginsDir, authManager));
  }

  addResolver(resolver: IImportResolver): void {
    this.resolvers.set(resolver.type, resolver);
  }

  removeResolver(type: string): void {
    this.resolvers.delete(type);
  }

  async resolve(importString: string): Promise<string> {
    const resolver = this.findResolver(importString);
    if (!resolver) {
      throw new Error(`No resolver found for import: ${importString}`);
    }

    return resolver.resolve(importString);
  }

  private findResolver(importString: string): IImportResolver | null {
    for (const resolver of this.resolvers.values()) {
      if (resolver.matches(importString)) {
        return resolver;
      }
    }
    return null;
  }

  getAvailableTypes(): string[] {
    return Array.from(this.resolvers.keys());
  }
}