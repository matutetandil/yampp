export interface ICacheService {
  clean(): Promise<void>;
  isTaskDone(taskId: string): Promise<boolean>;
  markTaskDone(taskId: string): Promise<void>;
  getTaskTimestamp(taskId: string): Promise<number>;
  cleanAll(): Promise<void>;
}