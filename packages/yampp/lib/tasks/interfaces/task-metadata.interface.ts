export interface ITaskMetadata {
  /**
   * Get task name
   */
  getName(): string;

  /**
   * Get task modifiers set
   */
  getModifiers(): Set<string>;

  /**
   * Get line number where task is defined in source file
   */
  getLineNumber(): number | null;

  /**
   * Check if task has a specific modifier
   * This is the extensible way to check modifiers without hardcoding
   * @param modifier - The modifier name to check
   */
  hasModifier(modifier: string): boolean;

  /**
   * Get task signature (unique identifier)
   */
  getSignature(): string;
}