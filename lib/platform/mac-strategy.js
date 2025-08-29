import { PlatformStrategy } from './platform-strategy.js';
import { UnixStateManager } from '../state-sync/unix-state-manager.js';
import { ShellProxyManager } from '../shell-proxy/shell-proxy-manager.js';

/**
 * macOS platform detection strategy  
 * Handles Darwin/macOS systems and related aliases
 */
export class MacStrategy extends PlatformStrategy {
  constructor() {
    super('mac', ['darwin', 'osx', 'macos', 'unix']);
  }

  isCurrentPlatform() {
    return process.platform === 'darwin';
  }

  getPlatformInfo() {
    const info = super.getPlatformInfo();
    
    if (this.isCurrentPlatform()) {
      info.shell = process.env.SHELL || '/bin/zsh';
      info.version = this.detectMacVersion();
    }
    
    return info;
  }

  detectMacVersion() {
    // Could implement macOS version detection here in the future
    // e.g., read system_profiler, sw_vers command
    return 'unknown';
  }

  prepareShellCommand(command) {
    // macOS: Use zsh/bash with strict mode (-e = exit on error)
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