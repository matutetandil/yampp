import { BaseInternalFunction } from './base-function.js';
import { InternalFunctionExecutionContext } from './internal-function-execution-context.interface.js';
import { FunctionMetadata } from '../core/types/function-metadata.interface.js';

/**
 * Handler for __input_password internal function
 * Provides secure password input with character masking
 */
export class InputPasswordFunction extends BaseInternalFunction {
  public async execute(args: any[], context: InternalFunctionExecutionContext): Promise<any> {
    // Parse parameters: __input_password "prompt" variable [defaultValue]
    if (args.length < 2) {
      throw new Error('__input_password requires at least 2 parameters: prompt and variable name');
    }
    
    // With new syntax, first arg is variable name, then prompt, then default
    const variableName = args[0]; // e.g., "password"
    const prompt = args[1];       // e.g., "Enter your password:"
    const defaultValue = args[2]; // e.g., "secret123"
    
    const value = await this.inputManager.getInput(
      'password',
      prompt,
      variableName,
      defaultValue
    );
    
    context.variables.set(variableName, value);
    return value;
  }

  public getMetadata(): FunctionMetadata {
    return {
      name: '__input_password',
      description: 'Get secure password input with character masking',
      returnVariable: true,
      parameters: [
        { name: 'prompt', type: 'string', description: 'Text to show user' },
        { name: 'variable', type: 'string', description: 'Variable name to store password' },
        { name: 'defaultValue', type: 'string', description: 'Default value if user provides no input' }
      ]
    };
  }
}