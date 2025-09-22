import { ExecutionContext } from '../types/execution-context.js';

/**
 * Interface for command execution functionality
 * Abstracts shell command execution for better testability and DIP compliance
 */
export interface ICommandExecutor {
  /**
   * Execute a single command with variable substitution and environment setup
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
   * Execute multiple commands in sequence
   */
  executeCommands(
    commands: string[],
    taskName: string,
    taskId: string,
    variables?: Map<string, string>,
    localVariables?: any[],
    localConstants?: any[]
  ): Promise<boolean>;

  /**
   * Process shell content with variable substitution and internal function calls
   */
  processShellContent(content: string, variables: Map<string, string>): Promise<string>;

  /**
   * Execute command in specific working directory
   */
  executeInDirectory(
    command: string,
    directory: string,
    taskName: string,
    taskId: string,
    variables?: Map<string, string>
  ): Promise<boolean>;
}