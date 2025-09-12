/**
 * Platform constants
 * Centralized definition of all platform identifiers to avoid magic strings
 */
export const Platforms = {
  /** Linux operating system */
  LINUX: 'linux',
  
  /** macOS operating system */
  MAC: 'mac',
  
  /** Windows operating system */
  WINDOWS: 'windows'
} as const;