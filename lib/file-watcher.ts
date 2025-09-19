import { statSync, existsSync } from 'fs';
import { glob } from 'glob';
import { resolve } from 'path';
import { FileCacheEntry } from './cache/types/file-cache-entry.js';
import { FileExistenceResult } from './core/types/file-existence-result.js';
import { IFileWatcher } from './core/types/file-watcher.interface.js';

export class FileWatcher implements IFileWatcher {
  private readonly fileCache: Map<string, FileCacheEntry>;

  constructor() {
    this.fileCache = new Map(); // Cache for file stats
  }

  /**
   * Check if any watched files are newer than the target timestamp
   */
  public async areFilesNewer(watchedFiles: string[], targetTimestamp: number): Promise<boolean> {
    if (!watchedFiles || watchedFiles.length === 0) {
      return false; // No files to watch
    }

    try {
      for (const pattern of watchedFiles) {
        const files = await this.expandPattern(pattern);
        
        for (const file of files) {
          if (await this.isFileNewer(file, targetTimestamp)) {
            return true;
          }
        }
      }
      return false;
    } catch (error: any) {
      // If there's an error checking files, assume they're newer (safer to re-run)
      console.warn(`Warning: Error checking watched files: ${error.message}`);
      return true;
    }
  }

  /**
   * Get the newest timestamp from a list of watched files
   */
  public async getNewestTimestamp(watchedFiles: string[]): Promise<number> {
    if (!watchedFiles || watchedFiles.length === 0) {
      return 0;
    }

    let newestTime = 0;
    
    try {
      for (const pattern of watchedFiles) {
        const files = await this.expandPattern(pattern);
        
        for (const file of files) {
          const time = await this.getFileTimestamp(file);
          if (time > newestTime) {
            newestTime = time;
          }
        }
      }
    } catch (error: any) {
      console.warn(`Warning: Error getting file timestamps: ${error.message}`);
    }

    return newestTime;
  }

  /**
   * Expand a file pattern using glob
   */
  private async expandPattern(pattern: string): Promise<string[]> {
    try {
      // If it's not a glob pattern, just return it as-is
      if (!pattern.includes('*') && !pattern.includes('?') && !pattern.includes('[')) {
        return [pattern];
      }

      // Use glob to expand the pattern
      const files = await glob(pattern, {
        nodir: true, // Only return files, not directories
        absolute: false // Return relative paths
      });

      return files;
    } catch (error: any) {
      // If glob fails, return the original pattern
      console.warn(`Warning: Error expanding pattern '${pattern}': ${error.message}`);
      return [pattern];
    }
  }

  /**
   * Check if a single file is newer than the target timestamp
   */
  private async isFileNewer(filePath: string, targetTimestamp: number): Promise<boolean> {
    try {
      const fileTimestamp = await this.getFileTimestamp(filePath);
      return fileTimestamp > targetTimestamp;
    } catch (error) {
      // If file doesn't exist or can't be read, consider it "newer" to force re-run
      return true;
    }
  }

  /**
   * Get the modification timestamp of a file
   */
  private async getFileTimestamp(filePath: string): Promise<number> {
    // Check cache first
    if (this.fileCache.has(filePath)) {
      const cached = this.fileCache.get(filePath);
      // Cache for 1 second to avoid excessive stat calls
      if (cached && Date.now() - cached.cacheTime < 1000) {
        return cached.timestamp;
      }
    }

    try {
      if (!existsSync(filePath)) {
        // File doesn't exist, return 0
        this.fileCache.set(filePath, { timestamp: 0, cacheTime: Date.now() });
        return 0;
      }

      const stats = statSync(filePath);
      const timestamp = stats.mtimeMs;
      
      // Cache the result
      this.fileCache.set(filePath, { timestamp, cacheTime: Date.now() });
      
      return timestamp;
    } catch (error) {
      // On error, return 0 and cache it
      this.fileCache.set(filePath, { timestamp: 0, cacheTime: Date.now() });
      return 0;
    }
  }

  /**
   * Check if all watched files exist
   */
  public async checkFilesExist(watchedFiles: string[]): Promise<FileExistenceResult> {
    const missing: string[] = [];
    const existing: string[] = [];

    if (!watchedFiles || watchedFiles.length === 0) {
      return { missing, existing };
    }

    for (const pattern of watchedFiles) {
      const files = await this.expandPattern(pattern);
      
      if (files.length === 0) {
        missing.push(pattern);
        continue;
      }

      for (const file of files) {
        if (existsSync(file)) {
          existing.push(file);
        } else {
          missing.push(file);
        }
      }
    }

    return { missing, existing };
  }

  /**
   * Clear the file cache
   */
  public clearCache(): void {
    this.fileCache.clear();
  }

  // IFileWatcher interface implementation
  /**
   * Expand glob patterns to actual file paths
   */
  public async expandGlobs(patterns: string[]): Promise<string[]> {
    const allFiles: string[] = [];
    for (const pattern of patterns) {
      try {
        const expandedFiles = await this.expandPattern(pattern);
        allFiles.push(...expandedFiles);
      } catch (error) {
        // Skip invalid patterns
        console.warn(`Warning: Could not expand pattern ${pattern}`);
      }
    }
    return [...new Set(allFiles)]; // Remove duplicates
  }

  /**
   * Check existence of multiple files (alias for checkFilesExist)
   */
  public async checkFileExistence(filePaths: string[]): Promise<FileExistenceResult> {
    return this.checkFilesExist(filePaths);
  }
}