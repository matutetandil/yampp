import { BashContentProcessor } from './bash-content-processor.js';
import { PowerShellContentProcessor } from './powershell-content-processor.js';
import { CmdContentProcessor } from './cmd-content-processor.js';

/**
 * Shell Content Manager
 * Factory for creating appropriate content processors based on platform strategy
 */
export class ShellContentManager {
  constructor(platformStrategy, internalFunctionRegistry) {
    this.platformStrategy = platformStrategy;
    this.internalFunctionRegistry = internalFunctionRegistry;
    this.contentProcessor = this.createContentProcessor();
  }

  /**
   * Create appropriate content processor based on platform
   * @returns {BaseContentProcessor} - Platform-specific content processor
   */
  createContentProcessor() {
    const platform = this.platformStrategy.name;
    
    switch (platform) {
      case 'linux':
      case 'mac':
        return new BashContentProcessor(this.platformStrategy, this.internalFunctionRegistry);
      
      case 'windows':
        // Choose between PowerShell and CMD based on availability/preference
        // For now, default to PowerShell (can be made configurable)
        return new PowerShellContentProcessor(this.platformStrategy, this.internalFunctionRegistry);
        // Alternative: return new CmdContentProcessor(this.platformStrategy, this.internalFunctionRegistry);
      
      default:
        // Fallback to bash-like behavior
        return new BashContentProcessor(this.platformStrategy, this.internalFunctionRegistry);
    }
  }

  /**
   * Process shell content with appropriate processor
   * @param {string} content - Raw task content from Yamfile
   * @returns {Object} - Processed execution context
   */
  process(content) {
    return this.contentProcessor.process(content);
  }

  /**
   * Check if content needs processing (has __functions or comments)
   * @param {string} content - Content to check
   * @returns {boolean} - True if processing needed
   */
  needsProcessing(content) {
    // Check for proxy injection need
    if (this.contentProcessor.needsProxyInjection(content)) {
      return true;
    }
    
    // Check for Yampp comments that need filtering
    if (content.includes('//') || content.includes('/*')) {
      return true;
    }
    
    return false;
  }

  /**
   * Get response file path for platform
   * @param {number} processId - Process ID
   * @returns {string} - Platform-specific response file path
   */
  getResponseFilePath(processId) {
    const platform = this.platformStrategy.name;
    
    switch (platform) {
      case 'linux':
      case 'mac':
        return `/tmp/yampp_response_${processId}`;
      
      case 'windows':
        return `%TEMP%\\yampp_response_${processId}`;
      
      default:
        return `/tmp/yampp_response_${processId}`;
    }
  }
}