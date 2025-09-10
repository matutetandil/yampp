import { ITaskLifecycleManager } from '../../tasks/interfaces/task-lifecycle-manager.interface';
import { IOutputLogger } from '../../output/interfaces/output-logger.interface';
import { IDisplayController } from '../../output/interfaces/display-controller.interface';

/**
 * Complete OutputManager interface
 * Composed of segregated interfaces following Interface Segregation Principle
 *
 * Clients can depend on specific sub-interfaces instead of this complete interface
 * to follow ISP more strictly
 */
export interface ICompleteOutputManager extends ITaskLifecycleManager,
  IOutputLogger,
  IDisplayController {
}

// Re-export segregated interfaces for direct client usage
export { ITaskLifecycleManager } from '../../tasks/interfaces/task-lifecycle-manager.interface.js';
export { IOutputLogger } from '../../output/interfaces/output-logger.interface.js';
export { IDisplayController } from '../../output/interfaces/display-controller.interface.js';