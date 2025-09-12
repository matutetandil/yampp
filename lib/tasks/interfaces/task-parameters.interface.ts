import { Parameter } from '../../core/types/parameter.js';

export interface ITaskParameters {
  /**
   * Get task parameters definition
   */
  getParameters(): Parameter[];

  /**
   * Check if task has a specific parameter
   * @param name - Parameter name
   */
  hasParameter(name: string): boolean;
}