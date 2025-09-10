import { ShellProxyStrategy } from './shell-proxy-strategy.js';

/**
 * PowerShell proxy strategy
 * Generates PowerShell function proxies for cooperative control  
 */
export class PowerShellProxyStrategy extends ShellProxyStrategy {
  public generateProxyFunctions(functionNames: string[]): string {
    const proxies: string[] = [];

    for (const funcName of functionNames) {
      const proxy = [
        'function __' + funcName + ' {',
        '  param([Parameter(ValueFromRemainingArguments)]$Args)',
        '  ',
        '  # Convert args to string for transmission',
        '  $argsString = if ($Args) { $Args -join \':\' } else { \'\' }',
        '  ',
        '  # Send intercept message to Yampp via stderr',
        '  Write-Error "YAMPP_INTERCEPT:' + funcName + ':$argsString" -ErrorAction Continue',
        '  ',
        '  # Create response file path',
        '  $responseFile = "$env:TEMP\\yampp_response_$PID.tmp"',
        '  ',
        '  # Wait for Yampp response (polling approach)',
        '  $timeout = 0',
        '  while (!(Test-Path $responseFile) -and $timeout -lt 1000) {',
        '    Start-Sleep -Milliseconds 10',
        '    $timeout++',
        '  }',
        '  ',
        '  # Check if we got a response',
        '  if (!(Test-Path $responseFile)) {',
        '    Write-Error "Timeout waiting for Yampp response"',
        '    throw "Internal function timeout"',
        '  }',
        '  ',
        '  # Read response and clean up',
        '  try {',
        '    $response = Get-Content $responseFile -Raw -ErrorAction Stop',
        '    $lines = $response -split "`n"',
        '    $exitCode = $lines[0].Trim()',
        '    ',
        '    # Execute export commands (remaining lines)',
        '    for ($i = 1; $i -lt $lines.Length; $i++) {',
        '      $cmd = $lines[$i].Trim()',
        '      if ($cmd -ne \'\') {',
        '        Invoke-Expression $cmd',
        '      }',
        '    }',
        '    ',
        '    Remove-Item $responseFile -Force -ErrorAction SilentlyContinue',
        '    ',
        '    if ($exitCode -ne "0") {',
        '      throw "Internal function failed with code $exitCode"',
        '    }',
        '  } catch {',
        '    Remove-Item $responseFile -Force -ErrorAction SilentlyContinue',
        '    throw "Failed to read Yampp response: $_"',
        '  }',
        '}'
      ].join('\n');
      
      proxies.push(proxy);
    }

    return proxies.join('\n');
  }

  public injectProxies(command: string, proxyFunctions: string): any {
    return {
      shell: 'powershell.exe',
      args: ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', 
             '$ErrorActionPreference = "Stop"; ' + proxyFunctions + '; ' + command],
      processedCommand: command,
      hasProxies: true
    };
  }

  public getResponseFilePath(processId: number): string {
    const tempDir = process.env.TEMP || process.env.TMP || '/tmp';
    return `${tempDir}\\yampp_response_${processId}`;
  }

  public generateExportCommands(variables: Map<string, string>): string {
    const commands: string[] = [];
    for (const [name, value] of variables) {
      // Escape single quotes for PowerShell safety
      const escapedValue = String(value).replace(/'/g, "''");
      commands.push(`$env:${name}='${escapedValue}'`);
    }
    return commands.join('\n');
  }
}