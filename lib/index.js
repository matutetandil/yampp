// Main exports for Yam++ library
export { Parser } from './parser.js';
export { ParseError } from './parser/parse-error.js';
export { Task, TaskGraph } from './models/index.js';
export { Validator } from './validator.js';
export { ValidationError } from './validator/validation-error.js';
export { Runner } from './runner.js';
export { StateManager } from './state.js';

// Version info
export { version } from '../package.json' assert { type: 'json' };