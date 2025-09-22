import { ReturnValueInternalFunction } from './return-value-internal-function.js';
import { InternalFunctionExecutionContext } from './internal-function-execution-context.interface.js';
import { ParameterIterator } from './parameter-iterator.js';

/**
 * Handler for __input_confirm internal function
 * Provides yes/no confirmation with boolean conversion
 */
export class InputConfirmFunction extends ReturnValueInternalFunction {
  
  protected configure(): void {
    this.setName('__input_confirm')
        .setDescription('Get user yes/no confirmation')
        .configureParameters(builder => 
          builder.addStringParameter('prompt', true)
                 .addStringParameter('defaultValue', false, 'no')
        );
  }

  protected async executeCore(params: ParameterIterator, context: any): Promise<any> {
    const prompt = params.next();
    const defaultValue = params.next() || 'no';
    const variableName = context.variableName || 'confirmed';

    const value = await this.inputManager.getInput(
      'confirm',
      prompt,
      variableName,
      defaultValue
    );

    return value;
  }
}