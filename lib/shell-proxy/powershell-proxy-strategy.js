import { ShellProxyStrategy } from './shell-proxy-strategy.js';

/**
 * PowerShell proxy strategy
 * Generates PowerShell function proxies for cooperative control  
 */
export class PowerShellProxyStrategy extends ShellProxyStrategy {
  generateProxyFunctions(functionNames) {
    const proxies = [];

    for (const funcName of functionNames) {
      proxies.push(`
function __${funcName} {
  param([Parameter(ValueFromRemainingArguments)]\$Args)
  
  # Convert args to string for transmission
  \$argsString = if (\$Args) { \$Args -join ':' } else { '' }
  
  # Send intercept message to Yampp via stderr
  Write-Error "YAMPP_INTERCEPT:${funcName}:\$argsString" -ErrorAction Continue
  
  # Create response file path
  \$responseFile = "\$env:TEMP\\yampp_response_\$PID.tmp"
  
  # Wait for Yampp response (polling approach)
  \$timeout = 0
  while (!(Test-Path \$responseFile) -and \$timeout -lt 1000) {
    Start-Sleep -Milliseconds 10
    \$timeout++
  }
  
  # Check if we got a response
  if (!(Test-Path \$responseFile)) {
    Write-Error "Timeout waiting for Yampp response"
    throw "Internal function timeout"
  }
  
  # Read response and clean up
  try {
    \$exitCode = Get-Content \$responseFile -Raw -ErrorAction Stop
    Remove-Item \$responseFile -Force -ErrorAction SilentlyContinue
    
    if (\$exitCode.Trim() -ne "0") {
      throw "Internal function failed with code \$exitCode"
    }
  } catch {
    Remove-Item \$responseFile -Force -ErrorAction SilentlyContinue
    throw "Failed to read Yampp response: \$_"
  }
}`);
    }

    return proxies.join('\n');
  }

  injectProxies(command, proxyFunctions) {
    return {
      shell: 'powershell.exe',
      args: ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', 
             `$ErrorActionPreference = "Stop"; ${proxyFunctions}; ${command}`],
      processedCommand: command,
      hasProxies: true
    };
  }

  getResponseFilePath(processId) {
    const tempDir = process.env.TEMP || process.env.TMP || '/tmp';
    return `${tempDir}/yampp_response_${processId}.tmp`;
  }
}