/**
 * Task dependencies interface
 * Focused on task dependency management
 */
export interface IAstTaskDependencies {
  /**
   * Get task dependencies
   */
  getDependencies(): string[];

  /**
   * Get dependency parameters
   */
  getDependencyParams(): Record<string, any>;
}