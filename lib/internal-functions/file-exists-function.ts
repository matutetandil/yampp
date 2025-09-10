import { existsSync } from 'fs';
import { BaseInternalFunction } from './base-function.js';
import { InternalFunctionExecutionContext } from './internal-function-execution-context.interface.js';
import { FunctionMetadata } from '../core/types/function-metadata.interface.js';

/**
 * FileExistsFunction - Check if file or directory exists
 * Usage: if $(__file_exists "backup.tar"); then
 */
export class FileExistsFunction extends BaseInternalFunction {
  public async execute(args: any[], context: InternalFunctionExecutionContext): Promise<any> {
    this.validateArgs(args);
    
    const filePath = args[0];
    
    try {
      const exists = existsSync(filePath);
      return exists ? 'true' : 'false';
    } catch (error: any) {
      // If there's an error checking existence, assume it doesn't exist
      return 'false';
    }
  }

  private validateArgs(args: any[]): void {
    if (!args || args.length !== 1) {
      throw new Error('__file_exists requires exactly 1 argument: path');
    }
    
    if (!args[0] || typeof args[0] !== 'string') {
      throw new Error('__file_exists: path must be a non-empty string');
    }
  }

  public getMetadata(): FunctionMetadata {
    return {
      name: '__file_exists',
      description: 'Check if file or directory exists',
      returnVariable: true,
      parameters: [
        { name: 'path', type: 'string', description: 'Path to check for existence' }
      ]
    };
  }
}