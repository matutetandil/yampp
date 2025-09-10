import { ParsedParameter } from '../../core/types/parsed-parameter.js';
import { LocationRange } from '../../yamfile-parser.js';

/**
 * Represents a call to execute a task with parameters
 * Based on the makeCall function structure from yamfile-parser.js
 * Uses SOLID-compliant types for all properties
 */
export interface TaskCall {
  type: 'call';
  taskName: string;
  parameters: ParsedParameter[]; // Array of properly typed parameters
  location?: LocationRange; // Uses proper LocationRange type from parser
}