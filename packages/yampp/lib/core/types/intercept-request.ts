/**
 * Request from shell proxy for internal function execution
 */
export interface InterceptRequest {
  /** Name of the internal function to execute */
  functionName: string;
  
  /** Arguments passed to the function */
  args: string[];
}