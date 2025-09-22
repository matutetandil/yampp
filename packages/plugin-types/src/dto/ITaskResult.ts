/**
 * Task result DTO
 * Single Responsibility: Task execution result data structure
 */
export interface ITaskResult {
  readonly status: 'completed' | 'failed' | 'skipped';
  readonly error?: Error;
  readonly duration: number;
  readonly output?: string;
}