import { readFileSync } from 'fs';
import { BaseInternalFunction } from './base-function.js';
import { InternalFunctionExecutionContext } from './internal-function-execution-context.interface.js';
import { FunctionMetadata } from '../core/types/function-metadata.interface.js';

/**
 * ReadFileFunction - Read file content as string
 * Usage: content=$(__read_file "config.json")
 */
export class ReadFileFunction extends BaseInternalFunction {
  public async execute(args: any[], context: InternalFunctionExecutionContext): Promise<any> {
    this.validateArgs(args);
    
    const filePath = args[0];
    
    try {
      const content = readFileSync(filePath, 'utf-8');
      return content;
    } catch (error: any) {
      throw new Error(`Failed to read file '${filePath}': ${error.message}`);
    }
  }

  private validateArgs(args: any[]): void {
    if (!args || args.length !== 1) {
      throw new Error('__read_file requires exactly 1 argument: path');
    }
    
    if (!args[0] || typeof args[0] !== 'string') {
      throw new Error('__read_file: path must be a non-empty string');
    }
  }

  public getMetadata(): FunctionMetadata {
    return {
      name: '__read_file',
      description: 'Read file content as string',
      returnVariable: true,
      parameters: [
        { name: 'path', type: 'string', description: 'Path to file to read' }
      ]
    };
  }
}