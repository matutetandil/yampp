export interface ITaskFileWatcher {
  /**
   * Get list of files being watched by this task
   */
  getWatchedFiles(): string[];

  /**
   * Check if task has files to watch
   */
  hasWatchedFiles(): boolean;
}