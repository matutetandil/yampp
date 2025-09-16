import { VoidInternalFunction } from './void-internal-function.js';
import { InternalFunctionExecutionContext } from './internal-function-execution-context.interface.js';
import { ParameterIterator } from './parameter-iterator.js';

/**
 * Handler for __call internal function
 * Calls other tasks internally with parameters
 * Usage: __call taskname(param1, param2)
 */
export class CallFunction extends VoidInternalFunction {
  
  protected configure(): void {
    this.setName('__call')
        .setDescription('Call another task with parameters')
        .configureParameters(builder => 
          builder.addStringParameter('taskName', true)
        );
  }

  protected async executeCore(params: ParameterIterator, context: InternalFunctionExecutionContext): Promise<void> {
    const taskName = params.next();
    // Get all remaining parameters as task parameters
    const allParams = params.getAll();
    const taskParams = allParams.slice(1); // Skip the taskName, rest are params
    
    // Convert to the format expected by executeCall
    const call = {
      taskName: taskName,
      params: taskParams
    };
    
    await this.runner.executeCall(
      call, 
      context.variables, 
      context.taskPromises, 
      context.limit, 
      context.serialLimit,
      false // shouldIgnoreFailures = false for regular __call
    );
  }
}