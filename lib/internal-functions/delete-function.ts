import { rmSync } from 'fs';
import { BaseInternalFunction } from './base-function.js';
import { InternalFunctionExecutionContext } from './internal-function-execution-context.interface.js';
import { FunctionMetadata } from '../core/types/function-metadata.interface.js';

/**
 * DeleteFunction - Remove file or directory
 * Usage: __delete "temp.txt" or __delete "temp_dir"
 */
export class DeleteFunction extends BaseInternalFunction {
  public async execute(args: any[], context: InternalFunctionExecutionContext): Promise<any> {
    this.validateArgs(args);
    
    const filePath = args[0];
    
    try {
      rmSync(filePath, { recursive: true, force: true });
      return `Deleted: ${filePath}`;
    } catch (error: any) {
      throw new Error(`Failed to delete '${filePath}': ${error.message}`);
    }
  }

  private validateArgs(args: any[]): void {
    if (!args || args.length !== 1) {
      throw new Error('__delete requires exactly 1 argument: path');
    }
    
    if (!args[0] || typeof args[0] !== 'string') {
      throw new Error('__delete: path must be a non-empty string');
    }
  }

  public getMetadata(): FunctionMetadata {
    return {
      name: '__delete',
      description: 'Remove file or directory',
      returnVariable: false,
      parameters: [
        { name: 'path', type: 'string', description: 'Path to delete' }
      ]
    };
  }
}