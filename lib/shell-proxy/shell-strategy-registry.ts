import { IShellStrategyRegistry } from './interfaces/shell-strategy-registry.interface.js';
import { ShellProxyStrategy } from './shell-proxy-strategy.js';
import { BashProxyStrategy } from './bash-proxy-strategy.js';
import { PowerShellProxyStrategy } from './powershell-proxy-strategy.js';
import { Platforms } from '../core/constants/platforms.constants.js';

export class ShellStrategyRegistry implements IShellStrategyRegistry {
  private readonly strategies = new Map<string, () => ShellProxyStrategy>();
  private fallbackStrategyFactory: () => ShellProxyStrategy;

  constructor() {
    this.registerDefaultStrategies();
    this.fallbackStrategyFactory = () => new BashProxyStrategy();
  }

  public registerStrategy(platform: string, strategyFactory: () => ShellProxyStrategy): void {
    this.strategies.set(platform.toLowerCase(), strategyFactory);
  }

  public getStrategy(platform: string): ShellProxyStrategy | null {
    const factory = this.strategies.get(platform.toLowerCase());
    if (factory) {
      return factory();
    }
    
    // Return fallback strategy if available
    if (this.fallbackStrategyFactory) {
      return this.fallbackStrategyFactory();
    }
    
    return null;
  }

  public getRegisteredPlatforms(): string[] {
    return Array.from(this.strategies.keys());
  }

  public hasStrategy(platform: string): boolean {
    return this.strategies.has(platform.toLowerCase());
  }

  public setFallbackStrategy(strategyFactory: () => ShellProxyStrategy): void {
    this.fallbackStrategyFactory = strategyFactory;
  }

  private registerDefaultStrategies(): void {
    this.registerStrategy(Platforms.LINUX, () => new BashProxyStrategy());
    this.registerStrategy(Platforms.MAC, () => new BashProxyStrategy());
    this.registerStrategy(Platforms.WINDOWS, () => new PowerShellProxyStrategy());
  }
}