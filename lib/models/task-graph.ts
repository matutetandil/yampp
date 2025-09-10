import { Task } from './task.js';
import { GraphNode } from '../core/types/graph-node.interface.js';
import { GraphEdge } from '../core/types/graph-edge.interface.js';
import { GraphJSON } from '../core/types/graph-json.interface.js';

/**
 * TaskGraph class handling dependency resolution, cycle detection, and execution planning
 */
export class TaskGraph {
  private readonly tasks: Map<string, Task>;
  private readonly adjacencyList: Map<string, string[]>;
  private readonly inDegree: Map<string, number>;

  constructor(tasks: Map<string, Task>) {
    this.tasks = tasks;
    this.adjacencyList = new Map();
    this.inDegree = new Map();
    this.buildGraph();
    this.detectCycles();
  }
  
  private buildGraph(): void {
    // Initialize adjacency list and in-degree for all tasks
    for (const [name, task] of this.tasks) {
      this.adjacencyList.set(name, []);
      this.inDegree.set(name, 0);
    }
    
    // Build the graph
    for (const [name, task] of this.tasks) {
      for (const dep of task.getDependencies()) {
        if (!this.tasks.has(dep)) {
          throw new Error(
            `Task '${name}' depends on undefined task '${dep}'` +
            (task.getLineNumber() ? ` (line ${task.getLineNumber()})` : '')
          );
        }
        
        // Add edge from dependency to task
        this.adjacencyList.get(dep)!.push(name);
        this.inDegree.set(name, this.inDegree.get(name)! + 1);
      }
    }
  }
  
  private detectCycles(): void {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    
    const hasCycle = (node: string, path: string[] = []): boolean => {
      visited.add(node);
      recursionStack.add(node);
      path.push(node);
      
      for (const neighbor of this.adjacencyList.get(node) || []) {
        if (!visited.has(neighbor)) {
          if (hasCycle(neighbor, [...path])) {
            return true;
          }
        } else if (recursionStack.has(neighbor)) {
          // Found a cycle
          const cycleStart = path.indexOf(neighbor);
          const cycle = [...path.slice(cycleStart), neighbor];
          throw new Error(
            `Circular dependency detected: ${cycle.join(' → ')}`
          );
        }
      }
      
      recursionStack.delete(node);
      return false;
    };
    
    for (const node of this.tasks.keys()) {
      if (!visited.has(node)) {
        hasCycle(node);
      }
    }
  }
  
  public getExecutionOrder(targetTasks: string[] = []): string[] {
    // If no targets specified, get root tasks (tasks with no dependents)
    if (targetTasks.length === 0) {
      targetTasks = this.getRootTasks();
    }
    
    // Validate target tasks exist
    for (const task of targetTasks) {
      if (!this.tasks.has(task)) {
        throw new Error(`Task '${task}' not found`);
      }
    }
    
    // Get all required tasks (targets and their dependencies)
    const required = new Set<string>();
    const visited = new Set<string>();
    
    const collectDependencies = (taskName: string): void => {
      if (visited.has(taskName)) return;
      visited.add(taskName);
      required.add(taskName);
      
      const task = this.tasks.get(taskName);
      if (task) {
        for (const dep of task.getDependencies()) {
          collectDependencies(dep);
        }
      }
    };
    
    for (const target of targetTasks) {
      collectDependencies(target);
    }
    
    // Topological sort of required tasks
    const sorted: string[] = [];
    const tempInDegree = new Map<string, number>();
    
    // Initialize temporary in-degree for required tasks only
    for (const task of required) {
      let degree = 0;
      const taskObj = this.tasks.get(task)!;
      for (const dep of taskObj.getDependencies()) {
        if (required.has(dep)) {
          degree++;
        }
      }
      tempInDegree.set(task, degree);
    }
    
    // Find all tasks with no dependencies
    const queue: string[] = [];
    for (const [task, degree] of tempInDegree) {
      if (degree === 0) {
        queue.push(task);
      }
    }
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      sorted.push(current);
      
      // Reduce in-degree for dependent tasks
      for (const dependent of this.adjacencyList.get(current) || []) {
        if (required.has(dependent)) {
          const newDegree = tempInDegree.get(dependent)! - 1;
          tempInDegree.set(dependent, newDegree);
          
          if (newDegree === 0) {
            queue.push(dependent);
          }
        }
      }
    }
    
    return sorted;
  }
  
  public getRootTasks(): string[] {
    const roots: string[] = [];
    
    for (const [name, task] of this.tasks) {
      // A root task has no other tasks depending on it
      let isRoot = true;
      for (const [otherName, otherTask] of this.tasks) {
        if (otherName !== name && otherTask.getDependencies().includes(name)) {
          isRoot = false;
          break;
        }
      }
      
      if (isRoot) {
        roots.push(name);
      }
    }
    
    // If no roots found (all tasks have dependents), return all tasks
    return roots.length > 0 ? roots : Array.from(this.tasks.keys());
  }
  
  public getDependencies(taskName: string): string[] {
    const task = this.tasks.get(taskName);
    return task ? task.getDependencies() : [];
  }
  
  public getDependents(taskName: string): string[] {
    return this.adjacencyList.get(taskName) || [];
  }
  
  public getAllDependencies(taskName: string): string[] {
    const allDeps = new Set<string>();
    const visited = new Set<string>();
    
    const collect = (name: string): void => {
      if (visited.has(name)) return;
      visited.add(name);
      
      const task = this.tasks.get(name);
      if (task) {
        for (const dep of task.getDependencies()) {
          allDeps.add(dep);
          collect(dep);
        }
      }
    };
    
    collect(taskName);
    return Array.from(allDeps);
  }
  
  public getGraphVisualization(): string {
    const lines: string[] = [];
    const visited = new Set<string>();
    
    const printTask = (name: string, indent: number = 0): void => {
      if (visited.has(name)) {
        lines.push('  '.repeat(indent) + `${name} (already shown)`);
        return;
      }
      
      visited.add(name);
      const task = this.tasks.get(name);
      
      if (!task) return;
      
      let line = '  '.repeat(indent) + name;
      if (task.getModifiers().size > 0) {
        line += ` [${Array.from(task.getModifiers()).join(', ')}]`;
      }
      
      lines.push(line);
      
      for (const dep of task.getDependencies()) {
        printTask(dep, indent + 1);
      }
    };
    
    // Start with root tasks
    const roots = this.getRootTasks();
    for (const root of roots) {
      printTask(root);
    }
    
    return lines.join('\n');
  }
  
  public toDotFormat(): string {
    const lines = [
      'digraph TaskGraph {',
      '  rankdir=LR;',
      '  node [shape=box, style=filled];'
    ];
    
    // Add nodes with styling based on modifiers
    for (const [name, task] of this.tasks) {
      let style = 'fillcolor=lightblue';
      let label = name;
      
      if (task.getModifiers().has('always')) {
        style = 'fillcolor=yellow';
        label += '\\n[always]';
      }
      if (task.getModifiers().has('critical')) {
        style = 'fillcolor=red, fontcolor=white';
        label += '\\n[critical]';
      }
      if (task.getModifiers().has('serial')) {
        style = 'fillcolor=orange';
        label += '\\n[serial]';
      }
      
      lines.push(`  "${name}" [${style}, label="${label}"];`);
    }
    
    lines.push('');
    
    // Add edges
    for (const [name, task] of this.tasks) {
      for (const dep of task.getDependencies()) {
        lines.push(`  "${dep}" -> "${name}";`);
      }
    }
    
    lines.push('}');
    return lines.join('\n');
  }
  
  public toJSON(): GraphJSON {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    
    for (const [name, task] of this.tasks) {
      nodes.push({
        id: name,
        label: name,
        modifiers: Array.from(task.getModifiers()),
        parameters: task.getParameters().map(p => p.name) || [],
        watches: task.getWatchedFiles() || [],
        platforms: []
      });
      
      for (const dep of task.getDependencies()) {
        edges.push({
          from: dep,
          to: name
        });
      }
    }
    
    return {
      nodes,
      edges,
      totalTasks: this.tasks.size,
      generatedAt: new Date().toISOString()
    };
  }
}