import { Runner } from '../../runner.js';
import { ITaskMap } from '../../tasks/interfaces/task-map.interface.js';
import { ITaskGraph } from '../../tasks/interfaces/task-graph.interface.js';

/**
 * Abstract base class for graph formatters
 * Implements Strategy pattern for different output formats
 */
export abstract class BaseGraphFormatter {
  protected readonly runner: Runner;
  protected readonly graph: ITaskGraph;
  protected readonly tasks: ITaskMap;

  constructor(runner: Runner) {
    this.runner = runner;
    this.graph = runner.getGraph();
    this.tasks = runner.getTasks();
  }
  
  /**
   * Format and output the graph
   */
  public abstract format(taskName?: string): void;
  
  /**
   * Get formatter name
   */
  public abstract getName(): string;
  
  /**
   * Check if this formatter supports a specific task filter
   */
  public supportsTaskFilter(): boolean {
    return true;
  }
}