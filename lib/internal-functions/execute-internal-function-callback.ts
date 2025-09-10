/**
 * Callback function for executing internal functions
 */
export type ExecuteInternalFunctionCallback = (
  internalFunction: unknown,
  variables: Map<string, string>,
  taskId: string,
  taskPromises: Map<string, Promise<boolean>>,
  limit: (fn: () => Promise<boolean>) => Promise<boolean>,
  serialLimit: (fn: () => Promise<boolean>) => Promise<boolean>
) => Promise<void>;