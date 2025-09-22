/**
 * Options for TaskOrchestrator constructor
 */
export interface TaskOrchestratorOptions {
  /** Maximum number of parallel jobs */
  maxJobs?: number;
  
  /** Quiet mode - suppress output */
  quiet?: boolean;
  
  /** Force execution - ignore cache */
  force?: boolean;
}