import { Runner } from '../runner.js';
import { ITaskMap } from '../tasks/interfaces/task-map.interface.js';
import { IVariableMap } from '../core/types/variable-map.interface.js';
import { IConstantMap } from '../core/types/constant-map.interface.js';
import { IEnvironmentVariableMap } from '../core/types/environment-variable-map.interface.js';
import { IRunnerOptions } from '../configuration/types/runner-options.interface.js';
import { defaultRunnerFactory } from './default-runner-factory.js';

/**
 * Backward compatibility function - creates Runner with original interface
 * Accepts 'any' types for backwards compatibility but converts to proper interfaces internally
 */
export function createRunner(
  tasks: Map<string, any>,
  globalVariables: Map<string, any> = new Map(),
  globalConstants: Map<string, any> = new Map(),
  globalEnvironmentVariables: Map<string, any> = new Map(),
  options: any = {}
): Runner {
  // Convert to proper interfaces
  const typedTasks = tasks as ITaskMap;
  const typedGlobalVariables = globalVariables as IVariableMap;
  const typedGlobalConstants = globalConstants as IConstantMap;
  const typedGlobalEnvironmentVariables = globalEnvironmentVariables as IEnvironmentVariableMap;
  const typedOptions = options as IRunnerOptions;

  return defaultRunnerFactory.createRunner(
    typedTasks,
    typedGlobalVariables,
    typedGlobalConstants,
    typedGlobalEnvironmentVariables,
    typedOptions
  );
}