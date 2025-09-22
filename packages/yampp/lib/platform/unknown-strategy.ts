import { PlatformStrategy } from './platform-strategy.js';
import { ShellCommand } from '../shell/interfaces/shell-command.interface.js';
import { UnknownPlatformInfo } from './interfaces/unknown-platform-info.interface.js';
import { SharedStateManager } from '../state-sync/shared-state-manager.js';
import { InternalFunctionRegistry } from '../internal-functions/registry.js';
import { ShellProxyManager } from '../shell-proxy/shell-proxy-manager.js';
import { UnixStateManager } from '../state-sync/unix-state-manager.js';

/**
 * Fallback strategy for unknown platforms
 * Provides basic functionality when no specific platform strategy matches
 */
export class UnknownStrategy extends PlatformStrategy {
  constructor(platformName: string) {
    super(platformName, []);
  }

  public isCurrentPlatform(): boolean {
    return true; // This is only created for the current unknown platform
  }

  public getPlatformInfo(): UnknownPlatformInfo {
    return {
      name: this.name,
      aliases: this.aliases,
      unknown: true,
      shell: process.env.SHELL || 'sh'
    };
  }

  public prepareShellCommand(command: string): ShellCommand {
    // Use basic shell execution for unknown platforms
    return {
      shell: 'sh',
      args: ['-c', command],
      processedCommand: command
    };
  }

  public createStateManager(): SharedStateManager {
    // Fallback to Unix-style state manager
    return new UnixStateManager(this);
  }

  public createShellProxyManager(registry: InternalFunctionRegistry): ShellProxyManager {
    return new ShellProxyManager(this, registry, this.getStateManager());
  }
}