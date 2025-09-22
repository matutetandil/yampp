import type { IAuthStrategy } from '../IAuthStrategy.js';

/**
 * GitLab token authentication strategy
 * Single Responsibility: Handle GitLab API token authentication
 */
export class GitLabTokenStrategy implements IAuthStrategy {
  readonly name = 'gitlab-token';

  canHandle(url: URL): boolean {
    return url.hostname.includes('gitlab.com') && !!process.env.GITLAB_TOKEN;
  }

  getAuthHeaders(url: URL): Record<string, string> {
    return { 'Private-Token': process.env.GITLAB_TOKEN! };
  }
}