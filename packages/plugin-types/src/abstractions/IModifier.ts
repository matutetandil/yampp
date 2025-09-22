import type { ITaskInfo } from '../dto/ITaskInfo.js';

/**
 * Task modifier abstraction
 * Single Responsibility: Define contract for task modification
 */
export interface IModifier {
  readonly name: string;
  readonly description?: string;
  apply(task: ITaskInfo): ITaskInfo;
}