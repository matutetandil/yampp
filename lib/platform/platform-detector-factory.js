import { PlatformStrategy } from './platform-strategy.js';
import { LinuxStrategy } from './linux-strategy.js';
import { MacStrategy } from './mac-strategy.js';
import { WindowsStrategy } from './windows-strategy.js';
import { UnknownStrategy } from './unknown-strategy.js';

/**
 * Platform Detector Factory
 * Creates and manages platform detection strategies using Strategy + Factory pattern
 */
export class PlatformDetectorFactory {
  constructor() {
    this.strategies = new Map();
    this.currentPlatform = null;
    
    // Register default strategies
    this.registerDefaultStrategies();
    
    // Detect current platform once
    this.detectCurrentPlatform();
  }

  /**
   * Register default platform strategies
   */
  registerDefaultStrategies() {
    this.registerStrategy(new LinuxStrategy());
    this.registerStrategy(new MacStrategy());
    this.registerStrategy(new WindowsStrategy());
  }

  /**
   * Register a new platform strategy
   * @param {PlatformStrategy} strategy
   */
  registerStrategy(strategy) {
    if (!(strategy instanceof PlatformStrategy)) {
      throw new Error('Strategy must extend PlatformStrategy');
    }
    this.strategies.set(strategy.name, strategy);
  }

  /**
   * Detect the current platform
   */
  detectCurrentPlatform() {
    for (const strategy of this.strategies.values()) {
      if (strategy.isCurrentPlatform()) {
        this.currentPlatform = strategy;
        return;
      }
    }

    // Fallback for unknown platforms
    if (!this.currentPlatform) {
      this.currentPlatform = new UnknownStrategy(process.platform);
    }
  }

  /**
   * Get current platform name
   * @returns {string}
   */
  getCurrentPlatform() {
    return this.currentPlatform.name;
  }

  /**
   * Check if current platform matches given platform list
   * @param {string[]} platformList - List of platform names to match
   * @returns {boolean}
   */
  platformMatches(platformList) {
    if (!platformList || platformList.length === 0) {
      return false;
    }

    // Check if current platform matches any in the list
    for (const platformName of platformList) {
      if (this.currentPlatform.matches(platformName)) {
        return true;
      }

      // Also check other strategies for cross-platform aliases
      // e.g., 'unix' should match both linux and mac
      for (const strategy of this.strategies.values()) {
        if (strategy.matches(platformName) && 
            this.shouldIncludePlatform(strategy.name, this.currentPlatform.name)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Helper to determine if a platform should be included
   * @param {string} targetPlatform
   * @param {string} currentPlatform  
   * @returns {boolean}
   */
  shouldIncludePlatform(targetPlatform, currentPlatform) {
    // Special case: 'unix' includes both linux and mac
    if (targetPlatform === 'unix') {
      return currentPlatform === 'linux' || currentPlatform === 'mac';
    }
    
    return targetPlatform === currentPlatform;
  }

  /**
   * Get detailed information about current platform
   * @returns {Object}
   */
  getCurrentPlatformInfo() {
    return this.currentPlatform.getPlatformInfo();
  }

  /**
   * Get all registered platform strategies
   * @returns {Map}
   */
  getAllStrategies() {
    return new Map(this.strategies);
  }
}