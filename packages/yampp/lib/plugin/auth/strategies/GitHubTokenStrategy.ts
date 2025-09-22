import type { IAuthStrategy } from '../IAuthStrategy.js';

/**
 * GitHub token authentication strategy
 * Single Responsibility: Handle GitHub API token authentication
 */
export class GitHubTokenStrategy implements IAuthStrategy {
  readonly name = 'github-token';

  canHandle(url: URL): boolean {
    return url.hostname.includes('github.com') && !!process.env.GITHUB_TOKEN;
  }

  getAuthHeaders(url: URL): Record<string, string> {
    return { 'Authorization': `token ${process.env.GITHUB_TOKEN}` };
  }
}