import { TaskSummaryInfo } from '../../tasks/types/task-summary-info.js';
import { ExecutionSummaryData } from '../../execution/types/execution-summary-data.js';

export interface OutputManager {
  initialize(): void;
  cleanup(): void;
  startTask(taskId: string, taskName: string): void;
  addTaskOutput(taskId: string, data: string): void;
  completeTask(taskId: string, success?: boolean): void;
  log(message: string): void;
  error(message: string): void;
  addOutput(taskId: string, data: string, isError?: boolean): void;
  printSummary(completed: TaskSummaryInfo[] | Set<TaskSummaryInfo>, failed: TaskSummaryInfo[] | Set<TaskSummaryInfo>, duration?: string): void;
  showSummary(results: ExecutionSummaryData[]): void;
  pauseRefresh(): void;
  resumeRefresh(): void;
}