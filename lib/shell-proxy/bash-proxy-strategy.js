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
  
  # Read response and clean up
  local exit_code=\$(cat "\$response_file" 2>/dev/null || echo "1")
  rm -f "\$response_file" 2>/dev/null
  
  return \$exit_code
}`);
    }

    return proxies.join('\n');
  }

  injectProxies(command, proxyFunctions) {
    return {
      shell: 'sh',
      args: ['-e', '-c', `${proxyFunctions}\n\n${command}`],
      processedCommand: command,
      hasProxies: true
    };
  }

  getResponseFilePath(processId) {
    return `/tmp/yampp_response_${processId}`;
  }
}