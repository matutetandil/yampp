import type { IAuthStrategy } from './IAuthStrategy.js';

/**
 * Factory for creating custom authentication strategies
 * Single Responsibility: Create custom authentication strategies
 */
export class AuthStrategyFactory {
  /**
   * Create a custom domain-specific Basic Auth strategy
   */
  static createCustomDomainStrategy(
    domain: string,
    userEnvVar: string,
    passEnvVar: string
  ): IAuthStrategy {
    return {
      name: `custom-${domain}`,
      canHandle: (url: URL) => url.hostname === domain &&
                              !!(process.env[userEnvVar] && process.env[passEnvVar]),
      getAuthHeaders: (url: URL) => {
        const credentials = btoa(`${process.env[userEnvVar]}:${process.env[passEnvVar]}`);
        return { 'Authorization': `Basic ${credentials}` };
      }
    };
  }

  /**
   * Create a custom token-based authentication strategy
   */
  static createCustomTokenStrategy(
    domain: string,
    tokenEnvVar: string,
    headerFormat: 'Bearer' | 'token' | 'custom' = 'Bearer'
  ): IAuthStrategy {
    return {
      name: `custom-token-${domain}`,
      canHandle: (url: URL) => url.hostname === domain && !!process.env[tokenEnvVar],
      getAuthHeaders: (url: URL) => {
        const token = process.env[tokenEnvVar]!;
        return { 'Authorization': `${headerFormat} ${token}` };
      }
    };
  }

  /**
   * Create a custom strategy with full control over headers
   */
  static createCustomHeaderStrategy(
    domain: string,
    envVar: string,
    headerName: string,
    headerValueTransform?: (value: string) => string
  ): IAuthStrategy {
    return {
      name: `custom-header-${domain}`,
      canHandle: (url: URL) => url.hostname === domain && !!process.env[envVar],
      getAuthHeaders: (url: URL) => {
        const value = process.env[envVar]!;
        const transformedValue = headerValueTransform ? headerValueTransform(value) : value;
        return { [headerName]: transformedValue };
      }
    };
  }
}