import type { ITaskInfo } from '../dto/ITaskInfo.js';
import type { ITaskResult } from '../dto/ITaskResult.js';

/**
 * Plugin capability: Hooks into task lifecycle
 * Interface Segregation: Only for plugins that need lifecycle hooks
 */
export interface ITaskLifecycleHooks {
  beforeTask?(task: ITaskInfo): Promise<void>;
  afterTask?(task: ITaskInfo, result: ITaskResult): Promise<void>;
}