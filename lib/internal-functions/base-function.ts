import { FunctionMetadata } from '../core/function-metadata.js';
import { InternalFunctionExecutionContext } from './internal-function-execution-context.interface.js';

/**
 * Abstract base class for all internal functions
 * Defines the interface that all internal function strategies must implement
 */
export abstract class BaseInternalFunction {
  protected runner: any;
  protected inputManager: any;

  constructor(runner?: any) {
    if (runner) {
      this.runner = runner;
      this.inputManager = runner.inputManager;
    }
  }
  
  /**
   * Set the runner after construction (for late binding)
   */
  public setRunner(runner: any): void {
    this.runner = runner;
    this.inputManager = runner.inputManager;
  }

  /**
   * Execute the internal function
   */
  abstract execute(args: any[], context: InternalFunctionExecutionContext): Promise<any>;

  /**
   * Get function metadata including name, description, parameters and return behavior
   */
  abstract getMetadata(): FunctionMetadata;

  /**
   * Parse a parameter value, handling different types
   */
  protected parseParameter(param: any, variables: Map<string, any>): any {
    if (typeof param === 'string') {
      return param;
    }
    
    if (param?.type === 'string') {
      return param.value;
    }
    
    if (param?.type === 'array') {
      return param.value;
    }
    
    if (param?.type === 'variable') {
      const value = variables.get(param.name);
      return value !== undefined ? value : `$${param.name}`;
    }
    
    if (param?.type === 'identifier') {
      return param.value;
    }
    
    return String(param);
  }
}