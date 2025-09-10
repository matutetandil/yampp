export interface ITaskGraph {
  getDependencies(taskName: string): string[];
  getAllDependencies(taskName: string): string[];
  getDependents(taskName: string): string[];
  getExecutionOrder(): string[];
  getGraphVisualization(): string;
  toDotFormat(): string;
  toJSON(): object;
}