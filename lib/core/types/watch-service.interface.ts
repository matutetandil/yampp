import { TaskCall } from '../../tasks/types/task-call.js';

export interface IWatchService {
  watch(taskCalls: TaskCall[]): Promise<void>;
  hasModifier(task: unknown, modifier: string): boolean;
  getWatches(task: unknown): string[];
}