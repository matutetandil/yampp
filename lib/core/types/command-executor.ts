import { ExecutionContext } from '../../execution/types/execution-context';

/**
 * Command executor for running shell commands
 */
export interface CommandExecutor {
  /**
   * Execute a command
   */
  executeCommand(
    command: string,
    taskName: string,
    taskId: string,
    variables?: Map<string, string>,
    localVariables?: any[],
    localConstants?: any[]
  ): Promise<boolean>;

  /**
   * Execute a prepared command with execution context
   */
  executePreparedCommand(
    executionContext: ExecutionContext,
    taskName: string,
    taskId: string,
  ): Promise<boolean>;
}