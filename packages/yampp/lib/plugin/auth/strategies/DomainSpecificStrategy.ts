import type { IAuthStrategy } from '../IAuthStrategy.js';

/**
 * Domain-specific environment variable strategy
 * Single Responsibility: Handle domain-specific authentication via env vars
 */
export class DomainSpecificStrategy implements IAuthStrategy {
  readonly name = 'domain-specific';

  canHandle(url: URL): boolean {
    const domain = this.getDomainEnvPrefix(url.hostname);
    return !!(process.env[`${domain}_USER`] && process.env[`${domain}_PASS`]);
  }

  getAuthHeaders(url: URL): Record<string, string> {
    const domain = this.getDomainEnvPrefix(url.hostname);
    const user = process.env[`${domain}_USER`]!;
    const pass = process.env[`${domain}_PASS`]!;
    const credentials = btoa(`${user}:${pass}`);
    return { 'Authorization': `Basic ${credentials}` };
  }

  private getDomainEnvPrefix(hostname: string): string {
    return `YAMPP_${hostname.replace(/\./g, '_').toUpperCase()}`;
  }
}