// Platform Detection System Entry Point
// Exports all platform-related classes and provides singleton instance

export { PlatformStrategy } from './platform-strategy.js';
export { LinuxStrategy } from './linux-strategy.js';
export { MacStrategy } from './mac-strategy.js';
export { WindowsStrategy } from './windows-strategy.js';
export { PlatformDetectorFactory } from './platform-detector-factory.js';

// Singleton instance for easy access throughout the application
import { PlatformDetectorFactory } from './platform-detector-factory.js';
export const platformDetector = new PlatformDetectorFactory();