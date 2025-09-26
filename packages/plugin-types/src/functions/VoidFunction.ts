import { BaseFunction } from './BaseFunction.js';

/**
 * Base class for void functions (functions that don't return values)
 * Single Responsibility: Handle void function behavior
 */
export abstract class VoidFunction extends BaseFunction {
  protected functionName: string = '';
  protected functionDescription: string = '';

  /**
   * Execute the function (concrete implementation)
   */
  abstract executeFunction(...args: any[]): Promise<void>;

  /**
   * Execute wrapper - calls executeFunction and returns empty string
   */
  async execute(args: any[], _context: any): Promise<string> {
    await this.executeFunction(...args);
    return ''; // Void functions return empty string
  }

  /**
   * Get function metadata
   */
  getMetadata() {
    return {
      getName: () => this.functionName,
      getDescription: () => this.functionDescription,
      hasReturnVariable: () => false // Void functions don't return variables
    };
  }
}