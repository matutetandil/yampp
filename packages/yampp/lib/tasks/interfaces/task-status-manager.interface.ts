import { ITaskStatusWriter } from './task-status-writer.interface.js';
import { ITaskStatusReader } from './task-status-reader.interface.js';
import { ITaskCollectionReader } from './task-collection-reader.interface.js';
import { ITaskExecutionAnalytics } from './task-execution-analytics.interface.js';

/**
 * Complete TaskStatusManager interface
 * Composed of segregated interfaces following Interface Segregation Principle
 *
 * Clients can depend on specific sub-interfaces instead of this complete interface
 * to follow ISP more strictly
 */
export interface ITaskStatusManager extends
  ITaskStatusWriter,
  ITaskStatusReader,
  ITaskCollectionReader,
  ITaskExecutionAnalytics {}