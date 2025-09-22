export interface TaskState {
  task: string;
  completedAt: string;
  hash: string;
  commandsHash?: string;
}