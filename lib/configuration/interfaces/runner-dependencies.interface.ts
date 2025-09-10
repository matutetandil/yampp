// Type interfaces
import { ITaskMap } from '../../tasks/interfaces/task-map.interface.js';
import { IVariableMap } from '../../core/types/variable-map.interface.js';
import { IConstantMap } from '../../core/types/constant-map.interface.js';
import { IEnvironmentVariableMap } from '../../core/types/environment-variable-map.interface.js';
import { IRunnerOptions } from '../types/runner-options.interface.js';
import { ITaskGraph } from '../../tasks/interfaces/task-graph.interface.js';
import { IStateManager } from '../../core/types/state-manager.interface.js';
import { ITaskColorMap } from '../../tasks/interfaces/task-color-map.interface.js';
import { IInternalFunctionRegistry } from '../../internal-functions/internal-function-registry.interface.js';

// Infrastructure imports
import { FileWatcher } from '../../file-watcher.js';
import { ClaudeOutputManager } from '../../claude-output-manager.js';
import { InputManager } from '../../input-manager.js';
import { ShellContentManager } from '../../shell-content/shell-content-manager.js';
import { CommandExecutor } from '../../execution/command-executor.js';
import { TaskOrchestrator } from '../../execution/task-orchestrator.js';
import { ExecuteInternalFunctionCallback } from '../../internal-functions/execute-internal-function-callback.js';

/**
 * Runner Dependencies interface following factory pattern for circular dependencies
 * Matches the original JavaScript architecture
 */
export interface IRunnerDependencies {
  // Core data
  tasks: ITaskMap;
  globalVariables: IVariableMap;
  globalConstants: IConstantMap;
  globalEnvironmentVariables: IEnvironmentVariableMap;
  options: IRunnerOptions;

  // Infrastructure (created upfront)
  taskGraph: ITaskGraph;
  stateManager: IStateManager;
  fileWatcher: FileWatcher;
  outputManager: ClaudeOutputManager;
  inputManager: InputManager;
  taskColors: ITaskColorMap;

  // Factory functions for circular dependencies
  createInternalFunctionRegistry: (runner: any) => IInternalFunctionRegistry;
  createShellContentManager: () => ShellContentManager;
  createCommandExecutor: (callback: ExecuteInternalFunctionCallback) => CommandExecutor;
  createTaskOrchestrator: () => TaskOrchestrator;
}