import { resolve, join, isAbsolute } from 'path';
import { existsSync } from 'fs';
import type { IImportResolver, ImportSource } from './IImportResolver.js';
import type { IAuthStrategy } from '../auth/IAuthStrategy.js';

/**
 * File resolver - Resolves local file:// imports
 * Single Responsibility: Handle local file system plugin resolution
 */
export class FileResolver implements IImportResolver {
  readonly type = 'file';

  constructor(private workingDirectory: string) {}

  matches(importString: string): boolean {
    return importString.startsWith('file://');
  }

  async resolve(importString: string): Promise<string> {
    if (!this.matches(importString)) {
      throw new Error('FileResolver can only resolve file:// imports');
    }

    // Extract path from file:// URL
    const filePath = importString.replace(/^file:\/\//, '');

    let resolvedPath: string;

    // Handle absolute vs relative paths
    if (isAbsolute(filePath)) {
      resolvedPath = filePath;
    } else {
      // Resolve relative to working directory
      resolvedPath = resolve(this.workingDirectory, filePath);
    }

    // Check if path exists
    if (!existsSync(resolvedPath)) {
      throw new Error(`Local plugin path does not exist: ${resolvedPath}`);
    }

    // For file:// imports, we just return the resolved path
    // The PluginManager will handle loading from this path
    return resolvedPath;
  }

  getPriority(): number {
    return 100; // High priority - local files should be checked first
  }

  getDescription(): string {
    return 'Resolves file:// imports to local file system paths';
  }
}