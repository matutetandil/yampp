import { BaseContentProcessor } from './base-content-processor.js';

/**
 * Bash/sh Shell Content Processor
 * Handles Bash-specific content processing including comment filtering and proxy injection
 */
export class BashContentProcessor extends BaseContentProcessor {
  
  /**
   * OPTIONAL: Remove bash-specific comments
   * Can optionally filter bash # comments in addition to Yampp comments
   * @param {string} content - Content after Yampp comment removal  
   * @returns {string} - Content after bash comment processing
   */
  cleanShellComments(content) {
    // Optional: uncomment to also filter bash # comments
    // content = content.replace(/^\s*#.*$/gm, '');
    
    // For now, preserve bash comments (they don't conflict with execution)
    return content;
  }

  /**
   * Inject bash proxy functions and transform syntax
   * Transforms __func(args) to __func args and injects bash function definitions
   * @param {string} content - Processed content ready for execution
   * @returns {Object} - Bash execution context
   */
  injectProxies(content) {
    // Generate proxy functions for all registered internal functions
    const proxyFunctions = this.generateProxyFunctions();
    
    // Transform Yampp DSL syntax to bash syntax
    // Handles patterns like:
    //   __func(args) -> __func args
    //   __func  (  args  ) -> __func args  
    //   __func taskname(args) -> __func taskname args
    //   __call    task   (   args   ) -> __call task args
    let transformedContent = content.replace(/__(\w+)((?:\s+\w+)?)\s*\(([^)]*)\)/g, (match, funcName, taskNameWithSpaces, args) => {
      // Extract task name if present (taskNameWithSpaces may have leading spaces)
      const taskName = taskNameWithSpaces.trim();
      // Clean up arguments
      const cleanArgs = args.trim();
      
      // Build the bash function call without parentheses
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
      shell: 'sh',
      args: ['-e', '-c', `${proxyFunctions}\n\n${transformedContent}`],
      processedCommand: transformedContent,
      hasProxies: true
    };
  }

  /**
   * Generate bash proxy functions for all registered internal functions
   * @returns {string} - Bash function definitions
   */
  generateProxyFunctions() {
    const functionNames = this.internalFunctionRegistry.getFunctionNames();
    const proxies = [];

    for (const funcName of functionNames) {
      proxies.push(`
__${funcName}() {
  # Send intercept message to Yampp via stderr
  echo "YAMPP_INTERCEPT:${funcName}:\$*" >&2
  
  # Create response file path  
  local response_file="/tmp/yampp_response_$$"
  
  # Wait for Yampp response (polling approach)
  local timeout=0
  while [ ! -f "\$response_file" ] && [ \$timeout -lt 1000 ]; do
    sleep 0.01  # 10ms polling interval
    timeout=\$((timeout + 1))
  done
  
  # Check if we got a response
  if [ ! -f "\$response_file" ]; then
    echo "Timeout waiting for Yampp response" >&2
    return 1
  fi
  
  # Read response and clean up
  local exit_code=\$(cat "\$response_file" 2>/dev/null || echo "1")
  rm -f "\$response_file" 2>/dev/null
  
  return \$exit_code
}`);
    }

    return proxies.join('\n');
  }
}