import { VoidInternalFunction } from './void-internal-function.js';
import { InternalFunctionExecutionContext } from './internal-function-execution-context.interface.js';
import { ParameterIterator } from './parameter-iterator.js';

/**
 * Asynchronous Task Call Function (Ignore Failures)
 * Calls another task asynchronously in parallel with other __call_async calls
 * Similar to __call_async but ignores failures - always succeeds  
 * Forms synchronization blocks with other async calls
 * 
 * NOTE: The actual block detection and transformation happens in the shell content processor
 * This function serves as a marker and will be transformed before execution
 */
export class CallAsyncIgnoreFunction extends VoidInternalFunction {
  
  protected configure(): void {
    this.setName('__call_async_ignore')
        .setDescription('Call another task asynchronously in parallel, ignoring failures')
        .configureParameters(builder => 
          builder.addStringParameter('taskName', true)
        );
  }

  protected async executeCore(params: ParameterIterator, context: InternalFunctionExecutionContext): Promise<void> {
    // This should never be called directly as __call_async_ignore gets transformed
    // in the shell content processor before execution
    throw new Error('__call_async_ignore should be transformed by shell content processor and not executed directly');
  }
}