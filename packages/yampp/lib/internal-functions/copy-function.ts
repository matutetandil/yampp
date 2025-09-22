import { copyFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { ReturnValueInternalFunction } from './return-value-internal-function.js';
import { InternalFunctionExecutionContext } from './internal-function-execution-context.interface.js';
import { ParameterIterator } from './parameter-iterator.js';

/**
 * CopyFunction - Copy file or directory
 * Usage: var result = __copy "source.txt" "dest.txt"
 */
export class CopyFunction extends ReturnValueInternalFunction {
  
  protected configure(): void {
    this.setName('__copy')
        .setDescription('Copy file or directory')
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
      
      // Copy file
      copyFileSync(source, destination);
      
      return `Copied: ${source} -> ${destination}`;
    } catch (error: any) {
      throw new Error(`Failed to copy '${source}' to '${destination}': ${error.message}`);
    }
  }
}