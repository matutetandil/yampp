/**
 * Interface for display control operations  
 * Focused on screen/terminal display management
 */
export interface IDisplayController {
  /**
   * Clear the output display
   */
  clear(): void;

  /**
   * Print execution summary
   */
  printSummary(completed: Set<string>, failed: Set<string>, duration: string): void;
}