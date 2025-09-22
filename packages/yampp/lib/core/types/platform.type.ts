import { Platforms } from '../constants/platforms.constants.js';

/**
 * Type representing valid platform identifiers
 */
export type PlatformType = typeof Platforms[keyof typeof Platforms];