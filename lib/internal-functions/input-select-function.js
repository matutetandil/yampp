import { BaseInternalFunction } from './base-function.js';

/**
 * Handler for __input_select internal function
 * Provides multiple choice selection with array support
 */
export class InputSelectFunction extends BaseInternalFunction {
  async execute(func, variables) {
    // Parse parameters: __input_select "prompt" variable ["opt1", "opt2", ...] [defaultValue]
    if (func.params.length < 3) {
      throw new Error('__input_select requires at least 3 parameters: prompt, variable name, and options');
    }
    
    const prompt = this.parseParameter(func.params[0], variables);
    const variableName = this.parseParameter(func.params[1], variables);
    
    // Handle options - can be array or individual parameters
    let options;
    let defaultValue;
    
    if (func.params[2].type === 'array') {
      // Options provided as array: ["opt1", "opt2"]
      options = func.params[2].value;
      defaultValue = func.params[3] ? this.parseParameter(func.params[3], variables) : undefined;
    } else if (func.params[2].type === 'params' && func.params[2].value) {
      // Options provided as params: (opt1, opt2)
      options = func.params[2].value.map(opt => this.parseParameter(opt, variables));
      defaultValue = func.params[3] ? this.parseParameter(func.params[3], variables) : undefined;
    } else {
      // Options provided as individual parameters: "opt1" "opt2" "opt3"
      options = [];
      let i = 2;
      while (i < func.params.length - 1 || (i < func.params.length && !defaultValue)) {
        const param = this.parseParameter(func.params[i], variables);
        // Check if this could be default value (if it's one of the previous options)
        if (i === func.params.length - 1 && options.includes(param)) {
          defaultValue = param;
          break;
        }
        options.push(param);
        i++;
      }
      if (!defaultValue && func.params.length > options.length + 2) {
        defaultValue = this.parseParameter(func.params[func.params.length - 1], variables);
      }
    }
    
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
}