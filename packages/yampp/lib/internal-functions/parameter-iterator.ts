import { FunctionParameter } from './types/function-parameter.js';

/**
 * Iterator for function parameters with validation
 */
export class ParameterIterator {
  private readonly parameters: FunctionParameter[];
  private readonly values: any[];
  private currentIndex: number = 0;

  constructor(parameters: FunctionParameter[], values: any[]) {
    this.parameters = parameters;
    this.values = values;
    this.validate();
  }

  /**
   * Validate all parameters against provided values
   */
  private validate(): void {
    // Check required parameters
    for (let i = 0; i < this.parameters.length; i++) {
      const param = this.parameters[i];
      if (!param) continue; // Skip if parameter definition is missing
      
      const value = this.values[i];

      if (param.required && (value === undefined || value === null)) {
        if (param.defaultValue !== undefined) {
          this.values[i] = param.defaultValue;
        } else {
          throw new Error(`Missing required parameter: ${param.name}`);
        }
      }

      // Type validation
      if (value !== undefined && value !== null && param) {
        this.validateType(param, value);
      }
    }
  }

  /**
   * Validate parameter type
   */
  private validateType(param: FunctionParameter, value: any): void {
    switch (param.type) {
      case 'string':
        if (typeof value !== 'string') {
          throw new Error(`Parameter ${param.name} must be a string, got ${typeof value}`);
        }
        break;
      case 'number':
        if (typeof value !== 'number') {
          throw new Error(`Parameter ${param.name} must be a number, got ${typeof value}`);
        }
        break;
      case 'boolean':
        if (typeof value !== 'boolean') {
          throw new Error(`Parameter ${param.name} must be a boolean, got ${typeof value}`);
        }
        break;
      case 'array':
        if (!Array.isArray(value)) {
          throw new Error(`Parameter ${param.name} must be an array, got ${typeof value}`);
        }
        break;
      // 'any' type doesn't need validation
    }
  }

  /**
   * Get next parameter value
   */
  public next(): any {
    if (this.currentIndex >= this.values.length) {
      return undefined;
    }
    return this.values[this.currentIndex++];
  }

  /**
   * Check if there are more parameters
   */
  public hasNext(): boolean {
    return this.currentIndex < this.values.length;
  }

  /**
   * Get all parameter values at once
   */
  public getAll(): any[] {
    return this.values;
  }

  /**
   * Get parameter value by name
   */
  public getByName(name: string): any {
    const index = this.parameters.findIndex(p => p.name === name);
    if (index === -1) {
      throw new Error(`Parameter ${name} not found`);
    }
    return this.values[index];
  }

  /**
   * Get all parameters as a map
   */
  public getAsMap(): Map<string, any> {
    const map = new Map<string, any>();
    for (let i = 0; i < this.parameters.length; i++) {
      const param = this.parameters[i];
      if (param) {
        map.set(param.name, this.values[i]);
      }
    }
    return map;
  }

  /**
   * Reset iterator to beginning
   */
  public reset(): void {
    this.currentIndex = 0;
  }
}