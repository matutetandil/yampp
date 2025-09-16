import { VoidInternalFunction } from './void-internal-function.js';
import { InternalFunctionExecutionContext } from './internal-function-execution-context.interface.js';
import { ParameterIterator } from './parameter-iterator.js';

/**
 * Asynchronous Task Call Function
 * Calls another task asynchronously in parallel with other __call_async calls
 * Forms synchronization blocks - consecutive __call_async calls execute in parallel
 * and the block waits for all to complete before continuing
 * 
 * NOTE: The actual block detection and transformation happens in the shell content processor
 * This function serves as a marker and will be transformed before execution
 */
export class CallAsyncFunction extends VoidInternalFunction {
  
  protected configure(): void {
    this.setName('__call_async')
        .setDescription('Call another task asynchronously in parallel with other __call_async calls')
        .configureParameters(builder => 
          builder.addStringParameter('taskName', true)
        );
  }

  protected async executeCore(params: ParameterIterator, context: InternalFunctionExecutionContext): Promise<void> {
    // This should never be called directly as __call_async gets transformed
    // in the shell content processor before execution
    throw new Error('__call_async should be transformed by shell content processor and not executed directly');
  }
}