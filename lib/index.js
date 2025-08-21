// Main exports for Yam++ library
export { Parser, ParseError } from './parser.js';
export { Task, TaskGraph } from './task.js';
export { Validator, ValidationError } from './validator.js';
export { Runner } from './runner.js';
export { StateManager } from './state.js';

// Version info
export { version } from '../package.json' assert { type: 'json' };