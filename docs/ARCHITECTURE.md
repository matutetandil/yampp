# Yampp Architecture

Technical architecture and design decisions for Yampp task runner.

## Table of Contents

- [Overview](#overview)
- [Core Components](#core-components)
- [Module Structure](#module-structure)
- [Execution Flow](#execution-flow)
- [Parser Architecture](#parser-architecture)
- [Task Management](#task-management)
- [Shell Integration](#shell-integration)
- [Internal Functions](#internal-functions)
- [Caching System](#caching-system)
- [Output Management](#output-management)
- [Cross-Platform Support](#cross-platform-support)
- [Design Patterns](#design-patterns)
- [Performance Considerations](#performance-considerations)

## Overview

Yampp is built with a modular architecture focusing on:
- **Concurrent execution** by default
- **Cross-platform compatibility** with native shell integration
- **Professional user experience** with real-time feedback
- **Extensibility** through internal functions and platform annotations

### Key Design Principles

1. **Separation of Concerns** - Each module has a single responsibility
2. **Strategy Pattern** - Pluggable implementations for different platforms/features
3. **Event-Driven** - Task execution and output handling via events
4. **Immutable State** - Task definitions are immutable after parsing
5. **Fail-Fast** - Early validation and error detection

## Core Components

### Component Diagram

```
┌─────────────┐
│   CLI       │ (bin/yampp.js)
└──────┬──────┘
       │
┌──────▼──────┐
│   Parser    │ (lib/parser.js)
└──────┬──────┘
       │
┌──────▼──────┐
│  Validator  │ (lib/validator.js)
└──────┬──────┘
       │
┌──────▼──────┐     ┌──────────────┐
│   Runner    │────▶│ Task Manager │ (lib/task.js)
└──────┬──────┘     └──────────────┘
       │
       ├────────────┬────────────┬─────────────┐
       │            │            │             │
┌──────▼──────┐ ┌──▼──────┐ ┌──▼──────┐ ┌────▼────┐
│Shell Proxy  │ │ State   │ │ Output  │ │Internal │
│             │ │ Manager │ │ Manager │ │Functions│
└─────────────┘ └─────────┘ └─────────┘ └─────────┘
```

## Module Structure

### Directory Layout

```
yampp/
├── bin/
│   └── yampp.js              # CLI entry point
├── lib/
│   ├── parser.js             # Peggy-based DSL parser
│   ├── validator.js          # Syntax and semantic validation
│   ├── task.js              # Task structures and DAG
│   ├── runner.js            # Concurrent task executor
│   ├── state.js             # Cache and state management
│   ├── output-manager.js    # Output formatting system
│   ├── file-watcher.js      # File change detection
│   ├── input-manager.js     # Interactive input handling
│   ├── internal-functions/  # Internal function implementations
│   │   ├── registry.js      # Function registry
│   │   ├── base.js         # Base class
│   │   ├── call-function.js
│   │   ├── input-function.js
│   │   └── ...
│   ├── shell-proxy/         # Shell execution strategies
│   │   ├── factory.js
│   │   ├── bash-strategy.js
│   │   └── powershell-strategy.js
│   └── shell-content/       # Shell content processors
│       ├── factory.js
│       ├── bash-content-processor.js
│       └── powershell-content-processor.js
├── grammar/
│   └── yamfile.pegjs        # Peggy grammar definition
└── examples/                # Example Yamfiles
```

### Module Responsibilities

| Module | Responsibility |
|--------|---------------|
| parser.js | Parse Yamfile syntax into AST |
| validator.js | Validate syntax and detect cycles |
| task.js | Task graph construction and management |
| runner.js | Concurrent task execution orchestration |
| state.js | Cache and completion tracking |
| output-manager.js | Professional UI rendering |
| file-watcher.js | File modification detection |
| shell-proxy/ | Platform-specific shell execution |
| internal-functions/ | Built-in function implementations |

## Execution Flow

### 1. Initialization Phase

```javascript
// Simplified flow
async function main() {
    // 1. Parse CLI arguments
    const args = parseArguments(process.argv);
    
    // 2. Load and parse Yamfile
    const ast = await parser.parse(yamfileContent);
    
    // 3. Validate syntax and semantics
    const validation = validator.validate(ast);
    
    // 4. Build task graph
    const taskGraph = TaskManager.buildGraph(ast);
    
    // 5. Initialize state manager
    await StateManager.initialize();
}
```

### 2. Task Resolution Phase

```javascript
// Task dependency resolution
class TaskManager {
    static resolveDependencies(taskName) {
        const visited = new Set();
        const order = [];
        
        function visit(name) {
            if (visited.has(name)) return;
            visited.add(name);
            
            const task = tasks.get(name);
            for (const dep of task.dependencies) {
                visit(dep);
            }
            order.push(name);
        }
        
        visit(taskName);
        return order;
    }
}
```

### 3. Execution Phase

```javascript
// Concurrent execution with p-limit
class Runner {
    async execute(tasks) {
        const limit = pLimit(this.maxParallel);
        const promises = tasks.map(task => 
            limit(() => this.executeTask(task))
        );
        
        await Promise.all(promises);
    }
    
    async executeTask(task) {
        // 1. Check cache
        if (await this.isCached(task)) return;
        
        // 2. Process shell content
        const processed = await this.processContent(task);
        
        // 3. Execute via shell proxy
        await this.shellProxy.execute(processed);
        
        // 4. Update cache
        await this.updateCache(task);
    }
}
```

## Parser Architecture

### Peggy Grammar Structure

```peggy
// Simplified grammar excerpt
Yamfile
  = Statement*

Statement
  = TaskDefinition
  / VariableDeclaration
  / Comment

TaskDefinition
  = modifiers:Modifiers?
    annotations:PlatformAnnotations?
    name:Identifier
    params:Parameters?
    deps:Dependencies?
    body:CommandBlock
```

### AST Generation

```javascript
// Example AST node for task
{
    type: 'TaskDefinition',
    name: 'build',
    modifiers: ['always', 'serial'],
    platforms: ['linux', 'mac'],
    parameters: [{name: 'env', default: 'dev'}],
    dependencies: ['clean', 'compile'],
    commands: [
        {type: 'Command', text: 'npm run build'},
        {type: 'InternalFunction', name: '__call', args: ['test']}
    ],
    location: {line: 10, column: 1}
}
```

### Error Reporting

```javascript
class Parser {
    parse(content) {
        try {
            return peggyParser.parse(content);
        } catch (error) {
            throw new SyntaxError({
                message: error.message,
                line: error.location.start.line,
                column: error.location.start.column,
                excerpt: this.getLineExcerpt(content, error.location)
            });
        }
    }
}
```

## Task Management

### Task Graph Construction

```javascript
class TaskGraph {
    constructor() {
        this.nodes = new Map();
        this.edges = new Map();
    }
    
    addTask(task) {
        this.nodes.set(task.name, task);
        this.edges.set(task.name, new Set(task.dependencies));
    }
    
    detectCycles() {
        const visited = new Set();
        const recursionStack = new Set();
        
        for (const node of this.nodes.keys()) {
            if (this.hasCycle(node, visited, recursionStack)) {
                return true;
            }
        }
        return false;
    }
}
```

### Dependency Resolution

```javascript
class DependencyResolver {
    static topologicalSort(graph) {
        const sorted = [];
        const visited = new Set();
        
        function visit(node) {
            if (visited.has(node)) return;
            visited.add(node);
            
            const deps = graph.edges.get(node) || new Set();
            for (const dep of deps) {
                visit(dep);
            }
            sorted.push(node);
        }
        
        for (const node of graph.nodes.keys()) {
            visit(node);
        }
        
        return sorted;
    }
}
```

## Shell Integration

### Cooperative Control System

The cooperative control system enables bidirectional communication between Yampp and native shells:

```javascript
// Shell Proxy Strategy Pattern
class BashStrategy {
    async execute(script, context) {
        // 1. Pre-process script with intercepts
        const processed = this.addIntercepts(script);
        
        // 2. Export variables to shell
        const exports = this.generateExports(context.variables);
        
        // 3. Execute with response handling
        const result = await this.runWithResponseHandling(
            exports + processed,
            context
        );
        
        // 4. Sync variables back
        this.syncVariables(result, context);
        
        return result;
    }
}
```

### Cross-Platform Execution

```javascript
// Platform detection and strategy selection
class ShellProxyFactory {
    static create(options) {
        const platform = os.platform();
        
        switch (platform) {
            case 'win32':
                return new PowerShellStrategy(options);
            case 'darwin':
            case 'linux':
                return new BashStrategy(options);
            default:
                throw new Error(`Unsupported platform: ${platform}`);
        }
    }
}
```

### Internal Function Interception

```javascript
// Intercept pattern for internal functions
class ShellContentProcessor {
    processContent(content) {
        // Detect internal function calls
        const pattern = /__(\w+)\s*\((.*?)\)/g;
        
        return content.replace(pattern, (match, func, args) => {
            // Generate intercept code
            return this.generateIntercept(func, args);
        });
    }
    
    generateIntercept(func, args) {
        // Platform-specific intercept generation
        return `
            echo "!YAMPP:INTERCEPT:${func}:${args}"
            read -r YAMPP_RESPONSE
            eval "$YAMPP_RESPONSE"
        `;
    }
}
```

## Internal Functions

### Registry Pattern

```javascript
// Function registry for extensibility
class InternalFunctionRegistry {
    static functions = new Map();
    
    static register(name, functionClass) {
        this.functions.set(name, functionClass);
    }
    
    static get(name) {
        const FunctionClass = this.functions.get(name);
        if (!FunctionClass) {
            throw new Error(`Unknown internal function: ${name}`);
        }
        return new FunctionClass();
    }
}

// Auto-registration
InternalFunctionRegistry.register('__call', CallFunction);
InternalFunctionRegistry.register('__input', InputFunction);
```

### Base Function Class

```javascript
class BaseInternalFunction {
    constructor() {
        if (new.target === BaseInternalFunction) {
            throw new Error('Cannot instantiate abstract class');
        }
    }
    
    // Abstract methods
    async execute(args, context) {
        throw new Error('Must implement execute method');
    }
    
    validateArgs(args) {
        throw new Error('Must implement validateArgs method');
    }
    
    getMetadata() {
        return {
            name: this.constructor.name,
            description: '',
            parameters: []
        };
    }
}
```

## Caching System

### Cache Structure

```javascript
class CacheManager {
    constructor() {
        this.cacheDir = '.taskrunner';
        this.doneFiles = new Map();
    }
    
    async isTaskCached(task) {
        // Check .done file
        const doneFile = path.join(this.cacheDir, `${task.name}.done`);
        
        // Check file watches if present
        if (task.watches) {
            const watchedChanged = await this.checkWatchedFiles(task);
            if (watchedChanged) return false;
        }
        
        return fs.existsSync(doneFile);
    }
    
    async markComplete(task) {
        const doneFile = path.join(this.cacheDir, `${task.name}.done`);
        await fs.writeFile(doneFile, Date.now().toString());
    }
}
```

### File Watching Integration

```javascript
class FileWatcher {
    async hasChanged(patterns, since) {
        const files = await this.glob(patterns);
        
        for (const file of files) {
            const stats = await fs.stat(file);
            if (stats.mtime > since) {
                return true;
            }
        }
        
        return false;
    }
}
```

## Output Management

### Claude Code Interface

```javascript
class ClaudeOutputManager {
    constructor() {
        this.taskBlocks = new Map();
        this.spinners = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    }
    
    startTask(taskName) {
        const block = {
            name: taskName,
            startTime: Date.now(),
            output: [],
            status: 'running'
        };
        
        this.taskBlocks.set(taskName, block);
        this.render();
    }
    
    render() {
        // Clear and redraw
        console.clear();
        
        for (const [name, block] of this.taskBlocks) {
            this.renderTaskBlock(block);
        }
    }
    
    renderTaskBlock(block) {
        const spinner = this.getSpinner(block.startTime);
        const elapsed = this.formatElapsed(block.startTime);
        
        console.log(`${spinner} ${block.name} ${elapsed}`);
        
        // Smart output truncation
        const output = this.truncateOutput(block.output);
        output.forEach(line => console.log(`  ${line}`));
    }
}
```

### Output Strategy Pattern

```javascript
class OutputStrategyFactory {
    static create(mode) {
        switch (mode) {
            case 'claude':
                return new ClaudeOutputManager();
            case 'verbose':
                return new VerboseOutputManager();
            case 'quiet':
                return new QuietOutputManager();
            case 'ugly':
                return new RawOutputManager();
            default:
                return new ClaudeOutputManager();
        }
    }
}
```

## Cross-Platform Support

### Platform Detection

```javascript
class PlatformDetector {
    static getCurrentPlatform() {
        const platform = os.platform();
        
        switch (platform) {
            case 'darwin':
                return 'mac';
            case 'win32':
                return 'windows';
            case 'linux':
                return 'linux';
            default:
                return 'unknown';
        }
    }
    
    static filterTasksByPlatform(tasks) {
        const currentPlatform = this.getCurrentPlatform();
        
        return tasks.filter(task => {
            if (!task.platforms || task.platforms.length === 0) {
                return true; // Universal task
            }
            return task.platforms.includes(currentPlatform);
        });
    }
}
```

### Shell Selection

```javascript
class ShellSelector {
    static getShell() {
        const platform = os.platform();
        
        if (platform === 'win32') {
            // Check for PowerShell Core first
            if (this.commandExists('pwsh')) {
                return 'pwsh';
            }
            return 'powershell';
        }
        
        // Unix-like systems
        return process.env.SHELL || '/bin/bash';
    }
}
```

## Design Patterns

### Strategy Pattern

Used extensively for pluggable implementations:

- **Shell Execution**: Different strategies for Bash/PowerShell
- **Output Management**: Different output formats
- **Internal Functions**: Each function as a strategy
- **Content Processing**: Platform-specific processors

### Factory Pattern

Creates appropriate implementations:

- **ShellProxyFactory**: Creates platform-specific proxies
- **OutputStrategyFactory**: Creates output managers
- **ContentProcessorFactory**: Creates content processors

### Registry Pattern

Manages extensible collections:

- **InternalFunctionRegistry**: Function registration
- **TaskRegistry**: Global task management
- **VariableRegistry**: Variable scope management

### Observer Pattern

Event-driven communication:

- **Task Events**: Start, progress, completion
- **Output Events**: Line received, error occurred
- **State Events**: Cache updates, variable changes

### Command Pattern

Encapsulates operations:

- **Task Commands**: Each task as a command
- **Internal Functions**: Function calls as commands

## Performance Considerations

### Concurrent Execution

```javascript
// P-limit for controlled parallelism
const limit = pLimit(maxParallel || os.cpus().length);

// Execute tasks with controlled concurrency
const promises = tasks.map(task => 
    limit(() => executeTask(task))
);
```

### Memory Management

- **Streaming Output**: Process output line-by-line
- **Lazy Loading**: Load tasks on demand
- **Cache Pruning**: Clean old cache entries
- **Buffer Limits**: Cap output buffer sizes

### Optimization Strategies

1. **Early Termination**: Fail fast on errors
2. **Smart Caching**: Skip unchanged tasks
3. **Parallel I/O**: Concurrent file operations
4. **Batch Operations**: Group similar operations
5. **Resource Pooling**: Reuse shell instances

### Benchmarks

| Operation | Time | Notes |
|-----------|------|-------|
| Parse 1000-line Yamfile | ~50ms | Peggy parser |
| Resolve 100 dependencies | ~5ms | DAG traversal |
| Execute 10 parallel tasks | ~task time | Overhead <10ms |
| Cache check (1000 files) | ~20ms | Parallel stat calls |

## Future Architecture Considerations

### Plugin System

```javascript
// Proposed plugin interface
class YamppPlugin {
    constructor(yampp) {
        this.yampp = yampp;
    }
    
    // Lifecycle hooks
    async beforeParse(content) {}
    async afterParse(ast) {}
    async beforeExecute(task) {}
    async afterExecute(task, result) {}
    
    // Register custom functions
    registerFunctions() {
        return {
            '__custom': CustomFunction
        };
    }
}
```

### Distributed Execution

- Remote task execution
- Distributed caching
- Cloud integration
- Container support

### Advanced Features

- Task templates
- Conditional execution rules
- Dynamic task generation
- External tool integration

## Security Considerations

### Input Sanitization

- Escape shell arguments
- Validate file paths
- Sanitize environment variables
- Prevent injection attacks

### Process Isolation

- Separate shell instances
- Limited environment exposure
- Controlled file access
- Sandboxed execution option

## Testing Architecture

### Unit Testing

- Parser tests with fixtures
- Validator edge cases
- Task graph algorithms
- Platform-specific behavior

### Integration Testing

- End-to-end task execution
- Cross-platform validation
- Performance benchmarks
- Error handling scenarios

## Conclusion

Yampp's architecture prioritizes:
- **Modularity** for maintainability
- **Extensibility** through patterns
- **Performance** via concurrency
- **User Experience** with professional output
- **Cross-Platform** native integration

The design allows for future growth while maintaining backward compatibility and performance.