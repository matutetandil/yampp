export class Task {
  constructor({ name, modifiers = [], dependencies = [], commands = [], lineNumber = null, parameters = [], dependencyParams = {}, watchedFiles = [], localVariables = new Map(), localConstants = new Map(), calls = [], inputs = [], internalFunctions = [] }) {
    this.name = name;
    this.modifiers = new Set(modifiers);
    this.dependencies = dependencies;
    this.commands = commands;
    this.lineNumber = lineNumber;
    this.status = 'pending';
    this.error = null;
    this.parameters = parameters; // Array of parameter names this task accepts
    this.dependencyParams = dependencyParams; // Map of dependency -> parameters to pass
    this.watchedFiles = watchedFiles; // Array of file patterns to watch for changes
    this.variables = new Map(); // Runtime variables for this task
    this.localVariables = localVariables; // Local variables declared in this task
    this.localConstants = localConstants; // Local constants declared in this task
    this.calls = calls; // Internal task calls using _call
    this.inputs = inputs; // User input prompts defined in this task
    this.internalFunctions = internalFunctions; // Generic internal function calls
  }
  
  hasModifier(modifier) {
    return this.modifiers.has(modifier);
  }
  
  get isAlways() {
    return this.hasModifier('always');
  }
  
  get isSerial() {
    return this.hasModifier('serial');
  }
  
  get isCritical() {
    return this.hasModifier('critical');
  }
  
  get isParallel() {
    return !this.isSerial;
  }
  
  setVariable(name, value) {
    this.variables.set(name, value);
  }
  
  getVariable(name) {
    return this.variables.get(name);
  }
  
  hasParameter(name) {
    return this.parameters.includes(name);
  }
  
  hasWatchedFiles() {
    return this.watchedFiles && this.watchedFiles.length > 0;
  }
  
  getSignature() {
    if (this.parameters.length === 0) {
      return this.name;
    }
    return `${this.name}(${this.parameters.join(', ')})`;
  }
  
  getDependencyWithParams(depName) {
    const params = this.dependencyParams[depName] || [];
    if (params.length === 0) {
      return depName;
    }
    return `${depName}(${params.join(', ')})`;
  }
  
  substituteVariables(command) {
    let result = command;
    
    // Replace $variable with actual values
    for (const [name, value] of this.variables) {
      const regex = new RegExp(`\\$${name}\\b`, 'g');
      result = result.replace(regex, value);
    }
    
    return result;
  }
  
  toJSON() {
    return {
      name: this.name,
      modifiers: Array.from(this.modifiers),
      dependencies: this.dependencies,
      commands: this.commands,
      parameters: this.parameters,
      dependencyParams: this.dependencyParams,
      status: this.status
    };
  }
}

export class TaskGraph {
  constructor(tasks) {
    this.tasks = tasks;
    this.adjacencyList = new Map();
    this.inDegree = new Map();
    this.buildGraph();
    this.detectCycles();
  }
  
  buildGraph() {
    // Initialize adjacency list and in-degree for all tasks
    for (const [name, task] of this.tasks) {
      this.adjacencyList.set(name, []);
      this.inDegree.set(name, 0);
    }
    
    // Build the graph
    for (const [name, task] of this.tasks) {
      for (const dep of task.dependencies) {
        if (!this.tasks.has(dep)) {
          throw new Error(
            `Task '${name}' depends on undefined task '${dep}'` +
            (task.lineNumber ? ` (line ${task.lineNumber})` : '')
          );
        }
        
        // Add edge from dependency to task
        this.adjacencyList.get(dep).push(name);
        this.inDegree.set(name, this.inDegree.get(name) + 1);
      }
    }
  }
  
  detectCycles() {
    const visited = new Set();
    const recursionStack = new Set();
    
    const hasCycle = (node, path = []) => {
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
  
  getExecutionOrder(targetTasks = []) {
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
    const required = new Set();
    const visited = new Set();
    
    const collectDependencies = (taskName) => {
      if (visited.has(taskName)) return;
      visited.add(taskName);
      required.add(taskName);
      
      const task = this.tasks.get(taskName);
      if (task) {
        for (const dep of task.dependencies) {
          collectDependencies(dep);
        }
      }
    };
    
    for (const target of targetTasks) {
      collectDependencies(target);
    }
    
    // Topological sort of required tasks
    const sorted = [];
    const tempInDegree = new Map();
    
    // Initialize temporary in-degree for required tasks only
    for (const task of required) {
      let degree = 0;
      const taskObj = this.tasks.get(task);
      for (const dep of taskObj.dependencies) {
        if (required.has(dep)) {
          degree++;
        }
      }
      tempInDegree.set(task, degree);
    }
    
    // Find all tasks with no dependencies
    const queue = [];
    for (const [task, degree] of tempInDegree) {
      if (degree === 0) {
        queue.push(task);
      }
    }
    
    while (queue.length > 0) {
      const current = queue.shift();
      sorted.push(current);
      
      // Reduce in-degree for dependent tasks
      for (const dependent of this.adjacencyList.get(current) || []) {
        if (required.has(dependent)) {
          const newDegree = tempInDegree.get(dependent) - 1;
          tempInDegree.set(dependent, newDegree);
          
          if (newDegree === 0) {
            queue.push(dependent);
          }
        }
      }
    }
    
    return sorted;
  }
  
  getRootTasks() {
    const roots = [];
    
    for (const [name, task] of this.tasks) {
      // A root task has no other tasks depending on it
      let isRoot = true;
      for (const [otherName, otherTask] of this.tasks) {
        if (otherName !== name && otherTask.dependencies.includes(name)) {
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
  
  getDependencies(taskName) {
    const task = this.tasks.get(taskName);
    return task ? task.dependencies : [];
  }
  
  getDependents(taskName) {
    return this.adjacencyList.get(taskName) || [];
  }
  
  getAllDependencies(taskName) {
    const allDeps = new Set();
    const visited = new Set();
    
    const collect = (name) => {
      if (visited.has(name)) return;
      visited.add(name);
      
      const task = this.tasks.get(name);
      if (task) {
        for (const dep of task.dependencies) {
          allDeps.add(dep);
          collect(dep);
        }
      }
    };
    
    collect(taskName);
    return Array.from(allDeps);
  }
  
  getGraphVisualization() {
    const lines = [];
    const visited = new Set();
    
    const printTask = (name, indent = 0) => {
      if (visited.has(name)) {
        lines.push('  '.repeat(indent) + `${name} (already shown)`);
        return;
      }
      
      visited.add(name);
      const task = this.tasks.get(name);
      
      if (!task) return;
      
      let line = '  '.repeat(indent) + name;
      if (task.modifiers.size > 0) {
        line += ` [${Array.from(task.modifiers).join(', ')}]`;
      }
      
      lines.push(line);
      
      for (const dep of task.dependencies) {
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
}