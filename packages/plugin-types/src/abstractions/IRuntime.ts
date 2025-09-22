import type { IExecutionContext } from '../dto/IExecutionContext.js';
import type { IExecutionResult } from '../dto/IExecutionResult.js';

/**
 * Language runtime abstraction
 * Single Responsibility: Define contract for language execution
 */
export interface IRuntime {
  readonly language: string;
  readonly extensions?: readonly string[];
  isAvailable(): Promise<boolean>;
  execute(code: string, context: IExecutionContext): Promise<IExecutionResult>;
}