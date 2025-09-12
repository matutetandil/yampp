import { ShellProxyStrategy } from '../shell-proxy-strategy.js';

export interface IShellStrategyRegistry {
  /**
   * Register a shell strategy for a platform
   * @param platform - The platform name (e.g., 'linux', 'windows', 'mac')
   * @param strategyFactory - Factory function to create the strategy
   */
  registerStrategy(platform: string, strategyFactory: () => ShellProxyStrategy): void;

  /**
   * Get strategy for a platform
   * @param platform - The platform name
   * @returns The strategy instance or null if not found
   */
  getStrategy(platform: string): ShellProxyStrategy | null;

  /**
   * Get all registered platforms
   * @returns Array of registered platform names
   */
  getRegisteredPlatforms(): string[];

  /**
   * Check if a platform has a registered strategy
   * @param platform - The platform name
   * @returns True if strategy is registered
   */
  hasStrategy(platform: string): boolean;

  /**
   * Set the fallback strategy for unknown platforms
   * @param strategyFactory - Factory function for fallback strategy
   */
  setFallbackStrategy(strategyFactory: () => ShellProxyStrategy): void;
}