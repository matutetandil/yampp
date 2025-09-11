import { ReturnValueInternalFunction } from './return-value-internal-function.js';
import { InternalFunctionExecutionContext } from './internal-function-execution-context.interface.js';
import { ParameterIterator } from './parameter-iterator.js';

/**
 * Handler for __input_select internal function
 * Provides multiple choice selection with array support
 */
export class InputSelectFunction extends ReturnValueInternalFunction {
  
  protected configure(): void {
    this.setName('__input_select')
        .setDescription('Get user selection from multiple choices')
        .configureParameters(builder => 
          builder.addStringParameter('prompt', true)
                 .addStringParameter('defaultValue', true)
                 .addStringParameter('optionsString', true)
        );
  }

  protected async executeCore(params: ParameterIterator, context: any): Promise<any> {
    const prompt = params.next();
    const defaultValue = params.next();
    const optionsString = params.next();
    const variableName = context.variableName || 'option';
    
    // Parse options from comma-separated string
    const options = optionsString.split(',').map((opt: string) => opt.trim());

    const value = await this.inputManager.getInput(
      'select',
      prompt,
      variableName,
      defaultValue,
      options
    );

    return value;
  }
}