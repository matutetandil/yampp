import { BaseContentProcessor } from './base-content-processor.js';

/**
 * PowerShell Content Processor
 * Handles PowerShell-specific content processing including comment filtering and proxy injection
 */
export class PowerShellContentProcessor extends BaseContentProcessor {
  
  /**
   * OPTIONAL: Remove PowerShell-specific comments
   * Can optionally filter PowerShell # and <# #> comments in addition to Yampp comments
   * @param {string} content - Content after Yampp comment removal  
   * @returns {string} - Content after PowerShell comment processing
   */
  cleanShellComments(content) {
    // Optional: uncomment to also filter PowerShell comments
    // content = content.replace(/^\s*#.*$/gm, '');         // # comments
    // content = content.replace(/<#[\s\S]*?#>/g, '');     // <# #> block comments
    
    // For now, preserve PowerShell comments (they don't conflict with execution)
    return content;
  }

  /**
   * Inject PowerShell proxy functions and transform syntax
   * Transforms __func(args) to __func args and injects PowerShell function definitions
   * @param {string} content - Processed content ready for execution
   * @returns {Object} - PowerShell execution context
   */
  injectProxies(content) {
    // Generate proxy functions for all registered internal functions
    const proxyFunctions = this.generateProxyFunctions();
    
    // Transform Yampp DSL syntax to PowerShell syntax
    let transformedContent = content.replace(/__(\w+)((?:\s+\w+)?)\s*\(([^)]*)\)/g, (match, funcName, taskNameWithSpaces, args) => {
      const taskName = taskNameWithSpaces.trim();
      const cleanArgs = args.trim();
      
      let result = `__${funcName}`;
      if (taskName) {
        result += ` ${taskName}`;
      }
      if (cleanArgs) {
        result += ` ${cleanArgs}`;
      }
      
      return result;
    });
    
    return {
      shell: 'powershell',
      args: ['-Command', `${proxyFunctions}\n\n${transformedContent}`],
      processedCommand: transformedContent,
      hasProxies: true
    };
  }

  /**
   * Generate PowerShell proxy functions for all registered internal functions
   * @returns {string} - PowerShell function definitions
   */
  generateProxyFunctions() {
    const functionNames = this.internalFunctionRegistry.getFunctionNames();
    const proxies = [];

    for (const funcName of functionNames) {
      proxies.push(`
function __${funcName} {
  # Send intercept message to Yampp via stderr
  Write-Error "YAMPP_INTERCEPT:${funcName}:$args" -ErrorAction Continue
  
  # Create response file path
  $responseFile = "$env:TEMP\\yampp_response_$PID"
  
  # Wait for Yampp response (polling approach)
  $timeout = 0
  while (!(Test-Path $responseFile) -and ($timeout -lt 1000)) {
    Start-Sleep -Milliseconds 10
    $timeout++
  }
  
  # Check if we got a response
  if (!(Test-Path $responseFile)) {
    Write-Error "Timeout waiting for Yampp response"
    exit 1
  }
  
  # Read response and clean up
  try {
    $exitCode = Get-Content $responseFile -ErrorAction Stop
    Remove-Item $responseFile -ErrorAction SilentlyContinue
    exit $exitCode
  } catch {
    exit 1
  }
}`);
    }

    return proxies.join('\n');
  }
}