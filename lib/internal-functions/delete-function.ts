import { rmSync } from 'fs';
import { ReturnValueInternalFunction } from './return-value-internal-function.js';
import { InternalFunctionExecutionContext } from './internal-function-execution-context.interface.js';
import { ParameterIterator } from './parameter-iterator.js';

/**
 * DeleteFunction - Remove file or directory
 * Usage: var result = __delete "temp.txt"
 */
export class DeleteFunction extends ReturnValueInternalFunction {
  
  protected configure(): void {
    this.setName('__delete')
        .setDescription('Remove file or directory')
        .configureParameters(builder => 
          builder.addStringParameter('path', true)
        );
  }
  
  protected async executeCore(params: ParameterIterator, context: InternalFunctionExecutionContext): Promise<any> {
    const filePath = params.next();
    
    try {
      rmSync(filePath, { recursive: true, force: true });
      return `Deleted: ${filePath}`;
    } catch (error: any) {
      throw new Error(`Failed to delete '${filePath}': ${error.message}`);
    }
  }
}