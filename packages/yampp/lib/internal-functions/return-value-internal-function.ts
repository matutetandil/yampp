import { BaseInternalFunction } from './base-function.js';
import { InternalFunctionExecutionContext } from './internal-function-execution-context.interface.js';
import { FunctionMetadata } from '../core/function-metadata.js';
import { FunctionParameterBuilder } from './function-parameter-builder.js';
import { ParameterIterator } from './parameter-iterator.js';
import { FunctionParameter } from './types/function-parameter.js';

/**
 * Abstract base class for return value internal functions (functions that return values)
 * Handles common patterns for functions like __input, __read_file, __file_exists, etc.
 * 
 * Automatically manages:
 * - Variable name as first parameter (new syntax)
 * - Variable storage in context
 * - Return value handling
 * - Parameter validation and iteration
 * 
 * Subclasses only need to implement:
 * - configure(): void - Set function name and parameters
 * - executeCore(params, context): Promise<any>
 */
export abstract class ReturnValueInternalFunction extends BaseInternalFunction {
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
    // With new syntax, first arg is always variable name, rest are function parameters
    if (!args || args.length < 1) {
      throw new Error(`${this.functionName} requires at least 1 argument: variable name`);
    }

    const variableName = args[0];
    const functionArgs = args.slice(1); // Rest of arguments are for the function

    if (!variableName || typeof variableName !== 'string') {
      throw new Error(`${this.functionName}: variable name must be a non-empty string`);
    }

    // Create parameter iterator with validation
    const paramIterator = new ParameterIterator(this.parameters, functionArgs);

    // Add variable name to context for functions that need it
    const extendedContext = {
      ...context,
      variableName: variableName
    };

    // Execute core logic with validated parameters
    const result = await this.executeCore(paramIterator, extendedContext);

    // Store result in variables for access
    const variables = context.variables;
    variables.set(variableName, result);

    return result;
  }

  public getMetadata(): FunctionMetadata {
    const metadata = new FunctionMetadata();
    metadata.setName(this.functionName)
            .setDescription(this.functionDescription)
            .setReturnVariable(true)
            .setParameters(this.parameters);
    return metadata;
  }

  /**
   * Core execution logic - implemented by subclasses
   * @param params Parameter iterator with validated parameters
   * @param context Execution context with variables, etc.
   * @returns The value to be returned and stored in the variable
   */
  protected abstract executeCore(params: ParameterIterator, context: InternalFunctionExecutionContext): Promise<any>;
}