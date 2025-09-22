import { execSync } from 'child_process';
import { join } from 'path';
import { existsSync } from 'fs';
import type { IImportResolver, ImportSource } from './IImportResolver.js';

/**
 * Git repository resolver
 * Single Responsibility: Resolve and clone Git repositories
 */
export class GitResolver implements IImportResolver {
  readonly type = 'git';

  constructor(private pluginsDir: string) {}

  matches(importString: string): boolean {
    return importString.startsWith('git@') && importString.includes(':');
  }

  async resolve(importString: string): Promise<string> {
    if (!this.matches(importString)) {
      throw new Error(`GitResolver cannot resolve import: ${importString}`);
    }

    // Parse git@host:path format
    const match = importString.match(/^git@([^:]+):(.+)$/);
    if (!match) {
      throw new Error(`Invalid git URL format: ${importString}`);
    }

    const [, host, repoPath] = match;

    // Extract version/branch if specified with # (e.g., git@github.com:user/repo#branch)
    const [gitUrl, version] = importString.includes('#') ? importString.split('#') : [importString, null];

    const dirName = this.createDirName(host!, repoPath!);
    const localPath = join(this.pluginsDir, 'git', dirName);

    // Check if already cloned
    if (existsSync(localPath)) {
      // Update to latest or specific version
      this.updateRepository(localPath, version);
      return localPath;
    }

    try {
      // Clone repository
      execSync(`git clone ${gitUrl} "${localPath}"`, {
        stdio: 'pipe'
      });

      // Checkout specific version if provided
      if (version) {
        this.checkoutVersion(localPath, version);
      }

      return localPath;
    } catch (error) {
      throw new Error(`Failed to clone git repository ${gitUrl}: ${error}`);
    }
  }

  private createDirName(host: string, path: string): string {
    return `${host}_${path.replace(/\//g, '_')}`;
  }

  private updateRepository(localPath: string, version?: string | null): void {
    try {
      execSync('git fetch --all', { cwd: localPath, stdio: 'pipe' });

      if (version) {
        this.checkoutVersion(localPath, version);
      } else {
        execSync('git pull', { cwd: localPath, stdio: 'pipe' });
      }
    } catch (error) {
      // If update fails, continue with existing version
      console.warn(`Warning: Failed to update git repository at ${localPath}: ${error}`);
    }
  }

  private checkoutVersion(localPath: string, version: string): void {
    try {
      // Handle both tags (v1.0.0) and branches (main, feature-branch)
      execSync(`git checkout ${version}`, { cwd: localPath, stdio: 'pipe' });
    } catch (error) {
      throw new Error(`Failed to checkout version ${version}: ${error}`);
    }
  }
}