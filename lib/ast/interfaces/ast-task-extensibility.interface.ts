/**
 * Task extensibility interface
 * Focused on dynamic property access for future extensibility
 */
export interface IAstTaskExtensibility {
  /**
   * Check if task has specific property
   */
  hasProperty(propertyName: string): boolean;

  /**
   * Get raw property value (escape hatch for extensibility)
   */
  getRawProperty(propertyName: string): any;
}