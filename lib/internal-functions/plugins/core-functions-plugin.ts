import { IFunctionPlugin } from '../interfaces/function-plugin.interface.js';
import { BaseInternalFunction } from '../base-function.js';
import { InputFunction } from '../input-function.js';
import { InputPasswordFunction } from '../input-password-function.js';
import { InputSelectFunction } from '../input-select-function.js';
import { InputConfirmFunction } from '../input-confirm-function.js';
import { CallFunction } from '../call-function.js';
import { CallIgnoreFunction } from '../call-ignore-function.js';
import { ReadFileFunction } from '../read-file-function.js';
import { WriteFileFunction } from '../write-file-function.js';
import { FileExistsFunction } from '../file-exists-function.js';
import { CopyFunction } from '../copy-function.js';
import { MoveFunction } from '../move-function.js';
import { DeleteFunction } from '../delete-function.js';
import { AssignFunction } from '../assign-function.js';
import { CallAsyncFunction } from '../call-async-function.js';
import { CallAsyncIgnoreFunction } from '../call-async-ignore-function.js';

export class CoreFunctionsPlugin implements IFunctionPlugin {
  private functions = new Map<string, BaseInternalFunction>();
  private runner: any;

  public getName(): string {
    return 'core-functions';
  }

  public getVersion(): string {
    return '1.0.0';
  }

  public getDescription(): string {
    return 'Core internal functions for YAMPP (input, file operations, task calls)';
  }

  public getFunctions(): Map<string, BaseInternalFunction> {
    return this.functions;
  }

  public initialize(runner: any): void {
    this.runner = runner;
    this.registerCoreFunctions();
  }

  public isCompatible(): boolean {
    // Core functions are always compatible
    return true;
  }

  private registerCoreFunctions(): void {
    // Input functions
    this.addFunction('input', new InputFunction());
    this.addFunction('input_password', new InputPasswordFunction());
    this.addFunction('input_select', new InputSelectFunction());
    this.addFunction('input_confirm', new InputConfirmFunction());
    
    // Task management
    this.addFunction('call', new CallFunction());
    this.addFunction('call_ignore', new CallIgnoreFunction());
    this.addFunction('call_async', new CallAsyncFunction());
    this.addFunction('call_async_ignore', new CallAsyncIgnoreFunction());
    
    // Variable assignment
    this.addFunction('assign', new AssignFunction());
    
    // File I/O functions
    this.addFunction('read_file', new ReadFileFunction());
    this.addFunction('write_file', new WriteFileFunction());
    this.addFunction('file_exists', new FileExistsFunction());
    this.addFunction('copy', new CopyFunction());
    this.addFunction('move', new MoveFunction());
    this.addFunction('delete', new DeleteFunction());
  }

  private addFunction(name: string, func: BaseInternalFunction): void {
    func.setRunner(this.runner);
    this.functions.set(name, func);
  }
}