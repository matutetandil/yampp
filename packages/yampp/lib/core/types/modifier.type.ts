import { TaskModifiers } from '../constants/modifiers.constants.js';

/**
 * Type representing valid task modifiers
 */
export type TaskModifierType = typeof TaskModifiers[keyof typeof TaskModifiers];