import type { ITaskInfo } from './ITaskInfo.js';
import type { ILogger } from '../abstractions/ILogger.js';

/**
 * Execution context DTO
 * Single Responsibility: Context data for function/runtime execution
 */
export interface IExecutionContext {
  readonly workingDirectory: string;
  readonly environment: Readonly<Record<string, string>>;
  readonly task: ITaskInfo;
  readonly logger: ILogger;
}