import { PlatformStrategy } from './platform-strategy.js';
import { UnixStateManager } from '../state-sync/unix-state-manager.js';
import { ShellProxyManager } from '../shell-proxy/shell-proxy-manager.js';

/**
 * Linux platform detection strategy
 * Handles Linux/GNU systems and Unix-like aliases
 */
export class LinuxStrategy extends PlatformStrategy {
  constructor() {
    super('linux', ['unix', 'gnu', 'gnu/linux']);
  }

  isCurrentPlatform() {
    return process.platform === 'linux';
  }

  getPlatformInfo() {
    const info = super.getPlatformInfo();
    
    if (this.isCurrentPlatform()) {
      info.shell = process.env.SHELL || '/bin/bash';
      info.distribution = this.detectDistribution();
    }
    
    return info;
  }

  detectDistribution() {
    // Could implement distribution detection here in the future
    // e.g., read /etc/os-release, check for distro-specific files
    return 'unknown';
  }

  prepareShellCommand(command) {
    // Linux: Use bash/sh with strict mode (-e = exit on error)
    return {
      shell: 'sh',
      args: ['-e', '-c', command],
      processedCommand: command
    };
  }

  createStateManager() {
    return new UnixStateManager(this);
  }

  createShellProxyManager(registry) {
    return new ShellProxyManager(this, registry, this.getStateManager());
  }
}