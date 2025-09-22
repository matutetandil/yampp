import { PlatformStrategy } from '../types/platform-strategy.js';

/**
 * Interface for platform detection functionality
 * Abstracts platform detection for better testability and DIP compliance
 */
export interface IPlatformDetector {
  /**
   * Get the current platform strategy
   */
  getCurrentPlatformStrategy(): PlatformStrategy;

  /**
   * Detect the current platform name
   */
  detectPlatform(): string;

  /**
   * Check if a platform is supported
   */
  isPlatformSupported(platform: string): boolean;

  /**
   * Register a custom platform strategy
   */
  registerStrategy(platform: string, strategy: PlatformStrategy): void;

  /**
   * Get available platform names
   */
  getAvailablePlatforms(): string[];
}