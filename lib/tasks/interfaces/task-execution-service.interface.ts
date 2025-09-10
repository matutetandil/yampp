import { TaskCall } from '../types/task-call.js';
import { TaskInstance } from '../types/task-instance.js';
import { ExecutionResult } from '../../execution/types/execution-result.js';
import { IVariableMap } from '../../core/types/variable-map.interface.js';
import { ITaskPromiseMap } from '../interfaces/task-promise-map.interface.js';
import { ILimit } from '../../core/types/limit.interface.js';

export interface ITaskExecutionService {
  execute(taskCalls: TaskCall[]): Promise<ExecutionResult>;
  buildExecutionPlan(taskCalls: TaskCall[]): Promise<TaskInstance[]>;
  shouldTaskRun(taskInstance: TaskInstance): Promise<boolean>;
  executeCall(
    call: unknown,
    variables: IVariableMap,
    taskPromises: ITaskPromiseMap,
    limit: ILimit,
    serialLimit: ILimit
  ): Promise<void>;
  executeUnifiedTaskBlock(
    task: unknown,
    signature: string,
    taskId: string,
    variables: IVariableMap,
    taskInstance: TaskInstance
  ): Promise<boolean>;
}