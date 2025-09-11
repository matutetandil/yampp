import { renameSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { ReturnValueInternalFunction } from './return-value-internal-function.js';
import { InternalFunctionExecutionContext } from './internal-function-execution-context.interface.js';
import { ParameterIterator } from './parameter-iterator.js';

/**
 * MoveFunction - Move/rename file or directory
 * Usage: var result = __move "old.txt" "new.txt"
 */
export class MoveFunction extends ReturnValueInternalFunction {
  
  protected configure(): void {
    this.setName('__move')
        .setDescription('Move/rename file or directory')
        .configureParameters(builder => 
          builder.addStringParameter('source', true)
                 .addStringParameter('destination', true)
        );
  }
  
  protected async executeCore(params: ParameterIterator, context: InternalFunctionExecutionContext): Promise<any> {
    const source = params.next();
    const destination = params.next();
    
    try {
      // Create destination directory if it doesn't exist
      const destDir = dirname(destination);
      mkdirSync(destDir, { recursive: true });
      
      // Move/rename file
      renameSync(source, destination);
      
      return `Moved: ${source} -> ${destination}`;
    } catch (error: any) {
      throw new Error(`Failed to move '${source}' to '${destination}': ${error.message}`);
    }
  }
}