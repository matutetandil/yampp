import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { BaseInternalFunction } from './base-function.js';
import { InternalFunctionExecutionContext } from './internal-function-execution-context.interface.js';
import { FunctionMetadata } from '../core/types/function-metadata.interface.js';

/**
 * WriteFileFunction - Write content to file
 * Usage: __write_file "output.txt" "Build completed at $(date)"
 */
export class WriteFileFunction extends BaseInternalFunction {
  public async execute(args: any[], context: InternalFunctionExecutionContext): Promise<any> {
    this.validateArgs(args);
    
    const [filePath, content] = args;
    
    try {
      // Create directory if it doesn't exist
      const dir = dirname(filePath);
      mkdirSync(dir, { recursive: true });
      
      // Write file
      writeFileSync(filePath, content, 'utf-8');
      
      return `File written: ${filePath}`;
    } catch (error: any) {
      throw new Error(`Failed to write file '${filePath}': ${error.message}`);
    }
  }

  private validateArgs(args: any[]): void {
    if (!args || args.length !== 2) {
      throw new Error('__write_file requires exactly 2 arguments: path, content');
    }
    
    if (!args[0] || typeof args[0] !== 'string') {
      throw new Error('__write_file: path must be a non-empty string');
    }
    
    if (args[1] === null || args[1] === undefined) {
      throw new Error('__write_file: content cannot be null or undefined');
    }
  }

  public getMetadata(): FunctionMetadata {
    return {
      name: '__write_file',
      description: 'Write content to file',
      returnVariable: false,
      parameters: [
        { name: 'path', type: 'string', description: 'Path to file to write' },
        { name: 'content', type: 'string', description: 'Content to write to file' }
      ]
    };
  }
}