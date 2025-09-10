import { ITaskMap } from '../../tasks/interfaces/task-map.interface';
import { ITaskGraph } from '../../tasks/interfaces/task-graph.interface';
import { IStateManager } from '../../core/types/state-manager.interface';
import { FileWatcher } from '../../file-watcher';
import { ITaskColorMap } from '../../tasks/interfaces/task-color-map.interface';

/**
 * Interface for providing access to core data structures
 * Focused on data access operations
 */
export interface IDataProvider {
  /**
   * Get the task map
   */
  getTasks(): ITaskMap;

  /**
   * Get the task graph
   */
  getGraph(): ITaskGraph;

  /**
   * Get the state manager
   */
  getState(): IStateManager;

  /**
   * Get the file watcher
   */
  getFileWatcher(): FileWatcher;

  /**
   * Get task color assignments
   */
  getTaskColors(): ITaskColorMap;
}