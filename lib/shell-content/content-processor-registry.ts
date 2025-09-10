import { BaseContentProcessor } from './base-content-processor.js';
import { PlatformStrategy } from '../platform/platform-strategy.js';
import { IInternalFunctionRegistry } from '../internal-functions/internal-function-registry.interface.js';
import { ProcessorClassConstructor } from '../core/types/processor-class-constructor.js';
import { ResponsePathGenerator } from '../core/types/response-path-generator.js';

/**
 * Content Processor Registry
 * Registry for shell content processors following Open/Closed Principle
 * New processors can be added without modifying existing code
 */
export class ContentProcessorRegistry {
  private readonly processors: Map<string, ProcessorClassConstructor>;
  private readonly responsePaths: Map<string, ResponsePathGenerator>;

  constructor() {
    this.processors = new Map();
    this.responsePaths = new Map();
  }

  /**
   * Register a content processor for specific platforms
   */
  public register(
    platforms: string[] | string, 
    ProcessorClass: ProcessorClassConstructor, 
    responsePathGenerator: ResponsePathGenerator
  ): void {
    const platformArray = Array.isArray(platforms) ? platforms : [platforms];
    
    for (const platform of platformArray) {
      this.processors.set(platform, ProcessorClass);
      this.responsePaths.set(platform, responsePathGenerator);
    }
  }

  /**
   * Create content processor for platform
   */
  public createProcessor(
    platform: string, 
    platformStrategy: PlatformStrategy, 
    internalFunctionRegistry: IInternalFunctionRegistry
  ): BaseContentProcessor {
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
   */
  public getResponseFilePath(platform: string, processId: number): string {
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
   */
  public isSupported(platform: string): boolean {
    return this.processors.has(platform);
  }

  /**
   * Get all registered platforms
   */
  public getSupportedPlatforms(): string[] {
    return Array.from(this.processors.keys());
  }
}