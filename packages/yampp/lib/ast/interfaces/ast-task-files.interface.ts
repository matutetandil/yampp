/**
 * Task file watching interface
 * Focused on file watching functionality
 */
export interface IAstTaskFiles {
  /**
   * Get watched files
   */
  getWatchedFiles(): string[];
}