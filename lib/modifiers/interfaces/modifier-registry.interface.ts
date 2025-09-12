export interface IModifierRegistry {
  /**
   * Register a new modifier
   * @param name - The modifier name
   * @param description - Optional description of the modifier
   */
  registerModifier(name: string, description?: string): void;

  /**
   * Check if a modifier is registered
   * @param name - The modifier name to check
   * @returns True if the modifier is registered
   */
  isValidModifier(name: string): boolean;

  /**
   * Get all registered modifier names
   * @returns Array of registered modifier names
   */
  getRegisteredModifiers(): string[];

  /**
   * Get modifier description if available
   * @param name - The modifier name
   * @returns Description or undefined if not available
   */
  getModifierDescription(name: string): string | undefined;

  /**
   * Clear all registered modifiers
   */
  clearModifiers(): void;
}