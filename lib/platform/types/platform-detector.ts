import { PlatformStrategy } from './platform-strategy.js';

/**
 * Detector for current platform and strategy
 */
export interface PlatformDetector {
  /** Current platform strategy */
  currentPlatform: PlatformStrategy;
}