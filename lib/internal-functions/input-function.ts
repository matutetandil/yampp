import { BaseInternalFunction } from './base-function.js';
import { InternalFunctionExecutionContext } from './internal-function-execution-context.interface.js';
import { FunctionMetadata } from '../core/types/function-metadata.interface.js';

/**
 * Handler for __input internal function
 * Provides interactive text input with optional defaults
 */
export class InputFunction extends BaseInternalFunction {
  public async execute(args: any[], context: InternalFunctionExecutionContext): Promise<any> {
    // Parse parameters: __input "prompt" [defaultValue]
    // NEW SYNTAX: value is returned, not assigned to a variable
    if (args.length < 1) {
      throw new Error('__input requires at least 1 parameter: prompt');
    }
    
    // With new syntax, first arg is variable name, then prompt, then default
    const variableName = args[0]; // e.g., "name"
    const prompt = args[1];       // e.g., "What is your name?"
    const defaultValue = args[2]; // e.g., "Carlos"
    
    const value = await this.inputManager.getInput(
      'text',
      prompt,
      variableName, // Use variable name for CLI --input lookup
      defaultValue
    );
    
    // Set the variable in context so it's available for return value capture
    context.variables.set(variableName, value);
    return value;
  }

  public getMetadata(): FunctionMetadata {
    return {
      name: '__input',
      description: 'Get user text input with optional default value',
      returnVariable: true,
      parameters: [
        { name: 'prompt', type: 'string', description: 'Text to show user' },
        { name: 'defaultValue', type: 'string', description: 'Default value if user provides no input' }
      ]
    };
  }
}