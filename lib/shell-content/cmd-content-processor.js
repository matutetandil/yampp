import { BaseContentProcessor } from './base-content-processor.js';

/**
 * CMD/Batch Content Processor
 * Handles Windows CMD/Batch-specific content processing including comment filtering and proxy injection
 */
export class CmdContentProcessor extends BaseContentProcessor {
  
  /**
   * OPTIONAL: Remove CMD/Batch-specific comments
   * Can optionally filter REM and :: comments in addition to Yampp comments
   * @param {string} content - Content after Yampp comment removal  
   * @returns {string} - Content after CMD comment processing
   */
  cleanShellComments(content) {
    // Optional: uncomment to also filter CMD/Batch comments
    // content = content.replace(/^\s*REM\s.*$/gmi, '');   // REM comments (case insensitive)
    // content = content.replace(/^\s*::.*$/gm, '');       // :: comments
    
    // For now, preserve CMD comments (they don't conflict with execution)
    return content;
  }

  /**
   * Inject CMD/Batch proxy functions and transform syntax
   * Transforms __func(args) to __func args and injects batch function definitions
   * @param {string} content - Processed content ready for execution
   * @returns {Object} - CMD execution context
   */
  injectProxies(content) {
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
      processedCommand: transformedContent,
      hasProxies: true
    };
  }

  /**
   * Generate CMD/Batch proxy functions for all registered internal functions
   * @returns {string} - Batch function definitions
   */
  generateProxyFunctions() {
    const functionNames = this.internalFunctionRegistry.getFunctionNames();
    const proxies = [];

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