import type { IAuthStrategy } from '../IAuthStrategy.js';

/**
 * Generic Bearer token authentication strategy
 * Single Responsibility: Handle generic Bearer token authentication
 */
export class GenericBearerStrategy implements IAuthStrategy {
  readonly name = 'generic-bearer';

  canHandle(url: URL): boolean {
    return !!process.env.YAMPP_HTTP_TOKEN;
  }

  getAuthHeaders(url: URL): Record<string, string> {
    return { 'Authorization': `Bearer ${process.env.YAMPP_HTTP_TOKEN}` };
  }
}