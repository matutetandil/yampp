import { execSync } from 'child_process';
import { join } from 'path';
import { existsSync } from 'fs';
import type { IImportResolver, ImportSource } from './IImportResolver.js';

/**
 * NPM package resolver
 * Single Responsibility: Resolve and install NPM packages using pnpm
 */
export class NpmResolver implements IImportResolver {
  readonly type = 'npm';

  constructor(private pluginsDir: string) {}

  matches(importString: string): boolean {
    // NPM packages: @scope/package, @scope/package@version, package, package@version
    return /^(@[a-zA-Z0-9_-]+\/)?[a-zA-Z0-9_-]+(@[a-zA-Z0-9.-]+)?$/.test(importString);
  }

  async resolve(importString: string): Promise<string> {
    if (!this.matches(importString)) {
      throw new Error(`NpmResolver cannot resolve import: ${importString}`);
    }

    // Parse package name and version from string like "@scope/package@1.0.0"
    const [packageName, version] = this.parsePackageString(importString);
    const packageSpec = version ? `${packageName}@${version}` : packageName;
    const packagePath = join(this.pluginsDir, 'node_modules', packageName);

    // Check if already installed
    if (existsSync(packagePath)) {
      return packagePath;
    }

    try {
      // Install using pnpm
      execSync(`pnpm add ${packageSpec}`, {
        cwd: this.pluginsDir,
        stdio: 'pipe'
      });

      return packagePath;
    } catch (error) {
      throw new Error(`Failed to install npm package ${packageSpec}: ${error}`);
    }
  }

  private parsePackageString(importString: string): [string, string | null] {
    // Handle @scope/package@version or package@version
    const lastAtIndex = importString.lastIndexOf('@');

    if (lastAtIndex === 0 || lastAtIndex === -1) {
      // No version specified or it's a scoped package without version
      return [importString, null];
    }

    const packageName = importString.substring(0, lastAtIndex);
    const version = importString.substring(lastAtIndex + 1);

    // If package name starts with @ and has no slash, it's invalid
    if (packageName.startsWith('@') && !packageName.includes('/')) {
      return [importString, null];
    }

    return [packageName, version];
  }
}