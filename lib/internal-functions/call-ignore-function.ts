import { VoidInternalFunction } from './void-internal-function.js';
import { InternalFunctionExecutionContext } from './internal-function-execution-context.interface.js';
import { ParameterIterator } from './parameter-iterator.js';

/**
 * Handler for __call_ignore internal function
 * Calls other tasks internally with parameters, ignoring failures
 * Usage: __call_ignore taskname(param1, param2)
 */
export class CallIgnoreFunction extends VoidInternalFunction {
  
  protected configure(): void {
    this.setName('__call_ignore')
        .setDescription('Call another task with parameters, ignoring failures')
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
    
    try {
      await this.runner.executeCall(
        call, 
        context.variables, 
        context.taskPromises, 
        context.limit, 
        context.serialLimit,
        true // shouldIgnoreFailures = true for __call_ignore
      );
    } catch (error) {
      // Note: With shouldIgnoreFailures=true, failed tasks are moved to ignored
      // and executeCall doesn't throw, but we keep the try-catch for safety
      console.log(`Task '${taskName}' failed but continuing execution (called with __call_ignore)`);
    }
  }
}