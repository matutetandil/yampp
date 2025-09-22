// Platform Detection System Entry Point
// Exports all platform-related classes and provides singleton instance

export { PlatformStrategy } from './platform-strategy.js';
export { ShellCommand } from '../shell/interfaces/shell-command.interface.js';
export { PlatformInfo } from './interfaces/platform-info.interface.js';
export type { ParsedParameter } from '../core/types/parsed-parameter.js';
export { LinuxStrategy } from './linux-strategy.js';
export { MacStrategy } from './mac-strategy.js';
export { WindowsStrategy } from './windows-strategy.js';
export { UnknownStrategy } from './unknown-strategy.js';
export { PlatformDetectorFactory } from './platform-detector-factory.js';

// Singleton instance for easy access throughout the application
import { PlatformDetectorFactory } from './platform-detector-factory.js';
export const platformDetector = new PlatformDetectorFactory();