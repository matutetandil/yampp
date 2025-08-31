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
   * Inject inline proxy code and transform syntax  
   * Replaces each __func call with inline intercept code (no functions, same scope)
   * @param {string} content - Processed content ready for execution
   * @returns {Object} - Bash execution context
   */
  injectProxies(content) {
    // Transform Yampp DSL syntax and replace with inline intercept code
    // Handles patterns like:
    //   __func(args) -> inline intercept code
    //   __func  (  args  ) -> inline intercept code  
    //   __func taskname(args) -> inline intercept code for taskname
    //   __call    task   (   args   ) -> inline intercept code for call
    let transformedContent = content.replace(/__(\w+)((?:\s+\w+)?)\s*\(([^)]*)\)/g, (match, funcName, taskNameWithSpaces, args) => {
      // Extract task name if present (taskNameWithSpaces may have leading spaces)
      const taskName = taskNameWithSpaces.trim();
      // Clean up arguments
      const cleanArgs = args.trim();
      
      // Build arguments string for intercept
      let interceptArgs = '';
      if (taskName) {
        interceptArgs = taskName;
        if (cleanArgs) {
          const parsedArgs = this.parseArgsRespectingQuotes(cleanArgs);
          interceptArgs += '|||' + parsedArgs.join('|||');
        }
      } else if (cleanArgs) {
        const parsedArgs = this.parseArgsRespectingQuotes(cleanArgs);
        interceptArgs = parsedArgs.join('|||');
      }
      
      return this.generateInlineInterceptCode(funcName, interceptArgs);
    });
    
    // Also handle calls without parentheses (already transformed)
    transformedContent = transformedContent.replace(/__(\w+)\s+(.+)/g, (match, funcName, argsString) => {
      // Skip if this was already processed (contains intercept code)
      if (match.includes('YAMPP_INTERCEPT')) {
        return match;
      }
      
      // Use proper argument parsing that respects quotes
      const parsedArgs = this.parseArgsRespectingQuotes(argsString.trim());
      const interceptArgs = parsedArgs.join('|||');
      return this.generateInlineInterceptCode(funcName, interceptArgs);
    });
    
    
    return {
      shell: 'sh',
      args: ['-e', '-c', transformedContent],
      processedCommand: transformedContent,
      hasProxies: true
    };
  }

  /**
   * Parse arguments respecting quotes (similar to shell parsing)
   * @param {string} argsString - Arguments string like '"arg1" arg2 "arg3 with spaces"'
   * @returns {Array<string>} - Parsed arguments without quotes
   */
  parseArgsRespectingQuotes(argsString) {
    const args = [];
    const regex = /"([^"]*)"|'([^']*)'|(\S+)/g;
    let match;
    
    while ((match = regex.exec(argsString)) !== null) {
      if (match[1] !== undefined) {
        // Double quoted string
        args.push(match[1]);
      } else if (match[2] !== undefined) {
        // Single quoted string  
        args.push(match[2]);
      } else {
        // Unquoted string
        args.push(match[3]);
      }
    }
    
    return args;
  }

  /**
   * Generate inline intercept code for a specific function call
   * @param {string} funcName - Internal function name (without __ prefix)
   * @param {string} interceptArgs - Arguments formatted with ||| separator
   * @returns {string} - Inline bash code for intercept
   */
  generateInlineInterceptCode(funcName, interceptArgs) {
    return `
# Inline intercept for __${funcName}
echo "YAMPP_INTERCEPT:${funcName}:${interceptArgs}" >&2

# Create response file path  
yampp_response_file="/tmp/yampp_response_$$"

# Wait for Yampp response (polling approach)
yampp_timeout=0
while [ ! -f "$yampp_response_file" ] && [ $yampp_timeout -lt 1000 ]; do
  sleep 0.01  # 10ms polling interval
  yampp_timeout=$((yampp_timeout + 1))
done

# Check if we got a response
if [ ! -f "$yampp_response_file" ]; then
  echo "Timeout waiting for Yampp response" >&2
  exit 1
fi

# Read exit code (first line)
yampp_exit_code=$(head -n1 "$yampp_response_file" 2>/dev/null || echo "1")

# Execute export commands (remaining lines) - INLINE SCOPE (same as script)
if [ -s "$yampp_response_file" ]; then
  yampp_temp_export="/tmp/yampp_exports_$$"
  tail -n +2 "$yampp_response_file" 2>/dev/null > "$yampp_temp_export"
  # Source the file directly to execute in main shell scope
  if [ -s "$yampp_temp_export" ]; then
    . "$yampp_temp_export"
  fi
  rm -f "$yampp_temp_export" 2>/dev/null
fi

# Clean up
rm -f "$yampp_response_file" 2>/dev/null

# Check exit code and fail if needed
if [ "$yampp_exit_code" != "0" ]; then
  exit $yampp_exit_code
fi
`.trim();
  }
}