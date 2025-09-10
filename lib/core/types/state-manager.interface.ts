export interface IStateManager {
  isTaskDone(taskId: string): Promise<boolean>;
  getTaskTimestamp(taskId: string): Promise<number>;
  markTaskDone(taskId: string): Promise<void>;
  cleanAll(): Promise<void>;
  clean(taskName: string): Promise<void>;
}