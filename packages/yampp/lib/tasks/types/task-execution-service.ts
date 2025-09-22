import { TaskInstance } from './task-instance.js';
import { TaskCall } from './task-call.js';
import { ExecutionResult } from '../../execution/types/execution-result.js';

/**
 * Interface for task execution logic
 * Separated from Runner to achieve Single Responsibility Principle
 */
export interface TaskExecutionService {
  /**
   * Execute task instances according to execution plan
   */
  execute(taskInstances: TaskInstance[], taskCalls: TaskCall[]): Promise<ExecutionResult>;
  
  /**
   * Execute a single task instance with cooperative control
   */
  executeTaskInstance(taskInstance: TaskInstance, taskPromises: Map<string, Promise<any>>, limit: any, serialLimit: any): Promise<void>;
  
  /**
   * Execute unified task block with internal functions
   */
  executeUnifiedTaskBlock(task: any, signature: string, taskId: string, variables: Map<string, any>, taskInstance: TaskInstance): Promise<boolean>;
  
  /**
   * Execute internal function call
   */
  executeCall(call: any, variables: Map<string, any>, taskPromises: Map<string, Promise<any>>, limit: any, serialLimit: any, shouldIgnoreFailures?: boolean): Promise<void>;
  
  /**
   * Check if task needs unified processing
   */
  taskNeedsUnifiedProcessing(task: any): boolean;
}