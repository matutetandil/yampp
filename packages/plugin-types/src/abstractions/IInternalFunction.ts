import type { IExecutionContext } from '../dto/IExecutionContext.js';

/**
 * Internal function abstraction
 * Single Responsibility: Define contract for Yamfile functions
 */
export interface IInternalFunction {
  readonly name: string;
  readonly description?: string;
  execute(args: string[], context: IExecutionContext): Promise<string>;
}