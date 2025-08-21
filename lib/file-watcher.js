import { statSync, existsSync } from 'fs';
import { glob } from 'glob';
import { resolve } from 'path';

export class FileWatcher {
  constructor() {
    this.fileCache = new Map(); // Cache for file stats
  }

  /**
   * Check if any watched files are newer than the target timestamp
   * @param {string[]} watchedFiles - Array of file patterns to watch
   * @param {number} targetTimestamp - Timestamp to compare against (usually cache file time)
   * @returns {Promise<boolean>} - True if any file is newer than target
   */
  async areFilesNewer(watchedFiles, targetTimestamp) {
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
    } catch (error) {
      // If there's an error checking files, assume they're newer (safer to re-run)
      console.warn(`Warning: Error checking watched files: ${error.message}`);
      return true;
    }
  }

  /**
   * Get the newest timestamp from a list of watched files
   * @param {string[]} watchedFiles - Array of file patterns to check
   * @returns {Promise<number>} - Newest timestamp, or 0 if no files exist
   */
  async getNewestTimestamp(watchedFiles) {
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
    } catch (error) {
      console.warn(`Warning: Error getting file timestamps: ${error.message}`);
    }

    return newestTime;
  }

  /**
   * Expand a file pattern using glob
   * @param {string} pattern - File pattern (can include globs)
   * @returns {Promise<string[]>} - Array of matching file paths
   */
  async expandPattern(pattern) {
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
    } catch (error) {
      // If glob fails, return the original pattern
      console.warn(`Warning: Error expanding pattern '${pattern}': ${error.message}`);
      return [pattern];
    }
  }

  /**
   * Check if a single file is newer than the target timestamp
   * @param {string} filePath - Path to the file
   * @param {number} targetTimestamp - Target timestamp to compare against
   * @returns {Promise<boolean>} - True if file is newer
   */
  async isFileNewer(filePath, targetTimestamp) {
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
   * @param {string} filePath - Path to the file
   * @returns {Promise<number>} - File modification timestamp in milliseconds
   */
  async getFileTimestamp(filePath) {
    // Check cache first
    if (this.fileCache.has(filePath)) {
      const cached = this.fileCache.get(filePath);
      // Cache for 1 second to avoid excessive stat calls
      if (Date.now() - cached.cacheTime < 1000) {
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
   * @param {string[]} watchedFiles - Array of file patterns to check
   * @returns {Promise<{missing: string[], existing: string[]}>} - Missing and existing files
   */
  async checkFilesExist(watchedFiles) {
    const missing = [];
    const existing = [];

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
  clearCache() {
    this.fileCache.clear();
  }
}