import { ValidationError } from './validation-error.interface.js';
import { ValidationWarning } from './validation-warning.interface.js';

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}