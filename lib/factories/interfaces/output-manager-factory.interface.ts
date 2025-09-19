import { OutputManager } from '../../output/types/output-manager.js';
import { IRunnerOptions } from '../../configuration/types/runner-options.interface.js';

/**
 * Factory interface for creating OutputManager instances
 */
export interface IOutputManagerFactory {
  createOutputManager(options: IRunnerOptions): OutputManager;
}