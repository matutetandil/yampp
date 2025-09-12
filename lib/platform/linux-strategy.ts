import { PlatformStrategy } from './platform-strategy.js';
import { ShellCommand } from '../shell/interfaces/shell-command.interface.js';
import { LinuxPlatformInfo } from './interfaces/linux-platform-info.interface.js';
import { UnixStateManager } from '../state-sync/unix-state-manager.js';
import { ShellProxyManager } from '../shell-proxy/shell-proxy-manager.js';
import { SharedStateManager } from '../state-sync/shared-state-manager.js';
import { InternalFunctionRegistry } from '../internal-functions/registry.js';
import { Platforms } from '../core/constants/platforms.constants.js';

/**
 * Linux platform detection strategy
 * Handles Linux/GNU systems and Unix-like aliases
 */
export class LinuxStrategy extends PlatformStrategy {
  constructor() {
    super(Platforms.LINUX, ['unix', 'gnu', 'gnu/linux']);
  }

  public isCurrentPlatform(): boolean {
    return process.platform === 'linux';
  }

  public override getPlatformInfo(): LinuxPlatformInfo {
    const info = super.getPlatformInfo() as LinuxPlatformInfo;
    
    if (this.isCurrentPlatform()) {
      info.shell = process.env.SHELL || '/bin/bash';
      info.distribution = this.detectDistribution();
    }
    
    return info;
  }

  private detectDistribution(): string {
    // Could implement distribution detection here in the future
    // e.g., read /etc/os-release, check for distro-specific files
    return 'unknown';
  }

  public prepareShellCommand(command: string): ShellCommand {
    // Linux: Use bash/sh with strict mode (-e = exit on error)
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