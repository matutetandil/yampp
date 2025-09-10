import { TaskCall } from '../tasks/types/task-call.js';
import { TaskInstance } from '../tasks/types/task-instance.js';
import { ExecutionResult } from '../execution/types/execution-result.js';
import { ITaskExecutionService } from '../tasks/interfaces/task-execution-service.interface.js';
import { IVariableMap } from '../core/types/variable-map.interface.js';
import { ITaskPromiseMap } from '../tasks/interfaces/task-promise-map.interface.js';
import { ILimit } from '../core/types/limit.interface.js';
import { IRunnerOptions } from '../configuration/types/runner-options.interface.js';
import { IStateManager } from '../core/types/state-manager.interface.js';

export class TaskExecutionService implements ITaskExecutionService {
  constructor(
    private readonly _taskOrchestrator: unknown,
    private readonly _stateManager: IStateManager,
    private readonly _options: IRunnerOptions
  ) {}

  public async execute(taskCalls: TaskCall[]): Promise<ExecutionResult> {
    try {
      const executionPlan = await this.buildExecutionPlan(taskCalls);
      
      // Delegate to TaskOrchestrator
      return (this._taskOrchestrator as any).execute(executionPlan, taskCalls);
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        completed: 0,
        failed: 1
      };
    }
  }

  public async buildExecutionPlan(taskCalls: TaskCall[]): Promise<TaskInstance[]> {
    // Delegate to TaskOrchestrator
    return (this._taskOrchestrator as any).buildExecutionPlan(taskCalls);
  }

  public async shouldTaskRun(taskInstance: TaskInstance): Promise<boolean> {
    // Delegate to TaskOrchestrator
    return (this._taskOrchestrator as any).shouldTaskRun(taskInstance);
  }

  public async executeCall(
    call: unknown,
    variables: IVariableMap,
    taskPromises: ITaskPromiseMap,
    limit: ILimit,
    serialLimit: ILimit
  ): Promise<void> {
    // Delegate to TaskOrchestrator
    return (this._taskOrchestrator as any).executeCall(call, variables, taskPromises, limit, serialLimit);
  }

  public async executeUnifiedTaskBlock(
    task: unknown,
    signature: string,
    taskId: string,
    variables: IVariableMap,
    taskInstance: TaskInstance
  ): Promise<boolean> {
    // Delegate to TaskOrchestrator
    return (this._taskOrchestrator as any).executeUnifiedTaskBlock(task, signature, taskId, variables, taskInstance);
  }
}