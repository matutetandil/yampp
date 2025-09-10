import { renameSync } from 'fs';
import { BaseInternalFunction } from './base-function.js';
import { InternalFunctionExecutionContext } from './internal-function-execution-context.interface.js';
import { FunctionMetadata } from '../core/types/function-metadata.interface.js';

/**
 * MoveFunction - Move/rename file or directory
 * Usage: __move "temp.txt" "final.txt"
 */
export class MoveFunction extends BaseInternalFunction {
  public async execute(args: any[], context: InternalFunctionExecutionContext): Promise<any> {
    this.validateArgs(args);
    
    const [source, destination] = args;
    
    try {
      renameSync(source, destination);
      return `Moved: ${source} → ${destination}`;
    } catch (error: any) {
      throw new Error(`Failed to move '${source}' to '${destination}': ${error.message}`);
    }
  }

  private validateArgs(args: any[]): void {
    if (!args || args.length !== 2) {
      throw new Error('__move requires exactly 2 arguments: source, destination');
    }
    
    if (!args[0] || typeof args[0] !== 'string') {
      throw new Error('__move: source must be a non-empty string');
    }
    
    if (!args[1] || typeof args[1] !== 'string') {
      throw new Error('__move: destination must be a non-empty string');
    }
  }

  public getMetadata(): FunctionMetadata {
    return {
      name: '__move',
      description: 'Move/rename file or directory',
      returnVariable: false,
      parameters: [
        { name: 'source', type: 'string', description: 'Source path to move from' },
        { name: 'destination', type: 'string', description: 'Destination path to move to' }
      ]
    };
  }
}