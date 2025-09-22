/**
 * Interface for reading configuration settings
 * Focused on configuration access operations
 */
export interface IConfigurationReader {
  /**
   * Get maximum number of parallel jobs
   */
  getMaxJobs(): number;

  /**
   * Check if verbose mode is enabled
   */
  isVerbose(): boolean;

  /**
   * Check if quiet mode is enabled
   */
  isQuiet(): boolean;
}