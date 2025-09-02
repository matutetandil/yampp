/**
 * Validation Error
 * Custom error class for validation-related errors
 * Provides detailed error and warning information
 */
export class ValidationError extends Error {
  constructor(errors, warnings) {
    const errorCount = errors.length;
    const warningCount = warnings.length;
    
    let message = `Validation failed with ${errorCount} error(s)`;
    if (warningCount > 0) {
      message += ` and ${warningCount} warning(s)`;
    }
    
    super(message);
    this.name = 'ValidationError';
    this.errors = errors;
    this.warnings = warnings;
  }
}