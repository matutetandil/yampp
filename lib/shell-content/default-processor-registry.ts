import { setupDefaultProcessors } from './setup-default-processors.js';

/**
 * Create default registry instance
 * This is the main export that other modules should use
 */
export const defaultProcessorRegistry = setupDefaultProcessors();