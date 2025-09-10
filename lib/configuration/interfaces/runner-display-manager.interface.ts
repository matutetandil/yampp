import { TaskCall } from '../../tasks/types/task-call';

/**
 * Interface for Runner's display responsibilities
 * Segregated from execution and configuration concerns
 */
export interface IRunnerDisplayManager {
  listTasks(): void;

  showGraph(taskName?: string, format?: string): void;

  dryRun(taskCalls: TaskCall[]): Promise<void>;

  showPlan(taskCalls: TaskCall[]): Promise<void>;

  logTask(taskName: string, message: string, messageColor?: Function): void;
}