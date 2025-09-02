import { TextGraphFormatter } from './text-formatter.js';
import { DotGraphFormatter } from './dot-formatter.js';
import { JsonGraphFormatter } from './json-formatter.js';
import { AsciiGraphFormatter } from './ascii-formatter.js';

/**
 * Registry for graph formatters
 * Implements Factory pattern for formatter selection
 */
export class GraphFormatterRegistry {
  constructor() {
    this.formatters = new Map();
    this.registerDefaults();
  }
  
  /**
   * Register default formatters
   */
  registerDefaults() {
    this.register('text', TextGraphFormatter);
    this.register('dot', DotGraphFormatter);
    this.register('json', JsonGraphFormatter);
    this.register('ascii', AsciiGraphFormatter);
  }
  
  /**
   * Register a formatter
   * @param {string} format - Format name
   * @param {class} formatterClass - Formatter class extending BaseGraphFormatter
   */
  register(format, formatterClass) {
    this.formatters.set(format, formatterClass);
  }
  
  /**
   * Get a formatter instance
   * @param {string} format - Format name
   * @param {Runner} runner - Runner instance
   * @returns {BaseGraphFormatter} Formatter instance
   */
  getFormatter(format, runner) {
    const FormatterClass = this.formatters.get(format);
    if (!FormatterClass) {
      throw new Error(`Unknown graph format '${format}'. Valid formats: ${this.getAvailableFormats().join(', ')}`);
    }
    return new FormatterClass(runner);
  }
  
  /**
   * Check if a format is registered
   * @param {string} format - Format name
   * @returns {boolean}
   */
  hasFormat(format) {
    return this.formatters.has(format);
  }
  
  /**
   * Get list of available formats
   * @returns {string[]} Array of format names
   */
  getAvailableFormats() {
    return Array.from(this.formatters.keys());
  }
}