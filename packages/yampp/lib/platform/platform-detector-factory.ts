import { PlatformStrategy } from './platform-strategy.js';
import { LinuxStrategy } from './linux-strategy.js';
import { MacStrategy } from './mac-strategy.js';
import { WindowsStrategy } from './windows-strategy.js';
import { UnknownStrategy } from './unknown-strategy.js';
import { Platforms } from '../core/constants/platforms.constants.js';

/**
 * Platform Detector Factory
 * Creates and manages platform detection strategies using Strategy + Factory pattern
 */
export class PlatformDetectorFactory {
  private readonly strategies: Map<string, PlatformStrategy>;
  private currentPlatform: PlatformStrategy | null;

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
  private registerDefaultStrategies(): void {
    this.registerStrategy(new LinuxStrategy());
    this.registerStrategy(new MacStrategy());
    this.registerStrategy(new WindowsStrategy());
  }

  /**
   * Register a new platform strategy
   */
  public registerStrategy(strategy: PlatformStrategy): void {
    if (!(strategy instanceof PlatformStrategy)) {
      throw new Error('Strategy must extend PlatformStrategy');
    }
    this.strategies.set(strategy.name, strategy);
  }

  /**
   * Detect the current platform
   */
  private detectCurrentPlatform(): void {
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
   */
  public getCurrentPlatform(): string {
    return this.currentPlatform!.name;
  }

  /**
   * Check if current platform matches given platform list
   */
  public platformMatches(platformList: string[]): boolean {
    if (!platformList || platformList.length === 0) {
      return false;
    }

    // Check if current platform matches any in the list
    for (const platformName of platformList) {
      if (this.currentPlatform!.matches(platformName)) {
        return true;
      }

      // Also check other strategies for cross-platform aliases
      // e.g., 'unix' should match both linux and mac
      for (const strategy of this.strategies.values()) {
        if (strategy.matches(platformName) && 
            this.shouldIncludePlatform(strategy.name, this.currentPlatform!.name)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Helper to determine if a platform should be included
   */
  private shouldIncludePlatform(targetPlatform: string, currentPlatform: string): boolean {
    // Special case: 'unix' includes both linux and mac
    if (targetPlatform === 'unix') {
      return currentPlatform === Platforms.LINUX || currentPlatform === Platforms.MAC;
    }
    
    return targetPlatform === currentPlatform;
  }

  /**
   * Get detailed information about current platform
   */
  public getCurrentPlatformInfo(): any {
    return this.currentPlatform!.getPlatformInfo();
  }

  /**
   * Get all registered platform strategies
   */
  public getAllStrategies(): Map<string, PlatformStrategy> {
    return new Map(this.strategies);
  }

  /**
   * Get the current platform strategy
   */
  public getCurrentPlatformStrategy(): PlatformStrategy {
    return this.currentPlatform!;
  }

  /**
   * Force detect and return current platform
   */
  public detect(): PlatformStrategy {
    this.detectCurrentPlatform();
    return this.currentPlatform!;
  }
}