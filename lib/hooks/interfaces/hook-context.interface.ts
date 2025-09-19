/**
 * Context information available to hooks during execution
 * Follows SRP by containing only contextual data
 */
export interface IHookContext {
  readonly taskName?: string;
  readonly status?: 'pending' | 'running' | 'completed' | 'failed';
  readonly error?: Error;
  readonly executionTime?: number;
  readonly variables?: Map<string, string>;
}