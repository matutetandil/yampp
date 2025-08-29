import { PlatformStrategy } from './platform-strategy.js';
import { WindowsStateManager } from '../state-sync/windows-state-manager.js';
import { ShellProxyManager } from '../shell-proxy/shell-proxy-manager.js';

/**
 * Windows platform detection strategy
 * Handles Windows systems and related aliases
 */
export class WindowsStrategy extends PlatformStrategy {
  constructor() {
    super('windows', ['win', 'win32', 'win64']);
  }

  isCurrentPlatform() {
    return process.platform === 'win32';
  }

  getPlatformInfo() {
    const info = super.getPlatformInfo();
    
    if (this.isCurrentPlatform()) {
      info.shell = process.env.ComSpec || 'cmd.exe';
      info.powershell = this.detectPowerShell();
    }
    
    return info;
  }

  detectPowerShell() {
    // Could implement PowerShell detection here in the future
    // e.g., check for pwsh, powershell.exe availability
    return 'powershell.exe';
  }

  prepareShellCommand(command) {
    // Windows: Auto-detect PowerShell vs CMD and use appropriate strict mode
    if (this.isPowerShellCommand(command)) {
      return {
        shell: 'powershell.exe',
        args: ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', `$ErrorActionPreference = "Stop"; ${command}`],
        processedCommand: command
      };
    } else {
      // CMD with basic error handling (cmd doesn't have equivalent to set -e)
      return {
        shell: 'cmd.exe',
        args: ['/C', command],
        processedCommand: command
      };
    }
  }

  isPowerShellCommand(command) {
    // Heuristic to detect PowerShell commands
    const powerShellIndicators = [
      'Write-Host',
      'Get-',
      'Set-',
      'New-',
      'Remove-',
      '$env:',
      'foreach',
      'ForEach-Object',
      'Invoke-',
      'Test-',
      '-eq',
      '-ne',
      '-like',
      '-match'
    ];
    
    const lowerCommand = command.toLowerCase();
    return powerShellIndicators.some(indicator => 
      lowerCommand.includes(indicator.toLowerCase())
    );
  }

  detectInternalFunction(stderr) {
    // Windows-specific error parsing might be needed
    // For now, use generic detection
    return super.detectInternalFunction(stderr);
  }

  createStateManager() {
    return new WindowsStateManager(this);
  }

  createShellProxyManager(registry) {
    return new ShellProxyManager(this, registry, this.getStateManager());
  }
}