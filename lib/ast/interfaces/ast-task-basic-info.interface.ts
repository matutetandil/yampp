/**
 * Basic task information interface
 * Focused on core task identification and metadata
 */
export interface IAstTaskBasicInfo {
  /**
   * Get task name
   */
  getName(): string;

  /**
   * Get task modifiers
   */
  getModifiers(): string[];

  /**
   * Get task location information
   */
  getLocation(): any;
}