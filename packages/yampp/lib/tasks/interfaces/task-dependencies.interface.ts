import { Parameter } from '../../core/types/parameter.js';

export interface ITaskDependencies {
  /**
   * Get list of task dependencies
   */
  getDependencies(): string[];

  /**
   * Get dependency parameters map
   */
  getDependencyParams(): Record<string, Parameter[]>;

  /**
   * Get dependency with its parameters formatted as string
   * @param depName - Dependency name
   */
  getDependencyWithParams(depName: string): string;
}