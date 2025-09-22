import { IDataProvider } from './data-provider.interface.js';
import { IConfigurationReader } from './configuration-reader.interface.js';

/**
 * Complete Runner configuration interface
 * Composed of segregated interfaces following Interface Segregation Principle
 *
 * Clients can depend on specific sub-interfaces instead of this complete interface
 * to follow ISP more strictly
 */
export interface IRunnerConfigurator extends
  IDataProvider,
  IConfigurationReader {}