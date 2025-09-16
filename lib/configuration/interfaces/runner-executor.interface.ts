import { TaskCall } from '../../tasks/types/task-call';
import { ExecutionResult } from '../../execution/types/execution-result';
import { TaskInstance } from '../../tasks/types/task-instance';
import { IVariableMap } from '../../core/types/variable-map.interface';
import { ITaskPromiseMap } from '../../tasks/interfaces/task-promise-map.interface';
import { ILimit } from '../../core/types/limit.interface';

/**
 * Interface for Runner's execution responsibilities
 * Segregated from display and configuration concerns
 */
export interface IRunnerExecutor {
  execute(taskCalls: TaskCall[]): Promise<ExecutionResult>;

  buildExecutionPlan(taskCalls: TaskCall[]): Promise<TaskInstance[]>;

  executeCall(
    call: unknown,
    variables: IVariableMap,
    taskPromises: ITaskPromiseMap,
    limit: ILimit,
    serialLimit: ILimit,
    shouldIgnoreFailures?: boolean
  ): Promise<void>;

  shouldTaskRun(taskInstance: TaskInstance): Promise<boolean>;
}