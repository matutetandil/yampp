import { SharedStateManager } from './shared-state-manager.js';
import { PlatformStrategy } from '../platform/platform-strategy.js';
import { WindowsStrategy } from '../platform/windows-strategy.js';
import { spawn } from 'child_process';

/**
 * Windows state manager for PowerShell/CMD
 * Handles variable synchronization with Windows shell environments
 */
export class WindowsStateManager extends SharedStateManager {
  private isUsingPowerShell: boolean;

  constructor(platformStrategy: PlatformStrategy) {
    super(platformStrategy);
    this.isUsingPowerShell = false;
  }

  public async captureShellContext(command: string, workingDirectory: string = process.cwd()): Promise<Map<string, any>> {
    // Determine if we're using PowerShell or CMD
    const windowsStrategy = this.platformStrategy as WindowsStrategy;
    this.isUsingPowerShell = windowsStrategy.isPowerShellCommand ? windowsStrategy.isPowerShellCommand(command) : false;
    
    return new Promise((resolve) => {
      let captureCommand: string;
      let shell: string;
      let args: string[];

      if (this.isUsingPowerShell) {
        // PowerShell: Get all variables
        captureCommand = 'Get-Variable | ForEach-Object { "$($_.Name)=$($_.Value)" }; echo "---ENV-VARS---"; Get-ChildItem Env: | ForEach-Object { "$($_.Name)=$($_.Value)" }';
        shell = 'powershell.exe';
        args = ['-NoProfile', '-Command', captureCommand];
      } else {
        // CMD: Get environment variables
        captureCommand = 'set';
        shell = 'cmd.exe';
        args = ['/C', captureCommand];
      }

      const child = spawn(shell, args, {
        cwd: workingDirectory,
        env: { ...process.env },
        stdio: ['ignore', 'pipe', 'pipe']
      });

      let output = '';
      
      child.stdout.on('data', (data) => {
        output += data.toString();
      });

      child.on('close', () => {
        const variables = this.parseShellOutput(output);
        this.shellContext.clear();
        for (const [key, value] of variables) {
          this.shellContext.set(key, value);
        }
        resolve(variables);
      });

      child.on('error', () => {
        // Fallback to process.env
        const envVars = new Map(Object.entries(process.env as Record<string, string>));
        this.shellContext.clear();
        for (const [key, value] of envVars) {
          this.shellContext.set(key, value);
        }
        resolve(envVars);
      });
    });
  }

  public extractContextFromError(command: string, stderr: string): Map<string, any> {
    const variables = new Map<string, any>();

    if (this.isUsingPowerShell) {
      // PowerShell foreach loops: foreach ($var in $collection)
      const foreachMatch = command.match(/foreach\s*\(\s*\$(\w+)\s+in\s+([^)]+)\)/);
      if (foreachMatch && foreachMatch[1]) {
        const loopVar = foreachMatch[1];
        // Simple heuristic for first value
        variables.set(loopVar, '1'); // PowerShell loops often use numeric ranges
      }

      // PowerShell variable assignments: $var = value
      const varMatches = command.matchAll(/\$(\w+)\s*=\s*['"]?([^'"\s]+)['"]?/g);
      for (const match of varMatches) {
        if (match[1] && match[2]) {
          variables.set(match[1], match[2]);
        }
      }
    } else {
      // CMD for loops: for %var in (list) do
      const forMatch = command.match(/for\s+%(\w+)\s+in\s+\(([^)]+)\)/);
      if (forMatch && forMatch[1] && forMatch[2]) {
        const loopVar = forMatch[1];
        const values = forMatch[2].split(/\s+/);
        if (values.length > 0) {
          variables.set(loopVar, values[0] || '');
        }
      }

      // CMD variable assignments: set var=value
      const setMatches = command.matchAll(/set\s+(\w+)=([^\s&|]+)/g);
      for (const match of setMatches) {
        if (match[1] && match[2]) {
          variables.set(match[1], match[2]);
        }
      }
    }

    return variables;
  }

  private parseShellOutput(output: string): Map<string, any> {
    const variables = new Map<string, any>();
    const lines = output.split('\n');
    let inEnvVars = false;

    for (const line of lines) {
      if (line.trim() === '---ENV-VARS---') {
        inEnvVars = true;
        continue;
      }

      const trimmed = line.trim();
      if (!trimmed) continue;

      // Parse variable assignments (works for both PowerShell and CMD)
      const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      if (match && match[1] && match[2]) {
        const [, name, value] = match;
        
        // Clean up quoted values
        let cleanValue = value;
        if (value?.startsWith('"') && value?.endsWith('"')) {
          cleanValue = value.slice(1, -1);
        } else if (value?.startsWith("'") && value?.endsWith("'")) {
          cleanValue = value.slice(1, -1);
        }
        
        variables.set(name, cleanValue || '');
      }
    }

    return variables;
  }

  public generateExportCommands(): string {
    if (this.pendingExports.size === 0) {
      return '';
    }

    const commands: string[] = [];
    for (const [name, value] of this.pendingExports) {
      if (this.isUsingPowerShell) {
        // PowerShell variable assignment
        const escapedValue = this.escapePowerShellValue(value);
        commands.push(`$env:${name} = "${escapedValue}"`);
      } else {
        // CMD variable assignment
        const escapedValue = this.escapeCmdValue(value);
        commands.push(`set ${name}=${escapedValue}`);
      }
    }

    // Clear pending exports after generating commands
    this.pendingExports.clear();
    
    return commands.join(this.isUsingPowerShell ? '; ' : ' & ');
  }

  private escapePowerShellValue(value: any): string {
    let stringValue: string;
    if (typeof value !== 'string') {
      stringValue = String(value);
    } else {
      stringValue = value;
    }
    
    // Escape PowerShell special characters
    return stringValue.replace(/["`$]/g, '`$&');
  }

  private escapeCmdValue(value: any): string {
    let stringValue: string;
    if (typeof value !== 'string') {
      stringValue = String(value);
    } else {
      stringValue = value;
    }
    
    // Escape CMD special characters
    return stringValue.replace(/[&|<>^%]/g, '^$&');
  }
}