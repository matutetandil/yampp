import { PlatformStrategy } from './platform-strategy.js';
import { ShellCommand } from '../shell/interfaces/shell-command.interface.js';
import { MacPlatformInfo } from '../platform/interfaces/mac-platform-info.interface.js';
import { UnixStateManager } from '../state-sync/unix-state-manager.js';
import { ShellProxyManager } from '../shell-proxy/shell-proxy-manager.js';
import { SharedStateManager } from '../state-sync/shared-state-manager.js';
import { InternalFunctionRegistry } from '../internal-functions/registry.js';
import { Platforms } from '../core/constants/platforms.constants.js';

/**
 * macOS platform detection strategy  
 * Handles Darwin/macOS systems and related aliases
 */
export class MacStrategy extends PlatformStrategy {
  constructor() {
    super(Platforms.MAC, ['darwin', 'osx', 'macos', 'unix']);
  }

  public isCurrentPlatform(): boolean {
    return process.platform === 'darwin';
  }

  public getPlatformInfo(): MacPlatformInfo {
    const info = super.getPlatformInfo() as MacPlatformInfo;
    
    if (this.isCurrentPlatform()) {
      info.shell = process.env.SHELL || '/bin/zsh';
      info.version = this.detectMacVersion();
    }
    
    return info;
  }

  private detectMacVersion(): string {
    // Could implement macOS version detection here in the future
    // e.g., read system_profiler, sw_vers command
    return 'unknown';
  }

  public prepareShellCommand(command: string): ShellCommand {
    // macOS: Use zsh/bash with strict mode (-e = exit on error)
    return {
      shell: 'sh',
      args: ['-e', '-c', command],
      processedCommand: command
    };
  }

  public createStateManager(): SharedStateManager {
    return new UnixStateManager(this);
  }

  public createShellProxyManager(registry: InternalFunctionRegistry): ShellProxyManager {
    return new ShellProxyManager(this, registry, this.getStateManager());
  }
}