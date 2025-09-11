import { FunctionParameter } from './types/function-parameter.js';
import { ParameterType } from './types/parameter-type.js';

/**
 * Parameter builder with fluent interface for internal functions
 */
export class FunctionParameterBuilder {
  private parameters: FunctionParameter[] = [];
  
  /**
   * Add a string parameter
   */
  public addStringParameter(name: string, required: boolean = true, defaultValue?: string): this {
    this.parameters.push({
      name,
      type: 'string',
      required,
      defaultValue,
      description: `${name} (string)`
    });
    return this;
  }

  /**
   * Add a number parameter
   */
  public addNumberParameter(name: string, required: boolean = true, defaultValue?: number): this {
    this.parameters.push({
      name,
      type: 'number',
      required,
      defaultValue,
      description: `${name} (number)`
    });
    return this;
  }

  /**
   * Add a boolean parameter
   */
  public addBooleanParameter(name: string, required: boolean = true, defaultValue?: boolean): this {
    this.parameters.push({
      name,
      type: 'boolean',
      required,
      defaultValue,
      description: `${name} (boolean)`
    });
    return this;
  }

  /**
   * Add an array parameter
   */
  public addArrayParameter(name: string, required: boolean = true, defaultValue?: any[]): this {
    this.parameters.push({
      name,
      type: 'array',
      required,
      defaultValue,
      description: `${name} (array)`
    });
    return this;
  }

  /**
   * Add a parameter of any type
   */
  public addAnyParameter(name: string, required: boolean = true, defaultValue?: any): this {
    this.parameters.push({
      name,
      type: 'any',
      required,
      defaultValue,
      description: `${name} (any)`
    });
    return this;
  }

  /**
   * Build and return the parameter list
   */
  public build(): FunctionParameter[] {
    return this.parameters;
  }
}