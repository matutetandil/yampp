import { InterceptRequest } from '../../core/types/intercept-request.js';

/**
 * Manager for shell proxy operations
 */
export interface ShellProxyManager {
  /**
   * Parse intercept request from stderr output
   */
  parseInterceptRequest(stderr: string): InterceptRequest | null;
  
  /**
   * Send intercept response back to shell process
   */
  sendInterceptResponse(processId: number, success: boolean, pendingExports?: Map<string, string>, returnValue?: string | null): Promise<void>;
}