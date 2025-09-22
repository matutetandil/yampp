/**
 * File watcher for monitoring file changes
 */
export interface FileWatcher {
  /**
   * Check if files are newer than cache timestamp
   */
  areFilesNewer(files: string[], cacheTimestamp: number): Promise<boolean>;
}