import { ITaskCommands } from './task-commands.interface.js';
import { ITaskStatus } from './task-status.interface.js';
import { ITaskInteractions } from './task-interactions.interface.js';

/**
 * Composed interface for complete task execution
 * Follows Interface Segregation Principle by extending focused interfaces
 */
export interface ITaskExecution extends ITaskCommands, ITaskStatus, ITaskInteractions {
  // This interface now composes the three focused interfaces
  // Clients can depend on just the specific interface they need
}