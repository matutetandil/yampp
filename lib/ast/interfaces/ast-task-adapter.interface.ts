import { IAstTaskBasicInfo } from './ast-task-basic-info.interface.js';
import { IAstTaskDependencies } from './ast-task-dependencies.interface.js';
import { IAstTaskContent } from './ast-task-content.interface.js';
import { IAstTaskVariables } from './ast-task-variables.interface.js';
import { IAstTaskFiles } from './ast-task-files.interface.js';
import { IAstTaskExtensibility } from './ast-task-extensibility.interface.js';

/**
 * Complete AST Task Adapter Interface
 * Composed of segregated, focused interfaces following ISP
 * 
 * Interface Segregation Principle: Clients depend only on methods they use
 * Dependency Inversion Principle: Depend on abstraction, not concretion
 */
export interface IAstTaskAdapter 
  extends IAstTaskBasicInfo,
          IAstTaskDependencies, 
          IAstTaskContent,
          IAstTaskVariables,
          IAstTaskFiles,
          IAstTaskExtensibility {
  // Complete interface through composition
  // Clients can now depend on only the specific aspects they need
}