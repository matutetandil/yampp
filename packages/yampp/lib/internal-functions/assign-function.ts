import { VoidInternalFunction } from './void-internal-function.js';
import { InternalFunctionExecutionContext } from './internal-function-execution-context.interface.js';
import { ParameterIterator } from './parameter-iterator.js';

/**
 * Handler for __assign internal function
 * Handles variable and constant assignments across platforms
 */
export class AssignFunction extends VoidInternalFunction {
  
  protected configure(): void {
    this.setName('assign')
        .setDescription('Assign values to variables or constants')
        .configureParameters(builder => 
          builder.addStringParameter('type', true)      // 'var' or 'const'
                 .addStringParameter('name', true)      // variable name
                 .addStringParameter('value', true)     // variable value
        );
  }

  protected async executeCore(params: ParameterIterator, context: InternalFunctionExecutionContext): Promise<void> {
    const type = params.next();
    const name = params.next();
    const value = params.next();
    
    // Set variable in shared state for bidirectional variable system
    if (context.variables) {
      context.variables.set(name, value);
    }
    
    // The actual platform-specific assignment (var x="value" vs $x="value")
    // will be handled by the shell content processor's generateTargetCode method
    // This function just manages the variable state
  }
}