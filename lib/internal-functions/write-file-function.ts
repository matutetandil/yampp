import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { ReturnValueInternalFunction } from './return-value-internal-function.js';
import { InternalFunctionExecutionContext } from './internal-function-execution-context.interface.js';
import { ParameterIterator } from './parameter-iterator.js';

/**
 * WriteFileFunction - Write content to file
 * Usage: var result = __write_file "output.txt" "Build completed at $(date)"
 */
export class WriteFileFunction extends ReturnValueInternalFunction {
  
  protected configure(): void {
    this.setName('__write_file')
        .setDescription('Write content to file')
        .configureParameters(builder => 
          builder.addStringParameter('path', true)
                 .addStringParameter('content', true)
        );
  }
  
  protected async executeCore(params: ParameterIterator, context: InternalFunctionExecutionContext): Promise<any> {
    const filePath = params.next();
    const content = params.next();
    
    try {
      // Create directory if it doesn't exist
      const dir = dirname(filePath);
      mkdirSync(dir, { recursive: true });
      
      // Write file
      writeFileSync(filePath, content, 'utf-8');
      
      return filePath;
    } catch (error: any) {
      throw new Error(`Failed to write file '${filePath}': ${error.message}`);
    }
  }
}