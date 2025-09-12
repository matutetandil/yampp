import { PlatformStrategy } from './platform-strategy.js';
import { ShellCommand } from '../shell/interfaces/shell-command.interface.js';
import { WindowsPlatformInfo } from './interfaces/windows-platform-info.interface.js';
import { WindowsStateManager } from '../state-sync/windows-state-manager.js';
import { ShellProxyManager } from '../shell-proxy/shell-proxy-manager.js';
import { SharedStateManager } from '../state-sync/shared-state-manager.js';
import { InternalFunctionRegistry } from '../internal-functions/registry.js';
import { Platforms } from '../core/constants/platforms.constants.js';

/**
 * Windows platform detection strategy
 * Handles Windows systems and related aliases
 */
export class WindowsStrategy extends PlatformStrategy {
  constructor() {
    super(Platforms.WINDOWS, ['win', 'win32', 'win64']);
  }

  public isCurrentPlatform(): boolean {
    return process.platform === 'win32';
  }

  public getPlatformInfo(): WindowsPlatformInfo {
    const info = super.getPlatformInfo() as WindowsPlatformInfo;
    
    if (this.isCurrentPlatform()) {
      info.powershellVersion = this.detectPowerShell();
      info.windowsVersion = this.detectWindowsVersion();
    }
    
    return info;
  }

  private detectPowerShell(): string {
    // Could implement PowerShell detection here in the future
    // e.g., check for pwsh, powershell.exe availability
    return 'powershell.exe';
  }

  private detectWindowsVersion(): string {
    // Could implement Windows version detection here in the future
    return 'unknown';
  }

  public prepareShellCommand(command: string): ShellCommand {
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

  public isPowerShellCommand(command: string): boolean {
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

  public detectInternalFunction(stderr: string): string | null {
    // Windows-specific error parsing might be needed
    // For now, use generic detection
    return super.detectInternalFunction(stderr);
  }

  public createStateManager(): SharedStateManager {
    return new WindowsStateManager(this);
  }

  public createShellProxyManager(registry: InternalFunctionRegistry): ShellProxyManager {
    return new ShellProxyManager(this, registry, this.getStateManager());
  }
}