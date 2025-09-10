import { BaseInternalFunction } from './base-function.js';
import { InternalFunctionExecutionContext } from './internal-function-execution-context.interface.js';
import { FunctionMetadata } from '../core/types/function-metadata.interface.js';

/**
 * Handler for __input_select internal function
 * Provides multiple choice selection with array support
 */
export class InputSelectFunction extends BaseInternalFunction {
  public async execute(args: any[], context: InternalFunctionExecutionContext): Promise<any> {
    // With new syntax, args are: [variableName, prompt, defaultValue, options]
    if (args.length < 4) {
      throw new Error('__input_select requires at least 4 parameters: variable name, prompt, default value, and options');
    }
    
    const variableName = args[0];  // e.g., "option"
    const prompt = args[1];        // e.g., "Choose environment:"
    const defaultValue = args[2];  // e.g., "dev"
    const optionsString = args[3]; // e.g., "dev,staging,prod"
    
    // Parse options from comma-separated string
    const options = optionsString.split(',').map((opt: string) => opt.trim());
    const variables = context.variables;
    
    const value = await this.inputManager.getInput(
      'select',
      prompt,
      variableName,
      defaultValue,
      options
    );
    
    variables.set(variableName, value);
    return value;
  }

  public getMetadata(): FunctionMetadata {
    return {
      name: '__input_select',
      description: 'Get user selection from multiple choices',
      returnVariable: true,
      parameters: [
        { name: 'prompt', type: 'string', description: 'Text to show user' },
        { name: 'variable', type: 'string', description: 'Variable name to store selection' },
        { name: 'options', type: 'array', description: 'Array of options to choose from' },
        { name: 'defaultValue', type: 'string', description: 'Default option if user provides no input' }
      ]
    };
  }
}