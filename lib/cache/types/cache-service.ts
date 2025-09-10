import { TaskInstance } from '../../tasks/types/task-instance';

/**
 * Interface for cache management operations
 * Separated from Runner to achieve Single Responsibility Principle
 */
export interface CacheService {
  /**
   * Check if task should run based on cache and modifiers
   */
  shouldTaskRun(taskInstance: TaskInstance): Promise<boolean>;
  
  /**
   * Clean all cached task results
   */
  cleanAll(): Promise<void>;
  
  /**
   * Get timestamp of cached task
   */
  getTaskTimestamp(taskId: string): Promise<Date | null>;
  
  /**
   * Mark task as completed in cache
   */
  markTaskDone(taskId: string): Promise<void>;
  
  /**
   * Check if task is marked as done in cache
   */
  isTaskDone(taskId: string): Promise<boolean>;
}