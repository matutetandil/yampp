/**
 * Internal function execution context interface
 */
export interface InternalFunctionExecutionContext {
  variables: Map<string, any>;
  signature: string;
  taskPromises: Map<string, Promise<any>>;
  limit: Function;
  serialLimit: Function;
}