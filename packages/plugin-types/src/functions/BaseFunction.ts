/**
 * Abstract base class for all plugin functions
 * Single Responsibility: Define the contract for plugin functions
 */
export abstract class BaseFunction {
  /**
   * Execute the function
   */
  abstract execute(args: any[], context: any): Promise<any>;

  /**
   * Get function metadata including name, description, and return behavior
   */
  abstract getMetadata(): {
    getName(): string;
    getDescription(): string;
    hasReturnVariable(): boolean;
  };
}