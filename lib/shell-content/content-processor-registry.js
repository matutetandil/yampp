/**
 * Content Processor Registry
 * Registry for shell content processors following Open/Closed Principle
 * New processors can be added without modifying existing code
 */
export class ContentProcessorRegistry {
  constructor() {
    this.processors = new Map();
    this.responsePaths = new Map();
  }

  /**
   * Register a content processor for specific platforms
   * @param {Array|string} platforms - Platform names (e.g., ['linux', 'mac'] or 'windows')
   * @param {Class} ProcessorClass - Content processor class
   * @param {Function} responsePathGenerator - Function to generate response file path
   */
  register(platforms, ProcessorClass, responsePathGenerator) {
    const platformArray = Array.isArray(platforms) ? platforms : [platforms];
    
    for (const platform of platformArray) {
      this.processors.set(platform, ProcessorClass);
      this.responsePaths.set(platform, responsePathGenerator);
    }
  }

  /**
   * Create content processor for platform
   * @param {string} platform - Platform name
   * @param {Object} platformStrategy - Platform strategy
   * @param {Object} internalFunctionRegistry - Internal function registry
   * @returns {BaseContentProcessor} - Content processor instance
   */
  createProcessor(platform, platformStrategy, internalFunctionRegistry) {
    const ProcessorClass = this.processors.get(platform);
    
    if (!ProcessorClass) {
      // Fallback to bash-like behavior for unknown platforms
      const BashProcessorClass = this.processors.get('linux');
      if (BashProcessorClass) {
        return new BashProcessorClass(platformStrategy, internalFunctionRegistry);
      }
      throw new Error(`No content processor registered for platform: ${platform}`);
    }
    
    return new ProcessorClass(platformStrategy, internalFunctionRegistry);
  }

  /**
   * Get response file path for platform
   * @param {string} platform - Platform name
   * @param {number} processId - Process ID
   * @returns {string} - Platform-specific response file path
   */
  getResponseFilePath(platform, processId) {
    const pathGenerator = this.responsePaths.get(platform);
    
    if (!pathGenerator) {
      // Fallback to Unix-style path for unknown platforms
      const unixPathGenerator = this.responsePaths.get('linux');
      if (unixPathGenerator) {
        return unixPathGenerator(processId);
      }
      return `/tmp/yampp_response_${processId}`;
    }
    
    return pathGenerator(processId);
  }

  /**
   * Check if platform is supported
   * @param {string} platform - Platform name
   * @returns {boolean} - True if platform is supported
   */
  isSupported(platform) {
    return this.processors.has(platform);
  }

  /**
   * Get all registered platforms
   * @returns {Array} - Array of supported platform names
   */
  getSupportedPlatforms() {
    return Array.from(this.processors.keys());
  }
}