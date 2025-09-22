import { AstTask } from './ast-task.js';

/**
 * AST node representing a generic annotation block like @production {...}
 * Supports arbitrary annotations and nested content
 */
export interface AstAnnotationBlock {
  type: 'annotation_block';
  annotations: string[];
  content: (AstTask | AstAnnotationBlock)[];
  location?: any;
}