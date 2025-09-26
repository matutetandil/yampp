import { BaseFunction } from './BaseFunction.js';

/**
 * Base class for functions that return values
 * Single Responsibility: Handle return value function behavior
 */
export abstract class ReturnValueFunction extends BaseFunction {
  protected functionName: string = '';
  protected functionDescription: string = '';

  /**
   * Execute the function (concrete implementation)
   */
  abstract executeFunction(...args: any[]): Promise<string>;

  /**
   * Execute wrapper - calls executeFunction and returns the result
   */
  async execute(args: any[], _context: any): Promise<string> {
    return await this.executeFunction(...args);
  }

  /**
   * Get function metadata
   */
  getMetadata() {
    return {
      getName: () => this.functionName,
      getDescription: () => this.functionDescription,
      hasReturnVariable: () => true // Return value functions return variables
    };
  }
}