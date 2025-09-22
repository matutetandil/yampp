export interface RunnerDependencies {
  tasks: Map<string, any>;
  globalVariables: Map<string, any>;
  globalConstants: Map<string, any>;
  globalEnvironmentVariables: Map<string, any>;
  options: any;
  taskGraph: any;
  stateManager: any;
  fileWatcher: any;
  outputManager: any;
  inputManager: any;
  createInternalFunctionRegistry: (runner: any) => any;
  createShellContentManager: () => any;
  createCommandExecutor: (executeInternalFunction: Function) => any;
  createTaskOrchestrator: () => any;
}