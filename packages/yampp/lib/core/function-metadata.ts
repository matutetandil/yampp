import { FunctionParameter } from '../internal-functions/types/function-parameter.js';

/**
 * Function metadata with proper encapsulation
 * Replaces the interface with a proper class following SOLID principles
 */
export class FunctionMetadata {
  private _name: string = '';
  private _description: string = '';
  private _returnVariable: boolean = false;
  private _parameters: FunctionParameter[] = [];

  /**
   * Set function name
   */
  public setName(name: string): this {
    this._name = name;
    return this;
  }

  /**
   * Get function name
   */
  public getName(): string {
    return this._name;
  }

  /**
   * Set function description
   */
  public setDescription(description: string): this {
    this._description = description;
    return this;
  }

  /**
   * Get function description
   */
  public getDescription(): string {
    return this._description;
  }

  /**
   * Set whether function returns a variable
   */
  public setReturnVariable(returns: boolean): this {
    this._returnVariable = returns;
    return this;
  }

  /**
   * Check if function returns a variable
   */
  public hasReturnVariable(): boolean {
    return this._returnVariable;
  }

  /**
   * Set function parameters
   */
  public setParameters(parameters: FunctionParameter[]): this {
    this._parameters = [...parameters]; // Defensive copy
    return this;
  }

  /**
   * Add a single parameter
   */
  public addParameter(parameter: FunctionParameter): this {
    this._parameters.push(parameter);
    return this;
  }

  /**
   * Get function parameters (returns copy to maintain encapsulation)
   */
  public getParameters(): FunctionParameter[] {
    return [...this._parameters]; // Return copy
  }

  /**
   * Get parameter by name
   */
  public getParameter(name: string): FunctionParameter | undefined {
    return this._parameters.find(p => p.name === name);
  }

  /**
   * Create a copy of this metadata
   */
  public clone(): FunctionMetadata {
    const copy = new FunctionMetadata();
    copy.setName(this._name)
        .setDescription(this._description)
        .setReturnVariable(this._returnVariable)
        .setParameters(this._parameters);
    return copy;
  }
}