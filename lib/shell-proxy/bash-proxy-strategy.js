import { ShellProxyStrategy } from './shell-proxy-strategy.js';

/**
 * Bash/sh shell proxy strategy
 * Generates bash function proxies for cooperative control
 */
export class BashProxyStrategy extends ShellProxyStrategy {
  generateProxyFunctions(functionNames) {
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
  
  # Read exit code (first line)
  local exit_code=\$(head -n1 "\$response_file" 2>/dev/null || echo "1")
  
  # Execute export commands (remaining lines) 
  # Use process substitution to avoid subshell variable scope issues
  if [ -s "\$response_file" ]; then
    while IFS= read -r cmd; do
      [ -n "\$cmd" ] && eval "\$cmd"
    done < <(tail -n +2 "\$response_file" 2>/dev/null)
  fi
  
  # Clean up
  rm -f "\$response_file" 2>/dev/null
  
  return \$exit_code
}`);
    }

    return proxies.join('\n');
  }

  injectProxies(command, proxyFunctions) {
    // Transform Yampp DSL syntax to bash syntax
    // Matches patterns like:
    //   __func(args)
    //   __func  (  args  )  
    //   __func taskname(args)
    //   __func    taskname   (   args   )
    //   __call print_index($i)
    let transformedCommand = command.replace(/__(\w+)((?:\s+\w+)?)\s*\(([^)]*)\)/g, (match, funcName, taskNameWithSpaces, args) => {
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
      args: ['-e', '-c', `${proxyFunctions}\n\n${transformedCommand}`],
      processedCommand: transformedCommand,
      hasProxies: true
    };
  }

  getResponseFilePath(processId) {
    return `/tmp/yampp_response_${processId}`;
  }

  generateExportCommands(variables) {
    const commands = [];
    for (const [name, value] of variables) {
      // Escape single quotes in the value for bash safety
      const escapedValue = String(value).replace(/'/g, "'\"'\"'");
      const exportCmd = `export ${name}='${escapedValue}'`;
      commands.push(exportCmd);
    }
    return commands.join('\n');
  }
}