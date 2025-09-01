# API Reference

Complete API reference for Yampp programmatic usage and extension.

## Table of Contents

- [CLI API](#cli-api)
- [Node.js API](#nodejs-api)
- [Internal Functions API](#internal-functions-api)
- [Plugin API](#plugin-api)
- [Parser API](#parser-api)
- [Runner API](#runner-api)
- [State Management API](#state-management-api)
- [Output Manager API](#output-manager-api)
- [Shell Proxy API](#shell-proxy-api)
- [File Watcher API](#file-watcher-api)

## CLI API

### Command Line Interface

```bash
yampp [options] [tasks...]
```

### Options

| Option | Alias | Description | Default |
|--------|-------|-------------|---------|
| `--help` | `-h` | Show help | - |
| `--version` | `-v` | Show version | - |
| `--file` | `-f` | Specify Yamfile path | `./Yamfile` |
| `--jobs` | `-j` | Max parallel jobs | CPU count |
| `--force` | - | Ignore cache | `false` |
| `--continue` | `-k` | Continue on error | `false` |
| `--dry-run` | `-n` | Preview without execution | `false` |
| `--plan` | - | Show execution plan | `false` |
| `--quiet` | `-q` | Minimal output | `false` |
| `--verbose` | - | Show all output | `false` |
| `--ugly` | - | Raw output format | `false` |
| `--verbose-ugly` | - | Raw with timestamps | `false` |
| `--yes` | `-y` | Auto-confirm prompts | `false` |
| `--clean` | - | Clean cache | - |
| `--list` | - | List available tasks | - |
| `--graph` | - | Show dependency graph | - |

### Commands

#### Default Task Execution

```bash
# Run default task
yampp

# Run specific tasks
yampp build test deploy

# Run with parameters
yampp build:production test:e2e
```

#### Task Management

```bash
# List all tasks
yampp list
yampp --list

# Show dependency graph
yampp graph
yampp --graph

# Clean cache
yampp clean
yampp --clean
```

#### Execution Control

```bash
# Limit parallelism
yampp -j 2 task1 task2 task3

# Force execution (ignore cache)
yampp --force build

# Continue on error
yampp --continue test1 test2 test3

# Dry run
yampp --dry-run deploy
yampp -n deploy

# Show plan
yampp --plan complex_task
```

#### Output Control

```bash
# Quiet mode
yampp --quiet build
yampp -q build

# Verbose mode
yampp --verbose test

# Raw output
yampp --ugly compile

# Raw with timestamps
yampp --verbose-ugly debug
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `YAMPP_FILE` | Default Yamfile path | `./Yamfile` |
| `YAMPP_CACHE_DIR` | Cache directory | `./.taskrunner` |
| `YAMPP_MAX_PARALLEL` | Default parallelism | CPU count |
| `YAMPP_OUTPUT_MODE` | Default output mode | `claude` |
| `YAMPP_SHELL` | Shell override | System default |
| `DEBUG` | Debug output | - |

```bash
# Enable debug output
DEBUG=yampp:* yampp build

# Override cache directory
YAMPP_CACHE_DIR=/tmp/yampp-cache yampp clean

# Set default parallelism
YAMPP_MAX_PARALLEL=4 yampp build test
```

## Node.js API

### Installation

```bash
npm install yampp
```

### Basic Usage

```javascript
const yampp = require('yampp');

// Parse Yamfile
const tasks = await yampp.parse('./Yamfile');

// Execute task
await yampp.run('build', {
    verbose: true,
    maxParallel: 4
});

// Execute multiple tasks
await yampp.runAll(['build', 'test'], {
    force: true
});
```

### Core API

#### yampp.parse(filepath)

Parse a Yamfile and return task definitions.

```javascript
const tasks = await yampp.parse('./Yamfile');
console.log(tasks);
// Returns: Map of task names to task objects
```

#### yampp.run(taskName, options)

Execute a single task.

```javascript
await yampp.run('build', {
    verbose: false,
    force: false,
    dryRun: false,
    maxParallel: 4,
    continueOnError: false
});
```

#### yampp.runAll(taskNames, options)

Execute multiple tasks.

```javascript
await yampp.runAll(['clean', 'build', 'test'], {
    maxParallel: 2
});
```

#### yampp.validate(filepath)

Validate Yamfile syntax without execution.

```javascript
try {
    await yampp.validate('./Yamfile');
    console.log('Valid Yamfile');
} catch (error) {
    console.error('Validation error:', error.message);
}
```

#### yampp.getTaskGraph(filepath)

Get task dependency graph.

```javascript
const graph = await yampp.getTaskGraph('./Yamfile');
console.log(graph.nodes); // Task list
console.log(graph.edges); // Dependencies
```

### Advanced Usage

```javascript
const { Parser, Runner, TaskManager } = require('yampp');

// Custom parser options
const parser = new Parser({
    strict: true,
    allowDeprecated: false
});

const ast = await parser.parse(yamfileContent);

// Custom runner
const runner = new Runner({
    maxParallel: 2,
    outputMode: 'verbose',
    shell: '/bin/zsh'
});

// Build task manager
const taskManager = new TaskManager(ast);
const tasks = taskManager.getTasks();

// Execute with custom runner
await runner.execute(tasks.get('build'));
```

## Internal Functions API

### Creating Custom Internal Functions

```javascript
const { BaseInternalFunction, InternalFunctionRegistry } = require('yampp');

class CustomFunction extends BaseInternalFunction {
    static metadata = {
        name: '__custom',
        description: 'Custom function description',
        parameters: [
            { name: 'param1', required: true },
            { name: 'param2', required: false, default: 'default' }
        ]
    };
    
    async execute(args, context) {
        const [param1, param2 = 'default'] = args;
        
        // Access task context
        const { taskName, variables, stateManager } = context;
        
        // Perform operation
        console.log(`Custom function in ${taskName}: ${param1}, ${param2}`);
        
        // Set variable
        context.variables.set('custom_result', 'value');
        
        return { success: true };
    }
    
    validateArgs(args) {
        if (args.length === 0) {
            throw new Error('At least one argument required');
        }
    }
}

// Register function
InternalFunctionRegistry.register('__custom', CustomFunction);
```

### Built-in Functions Reference

#### CallFunction

```javascript
class CallFunction {
    async execute(args, context) {
        const [taskName, ...params] = args;
        return await context.runner.executeTask(taskName, params);
    }
}
```

#### InputFunction

```javascript
class InputFunction {
    async execute(args, context) {
        const [prompt, varName, defaultValue] = args;
        const value = await this.promptUser(prompt, defaultValue);
        context.variables.set(varName, value);
        return { value };
    }
}
```

## Plugin API

### Creating a Plugin

```javascript
class YamppPlugin {
    constructor(yampp) {
        this.yampp = yampp;
        this.name = 'my-plugin';
        this.version = '1.0.0';
    }
    
    // Lifecycle hooks
    async initialize() {
        console.log('Plugin initializing');
    }
    
    async beforeParse(content) {
        // Modify content before parsing
        return content;
    }
    
    async afterParse(ast) {
        // Modify AST after parsing
        return ast;
    }
    
    async beforeTask(task, context) {
        console.log(`Before task: ${task.name}`);
    }
    
    async afterTask(task, result, context) {
        console.log(`After task: ${task.name}, success: ${result.success}`);
    }
    
    // Register custom functions
    getFunctions() {
        return {
            '__plugin_func': PluginFunction
        };
    }
    
    // Register custom commands
    getCommands() {
        return {
            'plugin-command': this.handleCommand.bind(this)
        };
    }
    
    async handleCommand(args) {
        console.log('Plugin command executed:', args);
    }
}

// Register plugin
yampp.registerPlugin(new YamppPlugin());
```

### Plugin Configuration

```javascript
// In Yamfile
/*
plugins:
  - my-plugin:
      option1: value1
      option2: value2
*/

// In plugin
class YamppPlugin {
    constructor(yampp, config = {}) {
        this.config = config;
    }
}
```

## Parser API

### Parser Class

```javascript
const { Parser } = require('yampp');

const parser = new Parser({
    strict: false,           // Strict mode
    allowDeprecated: true,   // Allow deprecated syntax
    throwOnWarning: false    // Treat warnings as errors
});
```

#### Methods

##### parse(content, options)

```javascript
const ast = await parser.parse(yamfileContent, {
    filename: 'Yamfile',
    startRule: 'Yamfile'
});
```

##### validate(ast)

```javascript
const errors = parser.validate(ast);
if (errors.length > 0) {
    console.error('Validation errors:', errors);
}
```

### AST Structure

```javascript
// Task node
{
    type: 'TaskDefinition',
    name: 'build',
    modifiers: ['always', 'serial'],
    platforms: ['linux', 'mac'],
    parameters: [
        { name: 'env', default: 'dev', type: 'string' }
    ],
    dependencies: ['clean', 'compile'],
    watches: ['src/**/*.js'],
    commands: [
        { type: 'Command', text: 'npm run build' },
        { type: 'InternalFunction', name: '__call', args: ['test'] }
    ],
    location: { line: 10, column: 1 }
}

// Variable node
{
    type: 'VariableDeclaration',
    kind: 'var', // or 'const'
    name: 'BUILD_DIR',
    value: './dist',
    location: { line: 5, column: 1 }
}
```

## Runner API

### Runner Class

```javascript
const { Runner } = require('yampp');

const runner = new Runner({
    maxParallel: 4,
    continueOnError: false,
    force: false,
    dryRun: false,
    outputMode: 'claude',
    shell: '/bin/bash',
    cwd: process.cwd()
});
```

#### Methods

##### execute(task, context)

```javascript
const result = await runner.execute(task, {
    variables: new Map(),
    parameters: ['production'],
    parentTask: null
});
```

##### executeMultiple(tasks, options)

```javascript
const results = await runner.executeMultiple(tasks, {
    parallel: true,
    stopOnError: true
});
```

### Execution Context

```javascript
const context = {
    taskName: 'build',
    taskInstance: task,
    variables: new Map([
        ['VAR1', 'value1'],
        ['VAR2', 'value2']
    ]),
    parameters: ['param1', 'param2'],
    stateManager: stateManager,
    outputManager: outputManager,
    shellProxy: shellProxy,
    parentContext: null
};
```

## State Management API

### StateManager Class

```javascript
const { StateManager } = require('yampp');

const stateManager = new StateManager({
    cacheDir: './.taskrunner',
    ttl: 3600000 // 1 hour in milliseconds
});
```

#### Methods

##### isTaskComplete(taskName)

```javascript
const isComplete = await stateManager.isTaskComplete('build');
```

##### markTaskComplete(taskName)

```javascript
await stateManager.markTaskComplete('build');
```

##### clearCache()

```javascript
await stateManager.clearCache();
```

##### getTaskHistory(taskName)

```javascript
const history = await stateManager.getTaskHistory('build');
// Returns: Array of execution records
```

### Cache Structure

```javascript
// Cache entry
{
    taskName: 'build',
    completedAt: Date.now(),
    duration: 1234,
    exitCode: 0,
    variables: { /* snapshot */ },
    files: ['dist/app.js'],
    hash: 'abc123' // Content hash
}
```

## Output Manager API

### OutputManager Classes

```javascript
const { 
    ClaudeOutputManager,
    VerboseOutputManager,
    QuietOutputManager 
} = require('yampp');

const outputManager = new ClaudeOutputManager({
    colors: true,
    maxLines: 6,
    collapseDelay: 1000
});
```

#### Methods

##### startTask(taskName)

```javascript
outputManager.startTask('build');
```

##### updateTask(taskName, line)

```javascript
outputManager.updateTask('build', 'Compiling source...');
```

##### completeTask(taskName, success)

```javascript
outputManager.completeTask('build', true);
```

##### error(taskName, error)

```javascript
outputManager.error('build', new Error('Compilation failed'));
```

### Custom Output Manager

```javascript
class CustomOutputManager {
    constructor(options = {}) {
        this.options = options;
        this.tasks = new Map();
    }
    
    startTask(taskName) {
        this.tasks.set(taskName, {
            start: Date.now(),
            lines: []
        });
    }
    
    updateTask(taskName, line) {
        const task = this.tasks.get(taskName);
        task.lines.push(line);
        this.render();
    }
    
    completeTask(taskName, success) {
        const task = this.tasks.get(taskName);
        task.success = success;
        task.duration = Date.now() - task.start;
        this.render();
    }
    
    render() {
        // Custom rendering logic
    }
}
```

## Shell Proxy API

### ShellProxy Classes

```javascript
const { BashProxy, PowerShellProxy } = require('yampp');

const shellProxy = new BashProxy({
    shell: '/bin/bash',
    env: process.env,
    cwd: process.cwd(),
    timeout: 300000 // 5 minutes
});
```

#### Methods

##### execute(script, context)

```javascript
const result = await shellProxy.execute(script, {
    taskName: 'build',
    variables: new Map(),
    interceptHandler: async (func, args) => {
        // Handle internal function calls
    }
});
```

##### executeInteractive(script, handlers)

```javascript
await shellProxy.executeInteractive(script, {
    onStdout: (data) => console.log(data),
    onStderr: (data) => console.error(data),
    onIntercept: async (func, args) => {
        // Handle internal function
    }
});
```

### Custom Shell Proxy

```javascript
class CustomShellProxy {
    async execute(script, context) {
        // Custom shell execution
        const child = spawn(this.shell, ['-c', script]);
        
        // Handle output
        child.stdout.on('data', (data) => {
            this.processOutput(data, context);
        });
        
        // Handle intercepts
        child.stdout.on('data', (data) => {
            if (this.isIntercept(data)) {
                const { func, args } = this.parseIntercept(data);
                const response = await context.interceptHandler(func, args);
                child.stdin.write(response + '\n');
            }
        });
        
        return new Promise((resolve, reject) => {
            child.on('exit', (code) => {
                resolve({ code, success: code === 0 });
            });
        });
    }
}
```

## File Watcher API

### FileWatcher Class

```javascript
const { FileWatcher } = require('yampp');

const watcher = new FileWatcher({
    persistent: false,
    ignoreInitial: true,
    awaitWriteFinish: true
});
```

#### Methods

##### watch(patterns, callback)

```javascript
const unwatch = await watcher.watch(['src/**/*.js'], (event, path) => {
    console.log(`File ${event}: ${path}`);
});

// Stop watching
unwatch();
```

##### hasChanged(patterns, since)

```javascript
const changed = await watcher.hasChanged(
    ['src/**/*.js'],
    Date.now() - 3600000 // Last hour
);
```

##### getMatchingFiles(patterns)

```javascript
const files = await watcher.getMatchingFiles(['src/**/*.js', '!**/*.test.js']);
```

### Watch Patterns

```javascript
// Glob patterns
'*.js'              // All JS files in root
'src/**/*.ts'       // All TS files in src
'**/*.{js,jsx}'     // JS and JSX files
'!node_modules/**'  // Exclude node_modules

// Complex patterns
const patterns = [
    'src/**/*.js',
    'lib/**/*.js',
    '!**/*.test.js',
    '!**/*.spec.js'
];
```

## Error Handling

### Error Types

```javascript
const { 
    YamppError,
    ParseError,
    ValidationError,
    ExecutionError,
    TaskNotFoundError,
    CircularDependencyError
} = require('yampp');

// Handling errors
try {
    await yampp.run('build');
} catch (error) {
    if (error instanceof ParseError) {
        console.error('Parse error:', error.message);
        console.error('Location:', error.location);
    } else if (error instanceof ExecutionError) {
        console.error('Execution failed:', error.taskName);
        console.error('Exit code:', error.exitCode);
    }
}
```

### Custom Errors

```javascript
class CustomYamppError extends YamppError {
    constructor(message, details) {
        super(message);
        this.name = 'CustomYamppError';
        this.details = details;
    }
}
```

## Events

### Event Emitter

```javascript
const yampp = require('yampp');

// Task events
yampp.on('task:start', (taskName) => {
    console.log(`Starting: ${taskName}`);
});

yampp.on('task:complete', (taskName, result) => {
    console.log(`Completed: ${taskName}, success: ${result.success}`);
});

yampp.on('task:error', (taskName, error) => {
    console.error(`Error in ${taskName}:`, error);
});

// Output events
yampp.on('output:line', (taskName, line) => {
    console.log(`[${taskName}] ${line}`);
});

// Parse events
yampp.on('parse:start', (file) => {
    console.log(`Parsing: ${file}`);
});

yampp.on('parse:complete', (ast) => {
    console.log(`Parsed ${ast.tasks.length} tasks`);
});
```

## Debugging

### Debug Output

```javascript
// Enable debug output
process.env.DEBUG = 'yampp:*';

// Specific modules
process.env.DEBUG = 'yampp:parser,yampp:runner';

// In code
const debug = require('debug')('yampp:custom');
debug('Custom debug message');
```

### Inspection

```javascript
const { inspect } = require('yampp');

// Inspect task
const taskInfo = inspect.task('build');
console.log(taskInfo);

// Inspect dependencies
const deps = inspect.dependencies('deploy');
console.log(deps);

// Inspect variables
const vars = inspect.variables();
console.log(vars);
```