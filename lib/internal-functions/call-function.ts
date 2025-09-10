import { BaseInternalFunction } from './base-function.js';
import { InternalFunctionExecutionContext } from './internal-function-execution-context.interface.js';
import { FunctionMetadata } from '../core/types/function-metadata.interface.js';

/**
 * Handler for __call internal function
 * Calls other tasks internally with parameters
 */
export class CallFunction extends BaseInternalFunction {
  public async execute(args: any[], context: InternalFunctionExecutionContext): Promise<any> {
    // Parse parameters: __call taskname param1 param2 ...
    if (!args || args.length < 1) {
      throw new Error('__call requires at least the task name');
    }
    
    // First arg is the task name, rest are parameters
    const taskName = args[0];
    const params = args.slice(1); // All params after task name
    
    // Convert to the format expected by executeCall
    const call = {
      taskName: taskName,
      params: params
    };
    
    return await this.runner.executeCall(
      call, 
      context.variables, 
      context.taskPromises, 
      context.limit, 
      context.serialLimit
    );
  }

  public getMetadata(): FunctionMetadata {
    return {
      name: '__call',
      description: 'Call another task with parameters',
      returnVariable: false,
      parameters: [
        { name: 'taskName', type: 'string', description: 'Name of task to call' },
        { name: 'params', type: 'any[]', description: 'Parameters to pass to the task' }
      ]
    };
  }
}