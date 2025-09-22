/**
 * Shell result DTO
 * Single Responsibility: Shell execution result data structure
 */
export interface IShellResult {
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;
  readonly duration: number;
}