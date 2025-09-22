import { ValidationErrorInfo } from '../validation/types/validation-error-info.js';

/**
 * Validation Error
 * Custom error class for validation-related errors
 * Provides detailed error and warning information
 */
export class ValidationError extends Error {
  public readonly errors: ValidationErrorInfo[];
  public readonly warnings: ValidationErrorInfo[];

  constructor(errors: ValidationErrorInfo[], warnings: ValidationErrorInfo[]) {
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