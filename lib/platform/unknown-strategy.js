import { PlatformStrategy } from './platform-strategy.js';

/**
 * Fallback strategy for unknown platforms
 * Provides basic functionality when no specific platform strategy matches
 */
export class UnknownStrategy extends PlatformStrategy {
  constructor(platformName) {
    super(platformName, []);
  }

  isCurrentPlatform() {
    return true; // This is only created for the current unknown platform
  }

  getPlatformInfo() {
    return {
      name: this.name,
      aliases: this.aliases,
      unknown: true,
      shell: process.env.SHELL || 'sh'
    };
  }
}