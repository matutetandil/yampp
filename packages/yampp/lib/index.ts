// Main exports for Yam++ library
export { Parser } from './parser.js';
export { ParseError } from './parser/parse-error.js';
export { Task, TaskGraph } from './models/index.js';
export { Validator } from './validator.js';
export { ValidationError } from './validator/validation-error.js';
export { Runner } from './runner.js';
export { StateManager } from './state.js';

// Plugin development exports
export { BaseInternalFunction } from './internal-functions/base-function.js';
export { VoidInternalFunction } from './internal-functions/void-internal-function.js';
export { ReturnValueInternalFunction } from './internal-functions/return-value-internal-function.js';

// Version info
export { version } from '../package.json' assert { type: 'json' };