import { AstVariable } from './ast-variable.js';
import { AstConstant } from './ast-constant.js';
import { AstEnvironmentVariable } from './ast-environment-variable.js';
import { AstPlatformBlock } from './ast-platform-block.js';
import { AstAnnotationBlock } from './ast-annotation-block.js';
import { AstInclude } from './ast-include.js';
import { AstTask } from './ast-task.js';
import type { ImportStatement } from '../../plugin/types/ImportStatement.js';

/**
 * Root AST node representing a parsed Yamfile
 */
export interface AstNode {
  variables: AstVariable[];
  constants: AstConstant[];
  environmentVariables?: AstEnvironmentVariable[];
  platformBlocks?: AstPlatformBlock[];
  annotationBlocks?: AstAnnotationBlock[];
  includes?: AstInclude[];
  imports?: ImportStatement[];
  defaultProfile?: string | null;
  tasks: AstTask[];
}