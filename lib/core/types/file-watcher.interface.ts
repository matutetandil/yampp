import { FileExistenceResult } from './file-existence-result.js';

/**
 * Interface for file watching and glob expansion functionality
 * Abstracts file system operations for better testability and DIP compliance
 */
export interface IFileWatcher {
  /**
   * Check if any watched files are newer than target timestamp
   */
  areFilesNewer(watchedFiles: string[], targetTimestamp: number): Promise<boolean>;

  /**
   * Expand glob patterns to actual file paths
   */
  expandGlobs(patterns: string[]): Promise<string[]>;

  /**
   * Check existence of multiple files
   */
  checkFileExistence(filePaths: string[]): Promise<FileExistenceResult>;
}