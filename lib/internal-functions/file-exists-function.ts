import { existsSync } from 'fs';
import { ReturnValueInternalFunction } from './return-value-internal-function.js';
import { InternalFunctionExecutionContext } from './internal-function-execution-context.interface.js';
import { ParameterIterator } from './parameter-iterator.js';

/**
 * FileExistsFunction - Check if file or directory exists
 * Usage: var exists = __file_exists "backup.tar"
 */
export class FileExistsFunction extends ReturnValueInternalFunction {
  
  protected configure(): void {
    this.setName('__file_exists')
        .setDescription('Check if file or directory exists')
        .configureParameters(builder => 
          builder.addStringParameter('path', true)
        );
  }
  
  protected async executeCore(params: ParameterIterator, context: InternalFunctionExecutionContext): Promise<any> {
    const filePath = params.next();
    
    try {
      const exists = existsSync(filePath);
      return exists ? 'true' : 'false';
    } catch (error: any) {
      // If there's an error checking existence, assume it doesn't exist
      return 'false';
    }
  }
}