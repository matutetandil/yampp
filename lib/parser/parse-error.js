/**
 * Parse Error
 * Custom error class for parser-related errors
 * Provides enhanced error information with line numbers and context
 */
export class ParseError extends Error {
  constructor(message, line, context) {
    super(message);
    this.name = 'ParseError';
    this.line = line;
    this.context = context;
  }
}