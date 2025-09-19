/**
 * Interface for task interaction management
 * Focused on task calls and user interactions only
 */
export interface ITaskInteractions {
  /**
   * Get task calls (calls to other tasks)
   */
  getCalls(): unknown[];

  /**
   * Get task inputs (user prompts)
   */
  getInputs(): unknown[];
}