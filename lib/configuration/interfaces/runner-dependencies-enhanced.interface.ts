import { ITaskMap } from '../../tasks/interfaces/task-map.interface';
import { IVariableMap } from '../../core/types/variable-map.interface';
import { IConstantMap } from '../../core/types/constant-map.interface';
import { IEnvironmentVariableMap } from '../../core/types/environment-variable-map.interface';
import { IRunnerOptions } from '../types/runner-options.interface';
import { ITaskGraph } from '../../tasks/interfaces/task-graph.interface';
import { IStateManager } from '../../core/types/state-manager.interface';
import { FileWatcher } from '../../file-watcher';
import { OutputManager } from '../../output-manager';
import { InputManager } from '../../input-manager';

export interface IRunnerDependenciesEnhanced {
  tasks: ITaskMap;
  globalVariables: IVariableMap;
  globalConstants: IConstantMap;
  globalEnvironmentVariables: IEnvironmentVariableMap;
  options: IRunnerOptions;
  taskGraph: ITaskGraph;
  stateManager: IStateManager;
  fileWatcher: FileWatcher;
  outputManager: OutputManager;
  inputManager: InputManager;
  createInternalFunctionRegistry: (runner: unknown) => unknown;
  createShellContentManager: () => unknown;
  createCommandExecutor: (executeInternalFunction: Function) => unknown;
  createTaskOrchestrator: () => unknown;
}