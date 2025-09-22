import { TaskCall } from '../types/task-call.js';
import { TaskInstance } from '../types/task-instance.js';
import { DryRunAnalysis } from '../../core/types/dry-run-analysis.js';

export interface ITaskDisplayService {
  listTasks(): void;
  showGraph(taskName?: string, format?: string): void;
  dryRun(taskCalls: TaskCall[]): Promise<void>;
  showPlan(taskCalls: TaskCall[]): Promise<void>;
  logTask(taskName: string, message: string, messageColor?: Function): void;
  analyzeDryRun(executionPlan: TaskInstance[]): Promise<DryRunAnalysis>;
}