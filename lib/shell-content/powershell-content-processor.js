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
   * Inject inline intercept code and transform syntax  
   * Replaces each __func call with inline intercept code (no functions, same scope)
   * @param {string} content - Processed content ready for execution
   * @returns {Object} - PowerShell execution context
   */
  injectProxies(content) {
    // Transform Yampp DSL syntax and replace with inline intercept code
    // Handles patterns like:
    //   __func(args) -> inline intercept code
    //   __func  (  args  ) -> inline intercept code  
    //   __func taskname(args) -> inline intercept code for taskname
    //   __call    task   (   args   ) -> inline intercept code for call
    let transformedContent = content.replace(/__(\\w+)((?:\\s+\\w+)?)\\s*\\(([^)]*)\\)/g, (match, funcName, taskNameWithSpaces, args) => {
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
    transformedContent = transformedContent.replace(/__(\\w+)\\s+(.+)/g, (match, funcName, argsString) => {
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
      shell: 'powershell',
      args: ['-Command', transformedContent],
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
    const regex = /"([^"]*)"|'([^']*)'|(\\S+)/g;
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
   * @returns {string} - Inline PowerShell code for intercept
   */
  generateInlineInterceptCode(funcName, interceptArgs) {
    return `
# Inline intercept for __${funcName}
Write-Error "YAMPP_INTERCEPT:${funcName}:${interceptArgs}" -ErrorAction Continue

# Create response file path  
$yampp_response_file = "$env:TEMP\\yampp_response_$PID"

# Wait for Yampp response (polling approach)
$yampp_timeout = 0
while (!(Test-Path $yampp_response_file) -and ($yampp_timeout -lt 1000)) {
  Start-Sleep -Milliseconds 10
  $yampp_timeout++
}

# Check if we got a response
if (!(Test-Path $yampp_response_file)) {
  Write-Error "Timeout waiting for Yampp response"
  exit 1
}

# Read exit code (first line)
try {
  $yampp_lines = Get-Content $yampp_response_file -ErrorAction Stop
  $yampp_exit_code = [int]$yampp_lines[0]
  
  # Execute export commands (remaining lines) - INLINE SCOPE (same as script)
  if ($yampp_lines.Length -gt 1) {
    for ($i = 1; $i -lt $yampp_lines.Length; $i++) {
      if ($yampp_lines[$i]) {
        Invoke-Expression $yampp_lines[$i]  # Executes in main script scope!
      }
    }
  }
  
  # Clean up
  Remove-Item $yampp_response_file -ErrorAction SilentlyContinue
  
  # Check exit code and fail if needed
  if ($yampp_exit_code -ne 0) {
    exit $yampp_exit_code
  }
} catch {
  Remove-Item $yampp_response_file -ErrorAction SilentlyContinue
  exit 1
}`.trim();
  }
}