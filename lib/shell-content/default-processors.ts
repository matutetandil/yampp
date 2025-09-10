import { BashContentProcessor } from './bash-content-processor.js';
import { PowerShellContentProcessor } from './powershell-content-processor.js';
import { CmdContentProcessor } from './cmd-content-processor.js';
import { ContentProcessorRegistry } from './content-processor-registry.js';

/**
 * Setup default content processors
 * This follows the Open/Closed Principle - new processors can be added
 * without modifying existing code by creating new registration modules
 */
export function setupDefaultProcessors(): ContentProcessorRegistry {
  const registry = new ContentProcessorRegistry();
  
  // Register Unix-like systems (Linux, macOS)
  registry.register(['linux', 'mac'], BashContentProcessor, (processId) => `/tmp/yampp_response_${processId}`);
  
  // Register Windows PowerShell
  registry.register('windows', PowerShellContentProcessor, (processId) => `%TEMP%\\yampp_response_${processId}`);
  
  // Alternative Windows CMD processor (can be enabled via configuration)
  // registry.register(
  //   'windows-cmd', 
  //   CmdContentProcessor,
  //   (processId) => `%TEMP%\\yampp_response_${processId}`
  // );
  
  return registry;
}

/**
 * Create default registry instance
 * This is the main export that other modules should use
 */
export const defaultProcessorRegistry = setupDefaultProcessors();