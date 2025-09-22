import { createHash } from 'crypto';
import { createWriteStream, existsSync } from 'fs';
import { mkdir } from 'fs/promises';
import { join } from 'path';
import { pipeline } from 'stream/promises';
import { extract } from 'tar';
import type { IImportResolver, ImportSource } from './IImportResolver.js';
import type { AuthStrategyManager } from '../auth/AuthStrategyManager.js';

/**
 * HTTPS URL resolver
 * Single Responsibility: Resolve and download plugins from HTTPS URLs
 */
export class HttpsResolver implements IImportResolver {
  readonly type = 'https';

  constructor(
    private pluginsDir: string,
    private authManager: AuthStrategyManager
  ) {}

  matches(importString: string): boolean {
    return importString.startsWith('https://');
  }

  async resolve(importString: string): Promise<string> {
    if (!this.matches(importString)) {
      throw new Error(`HttpsResolver cannot resolve import: ${importString}`);
    }

    const url = importString;
    const urlHash = this.createUrlHash(url);
    const extractDir = join(this.pluginsDir, 'https', urlHash);

    // Check if already downloaded and extracted
    if (existsSync(extractDir)) {
      return extractDir;
    }

    try {
      // Download tar.gz file
      const tarPath = await this.downloadFile(url, urlHash);

      // Extract tar.gz
      await this.extractTarFile(tarPath, extractDir);

      return extractDir;
    } catch (error) {
      throw new Error(`Failed to resolve HTTPS plugin from ${url}: ${error}`);
    }
  }

  private createUrlHash(url: string): string {
    return createHash('sha256').update(url).digest('hex').substring(0, 16);
  }

  private async downloadFile(url: string, urlHash: string): Promise<string> {
    const urlObj = new URL(url);
    const headers = this.authManager.getAuthHeaders(urlObj);

    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Ensure download directory exists
    const downloadDir = join(this.pluginsDir, 'downloads');
    await mkdir(downloadDir, { recursive: true });

    const tarPath = join(downloadDir, `${urlHash}.tar.gz`);
    const fileStream = createWriteStream(tarPath);

    if (!response.body) {
      throw new Error('No response body');
    }

    // Convert ReadableStream to Node.js stream
    const nodeStream = new ReadableStream({
      start(controller) {
        const reader = response.body!.getReader();
        function pump(): any {
          return reader.read().then(({ done, value }) => {
            if (done) {
              controller.close();
              return;
            }
            controller.enqueue(value);
            return pump();
          });
        }
        return pump();
      }
    });

    // @ts-ignore - pipeline works with web streams in newer Node.js
    await pipeline(nodeStream, fileStream);

    return tarPath;
  }

  private async extractTarFile(tarPath: string, extractDir: string): Promise<void> {
    await mkdir(extractDir, { recursive: true });

    // Extract tar.gz file
    await extract({
      file: tarPath,
      cwd: extractDir,
      strip: 1 // Remove top-level directory from tar
    });
  }
}