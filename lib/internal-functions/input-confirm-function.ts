import { BaseInternalFunction } from './base-function.js';
import { InternalFunctionExecutionContext } from './internal-function-execution-context.interface.js';
import { FunctionMetadata } from '../core/types/function-metadata.interface.js';

/**
 * Handler for __input_confirm internal function
 * Provides yes/no confirmation prompts
 */
export class InputConfirmFunction extends BaseInternalFunction {
  public async execute(args: any[], context: InternalFunctionExecutionContext): Promise<any> {
    // Parse parameters: __input_confirm "prompt" variable [defaultValue]
    if (args.length < 2) {
      throw new Error('__input_confirm requires at least 2 parameters: prompt and variable name');
    }
    
    // With new syntax, first arg is variable name, then prompt, then default
    const variableName = args[0]; // e.g., "confirmed"
    const prompt = args[1];       // e.g., "Do you want to continue?"
    const defaultValue = args[2]; // e.g., "yes"
    
    const value = await this.inputManager.getInput(
      'confirm',
      prompt,
      variableName,
      defaultValue
    );
    
    context.variables.set(variableName, value);
    return value;
  }

  public getMetadata(): FunctionMetadata {
    return {
      name: '__input_confirm',
      description: 'Get yes/no confirmation from user',
      returnVariable: true,
      parameters: [
        { name: 'prompt', type: 'string', description: 'Text to show user' },
        { name: 'variable', type: 'string', description: 'Variable name to store confirmation' },
        { name: 'defaultValue', type: 'string', description: 'Default value (true/false) if user provides no input' }
      ]
    };
  }
}