import { AstParameter } from './ast-parameter.js';

/**
 * AST node representing an internal function call
 */
export interface AstInternalFunction {
  name: string;
  params: AstParameter[];
}