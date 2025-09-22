import { ReturnValueInternalFunction } from './return-value-internal-function.js';
import { InternalFunctionExecutionContext } from './internal-function-execution-context.interface.js';
import { ParameterIterator } from './parameter-iterator.js';

/**
 * Handler for __input_password internal function
 * Provides secure password input with masking
 */
export class InputPasswordFunction extends ReturnValueInternalFunction {
  
  protected configure(): void {
    this.setName('__input_password')
        .setDescription('Get user password input (masked)')
        .configureParameters(builder => 
          builder.addStringParameter('prompt', true)
                 .addStringParameter('defaultValue', false, '')
        );
  }

  protected async executeCore(params: ParameterIterator, context: any): Promise<any> {
    const prompt = params.next();
    const defaultValue = params.next() || '';
    const variableName = context.variableName || 'password';

    const value = await this.inputManager.getInput(
      'password',
      prompt,
      variableName,
      defaultValue
    );

    return value;
  }
}