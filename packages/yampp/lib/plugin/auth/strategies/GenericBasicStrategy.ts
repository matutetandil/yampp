import type { IAuthStrategy } from '../IAuthStrategy.js';

/**
 * Generic Basic authentication strategy
 * Single Responsibility: Handle generic HTTP Basic authentication
 */
export class GenericBasicStrategy implements IAuthStrategy {
  readonly name = 'generic-basic';

  canHandle(url: URL): boolean {
    return !!(process.env.YAMPP_HTTP_USER && process.env.YAMPP_HTTP_PASS);
  }

  getAuthHeaders(url: URL): Record<string, string> {
    const credentials = btoa(`${process.env.YAMPP_HTTP_USER}:${process.env.YAMPP_HTTP_PASS}`);
    return { 'Authorization': `Basic ${credentials}` };
  }
}