/**
 * Execution result DTO
 * Single Responsibility: Runtime execution result data structure
 */
export interface IExecutionResult {
  readonly exitCode: number;
  readonly output: string;
  readonly error?: string;
}