export interface ITask {
  getName(): string;
  getCommands(): string[];
  getDependencies(): string[];
  getDependencyParams(): Record<string, unknown[]>;
  getModifiers(): Set<string>;
  getParameters(): unknown[];
  hasWatchedFiles(): boolean;
  watchedFiles: string[];
  internalFunctions: unknown[];
  commands: string[];
  inputs?: unknown[];
  platforms?: string[];
  params?: string[];
  modifiers: Set<string>;
}