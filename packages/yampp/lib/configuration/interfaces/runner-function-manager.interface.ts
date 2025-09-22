import { IVariableMap } from '../../core/types/variable-map.interface';
import { ITaskPromiseMap } from '../../tasks/interfaces/task-promise-map.interface';
import { ILimit } from '../../core/types/limit.interface';

/**
 * Interface for Runner's internal function management responsibilities
 * Segregated from other concerns
 */
export interface IRunnerFunctionManager {
  executeInternalFunction(
    func: unknown,
    variables: IVariableMap,
    signature: string,
    taskPromises: ITaskPromiseMap,
    limit: ILimit,
    serialLimit: ILimit,
  ): Promise<unknown>;

  registerInternalFunction(functionHandler: unknown): void;

  unregisterInternalFunction(functionName: string): boolean;

  getAvailableInternalFunctions(): string[];
}