import { copyFileSync, cpSync, statSync } from 'fs';
import { BaseInternalFunction } from './base-function.js';
import { InternalFunctionExecutionContext } from './internal-function-execution-context.interface.js';
import { FunctionMetadata } from '../core/types/function-metadata.interface.js';

/**
 * CopyFunction - Copy file or directory
 * Usage: __copy "backup.tar" "backup.$(date +%Y%m%d).tar"
 */
export class CopyFunction extends BaseInternalFunction {
  public async execute(args: any[], context: InternalFunctionExecutionContext): Promise<any> {
    this.validateArgs(args);
    
    const [source, destination] = args;
    
    try {
      const stat = statSync(source);
      
      if (stat.isDirectory()) {
        // Copy directory recursively
        cpSync(source, destination, { recursive: true });
      } else {
        // Copy single file
        copyFileSync(source, destination);
      }
      
      return `Copied: ${source} → ${destination}`;
    } catch (error: any) {
      throw new Error(`Failed to copy '${source}' to '${destination}': ${error.message}`);
    }
  }

  private validateArgs(args: any[]): void {
    if (!args || args.length !== 2) {
      throw new Error('__copy requires exactly 2 arguments: source, destination');
    }
    
    if (!args[0] || typeof args[0] !== 'string') {
      throw new Error('__copy: source must be a non-empty string');
    }
    
    if (!args[1] || typeof args[1] !== 'string') {
      throw new Error('__copy: destination must be a non-empty string');
    }
  }

  public getMetadata(): FunctionMetadata {
    return {
      name: '__copy',
      description: 'Copy file or directory',
      returnVariable: false,
      parameters: [
        { name: 'source', type: 'string', description: 'Source path to copy from' },
        { name: 'destination', type: 'string', description: 'Destination path to copy to' }
      ]
    };
  }
}