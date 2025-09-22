/**
 * Context for include resolution operations
 * Tracks state during recursive include processing
 */
export interface IncludeContext {
  basePath: string;
  resolvedPaths: Set<string>;
  includeDepth: number;
}