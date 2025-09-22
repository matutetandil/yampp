import { BaseContentProcessor } from './base-content-processor.js';
import { ExecutionContext } from '../execution/types/execution-context.js';

/**
 * CMD/Batch Content Processor
 * Handles Windows CMD/Batch-specific content processing including comment filtering and proxy injection
 */
export class CmdContentProcessor extends BaseContentProcessor {
  
  /**
   * OPTIONAL: Remove CMD/Batch-specific comments
   * Can optionally filter REM and :: comments in addition to Yampp comments
   */
  protected cleanShellComments(content: string): string {
    // Optional: uncomment to also filter CMD/Batch comments
    // content = content.replace(/^\s*REM\s.*$/gmi, '');   // REM comments (case insensitive)
    // content = content.replace(/^\s*::.*$/gm, '');       // :: comments
    
    // For now, preserve CMD comments (they don't conflict with execution)
    return content;
  }

  /**
   * Generate CMD/Batch-specific code from pre-processed data
   */
  protected generateTargetCode(data: any): string {
    let generatedCode = '';
    
    // Generate variable assignments
    for (const assignment of data.variableAssignments) {
      if (assignment.isInternalFunction) {
        // Transform internal function call to CMD syntax
        // var x = __input "test" -> SET x=__input x "test"
        // Pass variable name as first parameter for proper value binding
        const funcCall = assignment.value.replace(/^__(\w+)/, `__$1 ${assignment.name}`);
        generatedCode += `SET ${assignment.name}=${funcCall}\n`;
      } else {
        // Regular variable assignment
        // var x = "value" -> SET x="value"
        generatedCode += `SET ${assignment.name}=${assignment.value}\n`;
      }
    }
    
    // Add standalone commands
    if (data.standaloneCommands.length > 0) {
      generatedCode += data.standaloneCommands.join('\n') + '\n';
    }
    
    return generatedCode;
  }

  /**
   * Inject CMD/Batch proxy functions and transform syntax
   * Transforms __func(args) to __func args and injects batch function definitions
   */
  protected injectProxies(content: string): ExecutionContext {
    // Generate proxy functions for all registered internal functions
    const proxyFunctions = this.generateProxyFunctions();
    
    // Transform Yampp DSL syntax to batch syntax
    let transformedContent = content.replace(/__(\w+)((?:\s+\w+)?)\s*\(([^)]*)\)/g, (match, funcName, taskNameWithSpaces, args) => {
      const taskName = taskNameWithSpaces.trim();
      const cleanArgs = args.trim();
      
      let result = `call :__${funcName}`;
      if (taskName) {
        result += ` ${taskName}`;
      }
      if (cleanArgs) {
        result += ` ${cleanArgs}`;
      }
      
      return result;
    });
    
    return {
      shell: 'cmd',
      args: ['/c', `${proxyFunctions}\n\n${transformedContent}`],
      hasProxies: true,
      content: transformedContent
    };
  }

  /**
   * Generate CMD/Batch proxy functions for all registered internal functions
   */
  private generateProxyFunctions(): string {
    const functionNames = this.internalFunctionRegistry.getRegisteredFunctions();
    const proxies: string[] = [];

    for (const funcName of functionNames) {
      proxies.push(`
:__${funcName}
  REM Send intercept message to Yampp via stderr
  echo YAMPP_INTERCEPT:${funcName}:%* >&2
  
  REM Create response file path
  set "responseFile=%TEMP%\\yampp_response_%RANDOM%"
  
  REM Wait for Yampp response (polling approach)
  set "timeout=0"
  :wait_${funcName}
  if exist "%responseFile%" goto read_${funcName}
  if %timeout% geq 1000 goto timeout_${funcName}
  timeout /t 0 >nul 2>&1
  set /a timeout+=1
  goto wait_${funcName}
  
  :timeout_${funcName}
  echo Timeout waiting for Yampp response >&2
  exit /b 1
  
  :read_${funcName}
  set /p exitCode=<"%responseFile%"
  del "%responseFile%" >nul 2>&1
  exit /b %exitCode%`);
    }

    return proxies.join('\n');
  }
}