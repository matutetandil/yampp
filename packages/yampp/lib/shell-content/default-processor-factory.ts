import { BashContentProcessor } from './bash-content-processor.js';
import { PowerShellContentProcessor } from './powershell-content-processor.js';
import { CmdContentProcessor } from './cmd-content-processor.js';
import { ContentProcessorRegistry } from './content-processor-registry.js';

/**
 * Factory for creating default content processor registry
 * This follows the Open/Closed Principle - new processors can be added
 * without modifying existing code by creating new registration modules
 */
export class DefaultProcessorFactory {
  public static createRegistry(): ContentProcessorRegistry {
    const registry = new ContentProcessorRegistry();

    // Register Unix-like systems (Linux, macOS)
    registry.register(
      ['linux', 'mac'], 
      BashContentProcessor,
      (processId: number) => `/tmp/yampp_response_${processId}`
    );

    // Register Windows PowerShell
    registry.register(
      'windows', 
      PowerShellContentProcessor,
      (processId: number) => `%TEMP%\\yampp_response_${processId}`
    );

    // Alternative Windows CMD processor (can be enabled via configuration)
    // registry.register(
    //   'windows-cmd', 
    //   CmdContentProcessor,
    //   (processId: number) => `%TEMP%\\yampp_response_${processId}`
    // );

    return registry;
  }
}