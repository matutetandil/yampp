import { ReturnValueInternalFunction } from './return-value-internal-function.js';
import { InternalFunctionExecutionContext } from './internal-function-execution-context.interface.js';
import { ParameterIterator } from './parameter-iterator.js';

/**
 * Handler for __input internal function
 * Provides text input with validation and default values
 */
export class InputFunction extends ReturnValueInternalFunction {
  
  protected configure(): void {
    this.setName('__input')
        .setDescription('Get user text input')
        .configureParameters(builder => 
          builder.addStringParameter('prompt', true)
                 .addStringParameter('defaultValue', false, '')
        );
  }

  protected async executeCore(params: ParameterIterator, context: any): Promise<any> {
    const prompt = params.next();
    const defaultValue = params.next() || '';
    
    // Variable name comes from extended context
    const variableName = context.variableName || 'input';

    const value = await this.inputManager.getInput(
      'text',
      prompt,
      variableName,
      defaultValue
    );

    return value;
  }
}