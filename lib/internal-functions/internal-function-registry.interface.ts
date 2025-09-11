import { IVariableMap } from '../core/types/variable-map.interface.js';
import { ITaskPromiseMap } from '../tasks/interfaces/task-promise-map.interface.js';
import { ILimit } from '../core/types/limit.interface.js';
import { IInternalFunction } from './internal-function.interface.js';
import { FunctionMetadata } from '../core/function-metadata.js';

export interface IInternalFunctionRegistry {
  execute(
    func: IInternalFunction,
    variables: IVariableMap,
    signature: string,
    taskPromises: ITaskPromiseMap,
    limit: ILimit,
    serialLimit: ILimit
  ): Promise<unknown>;
  register(functionHandler: unknown): void;
  unregister(functionName: string): boolean;
  getRegisteredFunctions(): string[];
  getFunctionMetadata(name: string): FunctionMetadata | null;
}