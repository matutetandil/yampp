import { InputFunction } from './input-function.js';
import { InputPasswordFunction } from './input-password-function.js';
import { InputSelectFunction } from './input-select-function.js';
import { InputConfirmFunction } from './input-confirm-function.js';
import { CallFunction } from './call-function.js';
import { ReadFileFunction } from './read-file-function.js';
import { WriteFileFunction } from './write-file-function.js';
import { FileExistsFunction } from './file-exists-function.js';
import { CopyFunction } from './copy-function.js';
import { MoveFunction } from './move-function.js';
import { DeleteFunction } from './delete-function.js';
import { BaseInternalFunction } from './base-function.js';
import { InternalFunctionExecutionContext } from './internal-function-execution-context.interface.js';
import { FunctionMetadata } from '../core/function-metadata.js';
import { IInternalFunctionRegistry } from './internal-function-registry.interface.js';
import { IVariableMap } from '../core/types/variable-map.interface.js';
import { ITaskPromiseMap } from '../tasks/interfaces/task-promise-map.interface.js';
import { ILimit } from '../core/types/limit.interface.js';
import { IInternalFunction } from './internal-function.interface.js';

/**
 * Registry for internal functions
 * Manages all internal function strategies and provides a clean API
 */

export class InternalFunctionRegistry implements IInternalFunctionRegistry {
  private readonly runner: any;
  private readonly functions: Map<string, BaseInternalFunction>;

  constructor(runner: any) {
    this.runner = runner;
    this.functions = new Map();
    this.registerBuiltInFunctions();
  }

  /**
   * Register all built-in internal functions
   */
  private registerBuiltInFunctions(): void {
    // All functions now use new pattern - create and set runner
    const inputFunc = new InputFunction();
    inputFunc.setRunner(this.runner);
    this.registerByName('input', inputFunc);
    
    const inputPasswordFunc = new InputPasswordFunction();
    inputPasswordFunc.setRunner(this.runner);
    this.registerByName('input_password', inputPasswordFunc);
    
    const inputSelectFunc = new InputSelectFunction();
    inputSelectFunc.setRunner(this.runner);
    this.registerByName('input_select', inputSelectFunc);
    
    const inputConfirmFunc = new InputConfirmFunction();
    inputConfirmFunc.setRunner(this.runner);
    this.registerByName('input_confirm', inputConfirmFunc);
    
    const callFunc = new CallFunction();
    callFunc.setRunner(this.runner);
    this.registerByName('call', callFunc);
    
    const readFileFunc = new ReadFileFunction();
    readFileFunc.setRunner(this.runner);
    this.registerByName('read_file', readFileFunc);
    
    const writeFileFunc = new WriteFileFunction();
    writeFileFunc.setRunner(this.runner);
    this.registerByName('write_file', writeFileFunc);
    
    const fileExistsFunc = new FileExistsFunction();
    fileExistsFunc.setRunner(this.runner);
    this.registerByName('file_exists', fileExistsFunc);
    
    const copyFunc = new CopyFunction();
    copyFunc.setRunner(this.runner);
    this.registerByName('copy', copyFunc);
    
    const moveFunc = new MoveFunction();
    moveFunc.setRunner(this.runner);
    this.registerByName('move', moveFunc);
    
    const deleteFunc = new DeleteFunction();
    deleteFunc.setRunner(this.runner);
    this.registerByName('delete', deleteFunc);
  }

  /**
   * Register a new internal function
   */
  public register(functionHandler: unknown): void {
    if (functionHandler instanceof BaseInternalFunction) {
      // Extract name from the handler (assuming it has a getName method or similar)
      const name = (functionHandler as any).getName?.() || (functionHandler as any).name;
      if (name) {
        this.functions.set(name, functionHandler);
      }
    }
  }

  /**
   * Register a new internal function by name
   */
  private registerByName(name: string, handler: BaseInternalFunction): void {
    this.functions.set(name, handler);
  }

  /**
   * Execute an internal function
   */
  public async execute(
    func: IInternalFunction,
    variables: IVariableMap,
    signature: string,
    taskPromises: ITaskPromiseMap,
    limit: ILimit,
    serialLimit: ILimit
  ): Promise<unknown> {
    const handler = this.functions.get(func.name);
    
    if (!handler) {
      if (!this.runner.quiet) {
        console.warn(`Warning: Unknown internal function __${func.name}`);
      }
      return null;
    }

    // Extract args from func.params for the handler
    const rawArgs = func.params || [];
    
    // Convert parameter objects to their values
    const args = rawArgs.map((param: any) => {
      if (param && typeof param === 'object' && param.value !== undefined) {
        return param.value;
      }
      return param;
    });
    
    const context = {
      variables,
      signature,
      taskPromises,
      limit,
      serialLimit
    };
    
    return await handler.execute(args, context);
  }

  /**
   * Check if a function is registered
   */
  public has(name: string): boolean {
    return this.functions.has(name);
  }

  /**
   * Get all registered function names
   */
  public getFunctionNames(): string[] {
    return Array.from(this.functions.keys());
  }

  /**
   * Unregister a function
   */
  public unregister(functionName: string): boolean {
    return this.functions.delete(functionName);
  }

  /**
   * Get all registered functions (alias for getFunctionNames for interface compatibility)
   */
  public getRegisteredFunctions(): string[] {
    return this.getFunctionNames();
  }

  /**
   * Get function metadata by name
   */
  public getFunctionMetadata(name: string): FunctionMetadata | null {
    const handler = this.functions.get(name);
    if (handler && typeof handler.getMetadata === 'function') {
      return handler.getMetadata();
    }
    return null;
  }
}