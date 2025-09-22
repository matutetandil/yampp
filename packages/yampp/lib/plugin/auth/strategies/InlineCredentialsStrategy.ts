import type { IAuthStrategy } from '../IAuthStrategy.js';

/**
 * Inline credentials strategy for URLs like https://user:pass@domain.com
 * Single Responsibility: Handle credentials embedded in URL
 */
export class InlineCredentialsStrategy implements IAuthStrategy {
  readonly name = 'inline-credentials';

  canHandle(url: URL): boolean {
    return !!(url.username && url.password);
  }

  getAuthHeaders(url: URL): Record<string, string> {
    const credentials = btoa(`${url.username}:${url.password}`);
    return { 'Authorization': `Basic ${credentials}` };
  }
}