/**
 * Task dependencies interface
 * Focused on task dependency management
 */
export interface IAstTaskDependencies {
  /**
   * Get task dependencies (required)
   */
  getDependencies(): string[];

  /**
   * Get optional task dependencies (can fail without blocking execution)
   */
  getOptionalDependencies(): string[];

  /**
   * Get dependency parameters
   */
  getDependencyParams(): Record<string, any>;
}