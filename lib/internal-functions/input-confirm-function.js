import { BaseInternalFunction } from './base-function.js';

/**
 * Handler for __input_confirm internal function
 * Provides yes/no confirmation prompts
 */
export class InputConfirmFunction extends BaseInternalFunction {
  async execute(func, variables) {
    // Parse parameters: __input_confirm "prompt" variable [defaultValue]
    if (func.params.length < 2) {
      throw new Error('__input_confirm requires at least 2 parameters: prompt and variable name');
    }
    
    const prompt = this.parseParameter(func.params[0], variables);
    const variableName = this.parseParameter(func.params[1], variables);
    const defaultValue = func.params[2] ? this.parseParameter(func.params[2], variables) : undefined;
    
    const value = await this.inputManager.getInput(
      'confirm',
      prompt,
      variableName,
      defaultValue
    );
    
    variables.set(variableName, value);
    return value;
  }
}