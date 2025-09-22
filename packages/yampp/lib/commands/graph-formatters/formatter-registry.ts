import { TextGraphFormatter } from './text-formatter.js';
import { DotGraphFormatter } from './dot-formatter.js';
import { JsonGraphFormatter } from './json-formatter.js';
import { AsciiGraphFormatter } from './ascii-formatter.js';
import { BaseGraphFormatter } from './base-formatter.js';
import { Runner } from '../../runner.js';

type FormatterConstructor = new (runner: Runner) => BaseGraphFormatter;

/**
 * Registry for graph formatters
 * Implements Factory pattern for formatter selection
 */
export class GraphFormatterRegistry {
  private readonly formatters: Map<string, FormatterConstructor>;

  constructor() {
    this.formatters = new Map();
    this.registerDefaults();
  }
  
  /**
   * Register default formatters
   */
  private registerDefaults(): void {
    this.register('text', TextGraphFormatter);
    this.register('dot', DotGraphFormatter);
    this.register('json', JsonGraphFormatter);
    this.register('ascii', AsciiGraphFormatter);
  }
  
  /**
   * Register a formatter
   */
  public register(format: string, formatterClass: FormatterConstructor): void {
    this.formatters.set(format, formatterClass);
  }
  
  /**
   * Get a formatter instance
   */
  public getFormatter(format: string, runner: Runner): BaseGraphFormatter {
    const FormatterClass = this.formatters.get(format);
    if (!FormatterClass) {
      throw new Error(`Unknown graph format '${format}'. Valid formats: ${this.getAvailableFormats().join(', ')}`);
    }
    return new FormatterClass(runner);
  }
  
  /**
   * Check if a format is registered
   */
  public hasFormat(format: string): boolean {
    return this.formatters.has(format);
  }
  
  /**
   * Get list of available formats
   */
  public getAvailableFormats(): string[] {
    return Array.from(this.formatters.keys());
  }
}