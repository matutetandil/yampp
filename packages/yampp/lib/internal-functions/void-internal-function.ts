import { BaseInternalFunction } from './base-function.js';
import { InternalFunctionExecutionContext } from './internal-function-execution-context.interface.js';
import { FunctionMetadata } from '../core/function-metadata.js';
import { FunctionParameterBuilder } from './function-parameter-builder.js';
import { ParameterIterator } from './parameter-iterator.js';
import { FunctionParameter } from './types/function-parameter.js';

/**
 * Abstract base class for void internal functions (functions that don't return values)
 * Handles common patterns for functions like __call, __delete, etc.
 * 
 * Automatically manages:
 * - Parameter validation and iteration
 * - Metadata generation
 * 
 * Subclasses only need to implement:
 * - configure(): void - Set function name and parameters
 * - executeCore(params, context): Promise<void>
 */
export abstract class VoidInternalFunction extends BaseInternalFunction {
  private functionName: string = '';
  private functionDescription: string = '';
  private parameters: FunctionParameter[] = [];

  constructor() {
    super();
    this.configure();
  }

  /**
   * Configure function name and parameters
   * Must be implemented by subclasses
   */
  protected abstract configure(): void;

  /**
   * Set function name
   */
  protected setName(name: string): this {
    this.functionName = name;
    return this;
  }

  /**
   * Set function description
   */
  protected setDescription(description: string): this {
    this.functionDescription = description;
    return this;
  }

  /**
   * Configure parameters using builder
   */
  protected configureParameters(builder: (b: FunctionParameterBuilder) => FunctionParameterBuilder): this {
    const paramBuilder = new FunctionParameterBuilder();
    this.parameters = builder(paramBuilder).build();
    return this;
  }
  
  public async execute(args: any[], context: InternalFunctionExecutionContext): Promise<any> {
    // Create parameter iterator with validation
    const paramIterator = new ParameterIterator(this.parameters, args);
    
    // Execute core logic with validated parameters
    await this.executeCore(paramIterator, context);
    
    return undefined; // Void functions don't return values
  }

  public getMetadata(): FunctionMetadata {
    const metadata = new FunctionMetadata();
    metadata.setName(this.functionName)
            .setDescription(this.functionDescription)
            .setReturnVariable(false)
            .setParameters(this.parameters);
    return metadata;
  }

  /**
   * Core execution logic - implemented by subclasses
   * @param params Parameter iterator with validated parameters
   * @param context Execution context with variables, etc.
   */
  protected abstract executeCore(params: ParameterIterator, context: InternalFunctionExecutionContext): Promise<void>;
}