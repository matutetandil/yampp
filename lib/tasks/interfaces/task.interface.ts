import { ITaskMetadata } from './task-metadata.interface.js';
import { ITaskDependencies } from './task-dependencies.interface.js';
import { ITaskExecution } from './task-execution.interface.js';
import { ITaskVariables } from './task-variables.interface.js';
import { ITaskParameters } from './task-parameters.interface.js';
import { ITaskFileWatcher } from './task-file-watcher.interface.js';

/**
 * Complete task interface that composes all task-related functionality
 * This interface follows ISP by extending focused, segregated interfaces
 */
export interface ITask extends 
  ITaskMetadata,
  ITaskDependencies,
  ITaskExecution,
  ITaskVariables,
  ITaskParameters,
  ITaskFileWatcher {
  // All methods are now inherited from segregated interfaces
  // No additional methods needed here
}