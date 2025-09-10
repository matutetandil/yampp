/**
 * Parse Error
 * Custom error class for parser-related errors
 * Provides enhanced error information with line numbers and context
 */
export class ParseError extends Error {
  public readonly line: number;
  public readonly context: string;
  public readonly content: string | null;
  
  constructor(message: string, line: number, context: string, content: string | null = null) {
    super(message);
    this.name = 'ParseError';
    this.line = line;
    this.context = context;
    this.content = content;
  }
  
  /**
   * Get an excerpt of the problematic line for better error reporting
   */
  public static getLineExcerpt(content: string, line: number, column: number): string {
    if (!content || !line) return '';
    
    const lines = content.split('\n');
    if (line > lines.length) return '';
    
    const problemLine = lines[line - 1];
    const pointer = ' '.repeat(Math.max(0, column - 1)) + '^';
    
    return `\n${problemLine}\n${pointer}`;
  }
}