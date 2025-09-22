import type { IRuntime } from '../abstractions/IRuntime.js';

/**
 * Plugin capability: Provides language runtimes
 * Interface Segregation: Only for plugins that provide runtimes
 */
export interface IRuntimeProvider {
  getRuntimes(): Record<string, IRuntime>;
}