import { defaultProcessorRegistry } from './default-processors.js';
import type { PlatformStrategy } from '../platform/types/platform-strategy.js';
import type { IInternalFunctionRegistry } from '../internal-functions/internal-function-registry.interface.js';
import type { ShellContentManager as IShellContentManager } from '../shell/types/shell-content-manager.js';
import { BaseContentProcessor } from './base-content-processor.js';
import { ContentProcessorRegistry } from './content-processor-registry.js';
import { ExecutionContext } from '../execution/types/execution-context.js';

/**
 * Shell Content Manager
 * Factory for creating appropriate content processors based on platform strategy
 * Now follows Open/Closed Principle - new processors can be added without modification
 */
export class ShellContentManager implements IShellContentManager {
  private readonly platformStrategy: PlatformStrategy;
  private readonly internalFunctionRegistry: IInternalFunctionRegistry;
  private readonly processorRegistry: ContentProcessorRegistry;
  private readonly contentProcessor: BaseContentProcessor;

  constructor(
    platformStrategy: PlatformStrategy,
    internalFunctionRegistry: IInternalFunctionRegistry,
    processorRegistry: ContentProcessorRegistry = defaultProcessorRegistry
  ) {
    this.platformStrategy = platformStrategy;
    this.internalFunctionRegistry = internalFunctionRegistry;
    this.processorRegistry = processorRegistry;
    this.contentProcessor = this.createContentProcessor();
  }


  /**
   * Create appropriate content processor based on platform
   * @returns Platform-specific content processor
   */
  private createContentProcessor(): BaseContentProcessor {
    const platform = this.platformStrategy.name;
    return this.processorRegistry.createProcessor(
      platform, 
      this.platformStrategy as any, 
      this.internalFunctionRegistry
    );
  }

  /**
   * Process shell content with appropriate processor
   * @param content - Raw task content from Yamfile
   * @param localVariables - Task's local variables
   * @param localConstants - Task's local constants
   * @returns Processed execution context
   */
  public process(content: string, localVariables?: any[], localConstants?: any[]): ExecutionContext {
    return this.contentProcessor.process(content, localVariables, localConstants);
  }

  /**
   * Check if content needs processing (has __functions or comments)
   * @param content - Content to check
   * @returns True if processing needed
   */
  public needsProcessing(content: string): boolean {
    // Check for proxy injection need
    if (this.contentProcessor.needsProxyInjection(content)) {
      return true;
    }
    
    // Check for Yampp comments that need filtering
    if (content.includes('//') || content.includes('/*')) {
      return true;
    }
    
    // Check for variable assignments that need proxy transformation
    if (content.match(/^\s*(var|const)\s+\w+\s*=/m)) {
      return true;
    }
    
    return false;
  }

  /**
   * Get response file path for platform
   * @param processId - Process ID
   * @returns Platform-specific response file path
   */
  public getResponseFilePath(processId: number): string {
    const platform = this.platformStrategy.name;
    return this.processorRegistry.getResponseFilePath(platform, processId);
  }
}