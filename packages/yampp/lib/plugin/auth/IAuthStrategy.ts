/**
 * Authentication strategy interface
 * Single Responsibility: Define contract for HTTP authentication strategies
 */
export interface IAuthStrategy {
  readonly name: string;
  canHandle(url: URL): boolean;
  getAuthHeaders(url: URL): Record<string, string>;
}