import { readFileSync } from 'fs';
import { ReturnValueInternalFunction } from './return-value-internal-function.js';
import { InternalFunctionExecutionContext } from './internal-function-execution-context.interface.js';
import { ParameterIterator } from './parameter-iterator.js';

/**
 * ReadFileFunction - Read file content as string
 * Usage: var content = __read_file "config.json"
 */
export class ReadFileFunction extends ReturnValueInternalFunction {
  
  protected configure(): void {
    this.setName('__read_file')
        .setDescription('Read file content as string')
        .configureParameters(builder => 
          builder.addStringParameter('path', true)
        );
  }
  
  protected async executeCore(params: ParameterIterator, context: InternalFunctionExecutionContext): Promise<any> {
    const filePath = params.next();
    
    try {
      const content = readFileSync(filePath, 'utf-8');
      return content;
    } catch (error: any) {
      throw new Error(`Failed to read file '${filePath}': ${error.message}`);
    }
  }
}