import { BaseContentProcessor } from './base-content-processor.js';
import { ExecutionContext } from '../execution/types/execution-context.js';

/**
 * Bash/sh Shell Content Processor
 * Handles Bash-specific content processing including comment filtering and proxy injection
 */
export class BashContentProcessor extends BaseContentProcessor {
  
  /**
   * OPTIONAL: Remove bash-specific comments
   * Can optionally filter bash # comments in addition to Yampp comments
   */
  protected cleanShellComments(content: string): string {
    // Optional: uncomment to also filter bash # comments
    // content = content.replace(/^\s*#.*$/gm, '');
    
    // For now, preserve bash comments (they don't conflict with execution)
    return content;
  }

  /**
   * Generate Bash-specific code from pre-processed data
   */
  protected generateTargetCode(data: any): string {
    let generatedCode = '';
    
    // Generate variable assignments (task-level vars/consts from parser)
    for (const assignment of data.variableAssignments) {
      if (assignment.isInternalFunction) {
        // Transform internal function call to bash syntax
        // var x = __input "test" -> x=$(__input x "test")
        // Pass variable name as first parameter for proper value binding
        const funcCall = assignment.value.replace(/^__(\w+)/, `__$1 ${assignment.name}`);
        
        if (assignment.type === 'constant') {
          // const x = __input -> declare -r x=$(__input x ...)
          generatedCode += `declare -r ${assignment.name}=$(${funcCall})\n`;
        } else {
          // var x = __input -> x=$(__input x ...)
          generatedCode += `${assignment.name}=$(${funcCall})\n`;
        }
      } else {
        // Regular variable assignment
        if (assignment.type === 'constant') {
          // const x = "value" -> declare -r x="value"
          generatedCode += `declare -r ${assignment.name}=${assignment.value}\n`;
        } else {
          // var x = "value" -> x="value"
          generatedCode += `${assignment.name}=${assignment.value}\n`;
        }
      }
    }
    
    // Process standalone commands and transform inline variables
    if (data.standaloneCommands.length > 0) {
      const processedCommands = this.transformInlineVariables(data.standaloneCommands.join('\n'));
      generatedCode += processedCommands + '\n';
    }
    
    return generatedCode;
  }

  /**
   * Transform inline variable assignments to bash syntax
   * Preserves control flow by transforming in-place
   */
  private transformInlineVariables(content: string): string {
    // Pattern to match inline variables: var/const name = __function args
    const inlinePattern = /^(\s*)(var|const)\s+(\w+)\s*=\s*(__\w+.*?)$/gm;
    
    return content.replace(inlinePattern, (match, indent, type, varName, funcCall) => {
      // Check if this is an internal function
      const funcMatch = funcCall.match(/^(__\w+)(.*)$/);
      if (!funcMatch) return match;
      
      const [, funcName] = funcMatch;
      const funcNameWithoutPrefix = funcName.substring(2);
      
      // Verify it's a registered internal function
      const functionNames = this.functionRegistry.getRegisteredFunctions();
      if (!functionNames.includes(funcNameWithoutPrefix)) {
        return match; // Not an internal function, leave as-is
      }
      
      // Transform to bash syntax, preserving indentation
      // var x = __input "test" -> x=$(__input x "test")
      let transformedCall;
      if (funcCall.includes(' ') && funcNameWithoutPrefix.includes('_')) {
        // Plugin function: check if it returns values to determine if needs varName
        const functionMetadata = this.functionRegistry.getFunctionMetadata(funcNameWithoutPrefix);
        const hasReturnValue = functionMetadata?.hasReturnVariable();

        if (hasReturnValue) {
          // Plugin function with return value: add varName as first parameter
          transformedCall = funcCall.replace(/^(__\w+)/, `$1 ${varName}`);
        } else {
          // Plugin function without return value: no transformation needed
          transformedCall = funcCall;
        }
      } else {
        // Traditional internal function: __input "test"
        // Transform to: __input varName "test"
        transformedCall = funcCall.replace(/^__(\w+)/, `__$1 ${varName}`);
      }
      
      if (type === 'const') {
        return `${indent}declare -r ${varName}=$(${transformedCall})`;
      } else {
        return `${indent}${varName}=$(${transformedCall})`;
      }
    });
  }

  /**
   * Inject bash function definitions - simplified version
   */
  protected injectProxies(content: string): ExecutionContext {
    const functionsUsed = this.findInternalFunctionsUsed(content);
    const functionDefinitions = this.generateBashFunctions(functionsUsed);
    
    // Transform __assign calls to properly quote the value argument
    let transformedContent = content.replace(/^(\s*)__assign\s+(var|const)\s+(\w+)\s+(.+)$/gm, (match, indent, type, varName, value) => {
      // Wrap the value in single quotes to ensure it's treated as a single argument
      const quotedValue = `'${value.trim()}'`;
      return `${indent}__assign ${type} ${varName} ${quotedValue}`;
    });
    
    // Transform __func calls that are NOT variable assignments (like __call)
    transformedContent = transformedContent.replace(/__(\w+)((?:\s+\w+)?)\s*\(([^)]*)\)/g, (match, funcName, taskNameWithSpaces, args) => {
      // Skip if this is already processed as a variable assignment (contains $(...))
      if (match.includes('$(')) {
        return match;
      }
      
      const taskName = taskNameWithSpaces.trim();
      const cleanArgs = args.trim();
      
      let bashCall = `__${funcName}`;
      if (taskName) {
        bashCall += ` "${taskName}"`;
        if (cleanArgs) {
          const parsedArgs = this.parseArgsRespectingQuotes(cleanArgs);
          for (const arg of parsedArgs) {
            if (arg.startsWith('$')) {
              bashCall += ` ${arg}`;
            } else {
              bashCall += ` "${arg}"`;
            }
          }
        }
      } else if (cleanArgs) {
        const parsedArgs = this.parseArgsRespectingQuotes(cleanArgs);
        for (const arg of parsedArgs) {
          if (arg.startsWith('$')) {
            bashCall += ` ${arg}`;
          } else {
            bashCall += ` "${arg}"`;
          }
        }
      }
      
      return bashCall;
    });
    
    const finalContent = functionsUsed.length > 0 
      ? `${functionDefinitions}\n\n${transformedContent}`
      : transformedContent;
    
    return {
      shell: 'bash', 
      args: ['-e', '-c', finalContent],
      hasProxies: functionsUsed.length > 0,
      content: transformedContent
    };
  }

  private findInternalFunctionsUsed(content: string): string[] {
    const functions = new Set<string>();
    const functionNames = this.functionRegistry.getRegisteredFunctions();

    // Find all registered functions (internal + plugins)
    for (const funcName of functionNames) {
      if (content.includes(`__${funcName}`)) {
        functions.add(funcName);
      }
    }

    return Array.from(functions);
  }

  private generateBashFunctions(functionNames: string[]): string {
    const functions: string[] = [];

    for (const funcName of functionNames) {
      if (funcName === 'assign') {
        // Special handling for __assign - generate native bash assignment
        functions.push(`
__assign() {
  local type="$1"
  local name="$2"
  local value="$3"

  # Ensure proper quoting by escaping any embedded quotes in the value
  local escaped_value=$(printf '%s' "$value" | sed 's/"/\\"/g')

  if [ "$type" = "const" ]; then
    # const assignment - use eval for dynamic variable name with readonly
    eval "$name=\"$escaped_value\""
    eval "readonly $name"
  else
    # regular variable assignment - use eval for dynamic variable name
    eval "$name=\"$escaped_value\""
  fi
}`);
      } else {
        // Standard proxy function for other internal functions
        functions.push(`
__${funcName}() {
  # Join arguments with ||| separator for proper parsing
  local args=""
  for arg in "$@"; do
    if [ -n "$args" ]; then
      args="$args|||$arg"
    else
      args="$arg"
    fi
  done
  echo "YAMPP_INTERCEPT:${funcName}:$args" >&2
  yampp_response_file="/tmp/yampp_response_$$"
  timeout=0
  while [ ! -f "$yampp_response_file" ] && [ $timeout -lt 1000 ]; do
    sleep 0.01 2>/dev/null || sleep 1
    timeout=$((timeout + 1))
  done
  if [ ! -f "$yampp_response_file" ]; then
    echo "Timeout waiting for Yampp response" >&2
    return 1
  fi
  exit_code=$(head -n 1 "$yampp_response_file")

  # Check if there's a return value (second line)
  if [ $(wc -l < "$yampp_response_file") -gt 1 ]; then
    # Second line is the return value - output it to stdout for capture
    sed -n '2p' "$yampp_response_file"

    # Remaining lines are export commands
    if [ $(wc -l < "$yampp_response_file") -gt 2 ]; then
      tail -n +3 "$yampp_response_file" > "/tmp/yampp_exports_$$"
      . "/tmp/yampp_exports_$$"
      rm "/tmp/yampp_exports_$$" 2>/dev/null
    fi
  fi

  rm "$yampp_response_file" 2>/dev/null
  return $exit_code
}`);
      }
    }

    return functions.join('\n');
  }

  private parseArgsRespectingQuotes(argsString: string): string[] {
    const args: string[] = [];
    
    // First split by comma, then handle quotes within each argument
    const parts = argsString.split(',');
    
    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed) {
        args.push(trimmed);
      }
    }
    
    return args;
  }
}