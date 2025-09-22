/**
 * Task information DTO
 * Single Responsibility: Task data structure
 */
export interface ITaskInfo {
  readonly name: string;
  readonly dependencies: readonly string[];
  readonly modifiers: readonly string[];
  readonly parameters: Readonly<Record<string, any>>;
  readonly commands: readonly string[];
}