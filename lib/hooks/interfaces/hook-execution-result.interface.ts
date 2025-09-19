/**
 * Result of hook execution
 * Follows SRP by containing only execution result data
 */
export interface IHookExecutionResult {
  readonly hookId: string;
  readonly success: boolean;
  readonly output?: string;
  readonly error?: Error;
  readonly executionTime: number;
}