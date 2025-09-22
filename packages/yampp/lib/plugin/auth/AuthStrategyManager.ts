import type { IAuthStrategy } from './IAuthStrategy.js';
import { InlineCredentialsStrategy } from './strategies/InlineCredentialsStrategy.js';
import { DomainSpecificStrategy } from './strategies/DomainSpecificStrategy.js';
import { GitHubTokenStrategy } from './strategies/GitHubTokenStrategy.js';
import { GitLabTokenStrategy } from './strategies/GitLabTokenStrategy.js';
import { GenericBearerStrategy } from './strategies/GenericBearerStrategy.js';
import { GenericBasicStrategy } from './strategies/GenericBasicStrategy.js';

/**
 * Authentication strategy manager (Context in Strategy pattern)
 * Single Responsibility: Manage and coordinate authentication strategies
 */
export class AuthStrategyManager {
  private strategies: IAuthStrategy[] = [];

  constructor() {
    this.registerDefaultStrategies();
  }

  private registerDefaultStrategies(): void {
    // Order matters - more specific strategies first
    this.addStrategy(new InlineCredentialsStrategy());
    this.addStrategy(new DomainSpecificStrategy());
    this.addStrategy(new GitHubTokenStrategy());
    this.addStrategy(new GitLabTokenStrategy());
    this.addStrategy(new GenericBearerStrategy());
    this.addStrategy(new GenericBasicStrategy());
  }

  addStrategy(strategy: IAuthStrategy): void {
    this.strategies.push(strategy);
  }

  removeStrategy(name: string): void {
    this.strategies = this.strategies.filter(s => s.name !== name);
  }

  getAuthHeaders(url: URL): Record<string, string> {
    for (const strategy of this.strategies) {
      if (strategy.canHandle(url)) {
        return strategy.getAuthHeaders(url);
      }
    }
    return {};
  }

  getApplicableStrategy(url: URL): IAuthStrategy | null {
    return this.strategies.find(s => s.canHandle(url)) || null;
  }

  getAllStrategies(): readonly IAuthStrategy[] {
    return [...this.strategies];
  }
}