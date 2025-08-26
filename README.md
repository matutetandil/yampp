# Yam++ (Yet Another Modern Task Runner)

![Version](https://img.shields.io/badge/version-0.6.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)
![npm](https://img.shields.io/badge/npm-package-red)

A modern, concurrent, declarative task runner with its own DSL, written in Node.js with ES6 modules. Yam++ provides parallel task execution by default, intelligent caching, and a clean, readable syntax for defining build tasks.

## Features

- 🚀 **Concurrent by Default** - Executes tasks in parallel using worker threads
- 📝 **Custom DSL** - Clean, readable syntax for defining tasks and dependencies
- 🎯 **Smart Caching** - Tracks completed tasks to avoid redundant executions
- 🎨 **Colored Output** - Beautiful, prefixed logs with task-specific colors
- 🔄 **Dependency Management** - Automatic dependency resolution with DAG validation
- ⚡ **Task Modifiers** - Support for `always`, `serial`, and `critical` task modifiers
- 📊 **Execution Summary** - Clear summary of completed and failed tasks
- ✅ **Syntax Validation** - Pre-execution syntax and semantic checking
- 🔌 **IDE Support** - VS Code extension and IntelliJ plugin available
- 🎛️ **Parameterized Tasks** - Tasks can accept parameters with variable substitution
- 🔄 **Parameter Passing** - Dependencies can receive parameters from parent tasks
- 💬 **Rich Comments** - Support for both single-line (`//`) and multi-line (`/* */`) comments
- 📦 **Variables & Constants** - Global and local variable declarations with proper scoping
- 🔧 **Internal Task Calls** - Call tasks internally using `__call` syntax for better control flow
- 📁 **File Watching** - Make-style file dependency checking with `watches` keyword
- 🔍 **Professional Parser** - Powered by Peggy parser generator for robust syntax parsing with precise error messages
- 🔎 **Dry Run Mode** - Preview commands without execution using `--dry-run`
- 📋 **Execution Planning** - Terraform-style execution plans with `--plan`
- 🎭 **Multiple Output Modes** - Choose between organized, verbose, quiet, or ugly output formats
- 🎯 **Interactive Input Prompts** - Revolutionary user input system with text, password, confirm, and select types
- 🤖 **CI/CD Compatible** - Automatic default handling in non-interactive environments
- 🔐 **Secure Password Input** - Hidden input for sensitive data

## Installation

### Global Installation (Recommended)

```bash
npm install -g yampp
```

### Local Installation

```bash
npm install --save-dev yampp
```

## Quick Start

1. Create a `Yamfile` in your project root:

```yamfile
build {
    npm run build
}

test needs build {
    npm test
}

always: clean {
    rm -rf dist/
}
```

2. Run tasks:

```bash
# Run default task (first task or 'all')
yampp

# Run specific task
yampp test

# Run task with parameters (using : separator)
yampp deploy:production
yampp db_backup:mydb:sql

# Run with limited parallelism
yampp -j 2 build test
```

## Usage

### CLI Syntax (Make-style)

```bash
# Run default task
yampp

# Run specific tasks
yampp build test deploy

# Run tasks with parameters
yampp deploy:staging
yampp build:debug test:unit

# Options
yampp -j 4 build        # Limit to 4 parallel jobs
yampp -l                # List all tasks
yampp -g                # Show dependency graph
yampp -c                # Clean cache
yampp -v build:release  # Verbose output
yampp -q build          # Quiet mode (suppress all output)
yampp -u build          # Ugly mode (mixed output, simple prefixes)
yampp -n test           # Dry run (show what would be executed)
yampp -p deploy         # Show execution plan (Terraform-style)
```

## DSL Syntax

### Basic Task

```yamfile
taskname {
    command1
    command2
}
```

### Task with Dependencies

```yamfile
taskname needs dep1 dep2 {
    command
}
```

### Task with Modifiers

```yamfile
modifier1 modifier2: taskname {
    command
}
```

### Available Modifiers

- `always` - Always execute, ignoring cache
- `serial` - Execute serially (not in parallel)
- `critical` - Task failure aborts entire execution

### Comments

Yam++ supports both single-line and multi-line comments:

```yamfile
// This is a single-line comment

/*
 * This is a multi-line comment
 * that can span multiple lines
 */

task {
    command // Inline comment
    /* Multi-line comment
       can also be used inline */
    another_command
}
```

### Command Chaining

```yamfile
task {
    command1 && command2 && command3
}
```

### Parameterized Tasks

```yamfile
// Task with parameters
deploy(env) {
    kubectl apply -f k8s/deployment-$env.yaml
}

// Task with multiple parameters
db_backup(database, format) {
    pg_dump --format=$format $database > backup.$format
}

// Task that passes parameters to dependencies
full_deploy(target_env, image_tag) needs docker_build($image_tag) deploy($target_env) {
    echo "Deployed $image_tag to $target_env"
}
```

## Examples

### Node.js Project

```yamfile
/*
 * Node.js Project Build Configuration with Variables
 * Demonstrates variables, constants, and internal task calls
 */

// Global constants and variables
const PROJECT_NAME = "my-node-app"
const VERSION = "2.1.0"
var NODE_ENV = "development"
var REGISTRY = "docker.io"

// Default task with variable usage
all {
    echo "Building $PROJECT_NAME v$VERSION"
    echo "Environment: $NODE_ENV"
    
    __call install
    __call build
    __call test
    
    echo "Build complete for $PROJECT_NAME!"
}

// Install dependencies
install {
    const INSTALL_CMD = "npm ci"
    echo "Installing dependencies..."
    $INSTALL_CMD
}

/* 
 * Build the project with environment-specific configuration
 */
build {
    var build_cmd = "npm run build"
    
    if [ "$NODE_ENV" = "production" ]; then
        build_cmd = "npm run build:prod"
    fi
    
    echo "Building with: $build_cmd"
    $build_cmd
}

// Run tests with dynamic configuration
test {
    const TEST_TIMEOUT = "30s"
    var test_config = "--coverage"
    
    if [ "$NODE_ENV" = "ci" ]; then
        test_config = "--ci --coverage --watchAll=false"
    fi
    
    echo "Running tests with timeout: $TEST_TIMEOUT"
    npm test $test_config --timeout=$TEST_TIMEOUT
}

// Lint code
always: lint {
    eslint src/ --fix
    prettier --write "src/**/*.{js,ts,json}"
}

/*
 * Docker operations with dynamic tagging
 */
docker_ops(environment) {
    const DOCKERFILE = "Dockerfile"
    var image_tag = "$PROJECT_NAME:$VERSION"
    var push_registry = "$REGISTRY"
    
    if [ "$environment" = "production" ]; then
        image_tag = "$push_registry/$PROJECT_NAME:$VERSION"
    fi
    
    echo "Building Docker image: $image_tag"
    docker build -f $DOCKERFILE -t $image_tag .
    
    if [ "$environment" = "production" ]; then
        echo "Pushing to registry: $push_registry"
        docker push $image_tag
    fi
}

/*
 * Full deployment pipeline
 * Uses internal calls for better control flow
 */
serial critical: deploy(target_env) {
    const DEPLOY_ID = "$(date +%Y%m%d_%H%M%S)"
    var k8s_namespace = "default"
    
    echo "=== Deployment Pipeline $DEPLOY_ID ==="
    echo "Target: $target_env"
    
    // Set environment-specific variables
    if [ "$target_env" = "production" ]; then
        NODE_ENV = "production"
        k8s_namespace = "prod"
    elif [ "$target_env" = "staging" ]; then
        NODE_ENV = "staging" 
        k8s_namespace = "staging"
    fi
    
    echo "Namespace: $k8s_namespace"
    
    // Execute pipeline steps with internal calls
    __call lint
    __call test
    __call build
    __call docker_ops($target_env)
    
    // Deploy to Kubernetes
    kubectl apply -f k8s/ --namespace=$k8s_namespace
    
    echo "=== Deployment $DEPLOY_ID Complete ==="
}

/*
 * Clean build artifacts
 * Always runs regardless of cache state
 */
always: clean {
    echo "Cleaning $PROJECT_NAME build artifacts..."
    rm -rf dist/ node_modules/.cache/
    rm -rf .yampp/
    docker system prune -f
}
```

### Multi-Language Project

```yamfile
// Frontend tasks
frontend_install {
    cd frontend && npm install
}

frontend_build needs frontend_install {
    cd frontend && npm run build
}

// Backend tasks
backend_build {
    cd backend && cargo build --release
}

backend_test needs backend_build {
    cd backend && cargo test
}

// Combined build
build needs frontend_build backend_build {
    echo "Full build complete"
}

// Docker operations
serial: docker needs build {
    docker-compose build
    docker-compose up -d
}
```

## Syntax and Semantic Validation

Yam++ performs comprehensive validation before execution:

### Syntax Validation
- Task name format checking
- Modifier validation
- Command structure verification
- Brace matching

### Semantic Validation
- Circular dependency detection
- Undefined dependency checking
- Duplicate task detection
- Dangerous command warnings

### Example Error Messages

```
Validation errors found:
  ✗ Circular dependency detected: build → test → lint → build
    at line 15: test needs build {
  ✗ Task 'deploy' depends on undefined task 'package'
    at line 22: deploy needs package {
  ✗ Task 'full_deploy' passes 1 parameter(s) to dependency 'build', but 'build' expects 0 parameter(s)
    at line 35: full_deploy(env) needs build($env) {
  ✗ Variable '$unknown' passed to dependency 'deploy' in task 'test_task' is not defined as a task parameter
    at line 42: test_task(env) needs deploy($unknown) {
```

## Parameters and Variables

Yam++ supports parameterized tasks with variable substitution, enabling reusable and configurable task definitions.

### Defining Parameterized Tasks

```yamfile
// Task with single parameter
deploy(env) {
    echo "Deploying to $env"
    kubectl apply -f k8s/deployment-$env.yaml
}

// Task with multiple parameters
backup_db(database, format, location) {
    pg_dump --format=$format $database > $location/backup-$database.$(format)
}
```

### Calling Parameterized Tasks

```bash
# Single parameter
yampp deploy:production

# Multiple parameters (colon-separated)
yampp backup_db:myapp:sql:/backups

# Multiple task calls with parameters
yampp deploy:staging backup_db:myapp:sql:/tmp
```

### Parameter Passing Between Tasks

Tasks can pass parameters to their dependencies:

```yamfile
// Dependencies receive parameters from the parent task  
full_deploy(env, tag) needs docker_build($tag) deploy($env) {
    echo "Deployed $tag to $env environment"
}

// Mixed parameter sources (literal + variable)
complex_task(target) needs build_image(v1.0) deploy_to($target) notify(slack) {
    echo "Used literal 'v1.0', variable '$target', and literal 'slack'"
}
```

### Syntax Rules

**Clear distinction between literal values and variables:**

```yamfile
// task(param1, param2) needs:
//   dep1(literal_value)    - Passes the literal string "literal_value"
//   dep2($param1)          - Passes the value of variable param1  
//   dep3(fixed, $param2)   - Mixed: literal "fixed" and variable param2

deploy_stack(env, version) needs build_image($version) deploy_k8s($env) notify(production-alerts) {
    echo "Deployed version $version to $env, notified production-alerts"
}
```

### Variable Scope Rules

Parameters follow scoping rules similar to C/Java:

1. **Task Parameters**: Available within the task that declares them using `$variable`
2. **Local Scope**: Each task instance has its own parameter values
3. **Parameter Passing**: 
   - `$variable` passes the parameter value
   - `literal` passes the literal string
4. **Variable Substitution**: Uses `$variable` syntax in both commands and dependencies

### Parameter Validation

The validator checks:
- Parameter name format (must be valid identifiers)
- Parameter count matching between tasks and their calls
- Duplicate parameter names within tasks
- Variable references (`$var`) exist as task parameters
- Literal values don't use reserved characters

## Variables and Constants

Yam++ supports both global and local variable declarations with proper scoping rules similar to modern programming languages.

### Global Declarations

Declare variables and constants outside of tasks for project-wide usage:

```yamfile
// Global constants (immutable)
const PROJECT_NAME = "my-awesome-app"
const VERSION = "2.1.0"
const DOCKER_REGISTRY = "registry.company.com"

// Global variables (mutable)  
var BUILD_ENV = "development"
var LOG_LEVEL = "info"
var TEMP_DIR = "/tmp/build"
```

### Local Declarations

Declare variables and constants within tasks for local scope:

```yamfile
deploy(environment) {
    const DEPLOY_TIMESTAMP = "$(date +%Y%m%d_%H%M%S)"
    var config_file = "config/dev.json"
    var replicas = "1"
    
    // Conditional variable assignment
    if [ "$environment" = "production" ]; then
        config_file = "config/prod.json"
        replicas = "3"
    fi
    
    echo "Deploying with config: $config_file"
    echo "Using $replicas replicas"
}
```

### Variable Scoping Rules

Variables follow C/Java-like scoping rules:

1. **Global Scope**: Variables declared outside tasks are available everywhere
2. **Local Scope**: Variables declared inside tasks override global ones
3. **Parameter Scope**: Task parameters have highest precedence
4. **Constants**: Once declared, constants cannot be reassigned

### Internal Task Calls

Use `__call` to invoke tasks internally instead of external dependencies:

```yamfile
full_deploy(env) {
    const PIPELINE_ID = "$(uuidgen)"
    var image_tag = "$VERSION-$(date +%H%M%S)"
    
    echo "Starting deployment pipeline: $PIPELINE_ID"
    
    // Call tasks internally with full control
    __call docker_build($image_tag)
    __call deploy_to($env)
    __call run_health_checks($env)
    __call send_notification("deployment-complete", $PIPELINE_ID)
    
    echo "Pipeline $PIPELINE_ID completed successfully"
}
```

### Benefits of `__call` vs Dependencies

- **Better Control Flow**: Execute tasks conditionally within logic
- **Variable Passing**: Pass computed variables to called tasks
- **Error Handling**: Handle task failures within the calling context
- **Cleaner Syntax**: No need to pre-declare all dependencies

### Internal Function System

Yam++ features a powerful and extensible internal function system. Any function starting with `__` followed by a valid identifier is recognized as an internal function, with parameters parsed as tokens for maximum flexibility.

#### Generic Function Syntax

```yamfile
// Generic pattern: __function_name param1 param2 param3...
// Functions terminate automatically at line end (like bash)

serial: example {
    __input "Enter your name:" username
    __input_password "Enter password:" pwd  
    __input_select "Choose environment:" env "dev" "staging" "prod"
    __call deploy($username, $env)
    __custom_function "param1" $variable (param, list)
    echo "Deployment completed by $username"
}
```

#### Supported Parameter Types

Internal functions accept various parameter token types:

- **String literals**: `"Hello World"` → `{ type: 'string', value: 'Hello World' }`
- **Variables**: `$name` → `{ type: 'variable', name: 'name' }`
- **Identifiers**: `build` → `{ type: 'identifier', value: 'build' }`
- **Parameter groups**: `($var1, $var2)` → `{ type: 'params', value: [...] }`

#### Built-in Internal Functions

- `__call taskname($params)` - Call tasks internally with parameters
- `__input "prompt" variable` - Interactive text input (future feature)
- `__input_password "prompt" variable` - Hidden password input (future feature)  
- `__input_select "prompt" variable "opt1" "opt2"` - Multiple choice (future feature)

#### Extensibility

The parser uses a generic approach - any `__function` is captured with its parameter tokens, allowing the runner/interpreter to:

1. **Validate** if the function exists
2. **Process** parameters according to function requirements  
3. **Execute** the function or provide helpful error messages
4. **Extend** functionality by adding new internal functions

This design makes Yam++ highly extensible while maintaining clean, readable syntax.

## Interactive Input System 🎯

**Revolutionary Feature**: Yam++ is the first task runner with built-in interactive prompts!

### Input Functions

Yam++ provides four input functions that **must be used in `serial` tasks** to prevent concurrent prompts:

#### Basic Text Input
```yamfile
serial: setup {
    __input "Project name:" project_name "my-app"
    echo "Creating project: $project_name"
}
```

#### Password Input (Hidden)
```yamfile
serial: secure_deploy {
    __input_password "Database password:" db_pass
    // Password is hidden during input
    PGPASSWORD=$db_pass pg_dump mydb > backup.sql
}
```

#### Yes/No Confirmation
```yamfile
serial: deploy {
    __input_confirm "Deploy to production?" confirm "no"
    if [ "$confirm" != "yes" ]; then
        echo "Deployment cancelled"
        exit 0
    fi
}
```

#### Multiple Choice Selection
```yamfile
serial: configure {
    __input_select "Environment:" env ["dev", "staging", "prod"] "dev"
    echo "Configuring for $env environment"
}
```

### CI/CD Integration

The input system is fully CI/CD compatible:

1. **Automatic Default Usage**: In CI environments (detected automatically), defaults are used
2. **CLI Overrides**: Override any input from command line:
   ```bash
   yampp deploy --input confirm=yes --input env=production
   ```
3. **Non-Interactive Mode**: Fails safely if no default provided in CI

### Example: Complete Deployment Workflow

```yamfile
serial: interactive_deploy {
    // Get deployment details
    __input_select "Target environment:" env ["dev", "staging", "prod"] "staging"
    __input "Docker tag:" tag "latest"
    __input_confirm "Enable maintenance mode?" maintenance "yes"
    
    // Get credentials securely
    __input_password "Admin password:" admin_pass
    
    // Final confirmation
    __input_confirm "Deploy $tag to $env?" proceed "no"
    
    if [ "$proceed" != "yes" ]; then
        echo "Deployment cancelled by user"
        exit 0
    fi
    
    // Execute deployment
    if [ "$maintenance" = "yes" ]; then
        echo "Enabling maintenance mode..."
        ./scripts/maintenance.sh on
    fi
    
    echo "Deploying $tag to $env..."
    docker pull myapp:$tag
    kubectl set image deployment/myapp app=myapp:$tag
    
    echo "Deployment complete!"
}
```

### Usage Modes

**Interactive Mode** (default):
```bash
yampp interactive_deploy
# You'll be prompted for each input
```

**With CLI Overrides**:
```bash
yampp interactive_deploy --input env=prod --input tag=v1.2.3 --input proceed=yes
```

**Dry Run** (see what would be prompted):
```bash
yampp --dry-run interactive_deploy
# Shows: → Prompt [select]: "Target environment:" → env (default: staging)
```

**CI/CD Mode** (automatic):
```bash
CI=true yampp interactive_deploy
# Uses all defaults, fails if required input has no default
```

## File Watching

Yam++ supports Make-style file dependency checking using the `watches` keyword. Tasks will only re-execute if watched files are newer than the cache, providing efficient incremental builds.

### Basic File Watching

Watch specific files or patterns:

```yamfile
// Watch a single file
setup watches ".env" {
    source .env
    echo "Environment loaded"
}

// Watch multiple files
build watches "src/main.js" "package.json" "webpack.config.js" {
    webpack --mode production
}

// Watch with glob patterns
compile watches "src/**/*.ts" "*.config.js" {
    tsc --build
}
```

### Combined Dependencies and File Watching

Use both task dependencies (`needs`) and file watching (`watches`):

```yamfile
// Depends on other tasks AND watches files
test needs build watches "src/**/*.js" "test/**/*.js" {
    jest --coverage
}

// Deploy only if configs changed
deploy needs build test watches "k8s/**/*.yaml" "docker/Dockerfile" {
    docker build -t myapp .
    kubectl apply -f k8s/
}
```

### How File Watching Works

1. **First Run**: Task executes normally and cache is created
2. **Subsequent Runs**: 
   - If no watched files → check cache (skip if cached)
   - If watched files exist → compare file timestamps with cache
   - If any file is newer than cache → re-execute task
   - If all files are older than cache → skip (use cache)

### File Patterns

Supports various file pattern formats:

```yamfile
build watches "src/**/*.ts"           # Recursive TypeScript files
      watches "*.json"                # All JSON files in current dir  
      watches "docs/**/*.md"          # All Markdown in docs
      watches "config/dev.yml"        # Specific file
      watches "assets/**/*.{png,jpg}" # Multiple extensions
{
    echo "Building with updated files..."
}
```

### Practical Examples

```yamfile
// TypeScript compilation
compile_ts watches "src/**/*.ts" "tsconfig.json" {
    tsc --project tsconfig.json
}

// CSS processing  
process_css watches "src/**/*.scss" "postcss.config.js" {
    postcss src/main.scss -o dist/main.css
}

// Docker builds
docker_build needs compile_ts watches "Dockerfile" ".dockerignore" {
    docker build -t myapp:latest .
}

// Documentation generation
docs watches "src/**/*.ts" "docs/**/*.md" "typedoc.json" {
    typedoc src/index.ts --out docs/api
}
```

### Benefits of File Watching

- **Incremental Builds**: Only rebuild when source files change
- **Faster Execution**: Skip unnecessary work automatically  
- **Make Compatibility**: Familiar semantics for developers
- **Glob Support**: Flexible pattern matching for complex projects
- **Cache Integration**: Works seamlessly with existing task caching

## IDE Support

### VS Code Extension

Install from VS Code marketplace:
```
ext install yampp-vscode
```

Features:
- Syntax highlighting
- Code completion
- Task execution from editor
- Hover documentation
- Code lens for running tasks

### IntelliJ Plugin

Install from JetBrains marketplace or search for "Yam++ Task Runner" in IDE plugins.

Features:
- Syntax highlighting
- Task execution
- Structure view
- Code completion
- Run line markers

## Parallelism and Performance

### Default Behavior
- Tasks run in parallel by default
- Maximum jobs = CPU cores

### Controlling Parallelism
```bash
# Limit to 2 parallel jobs
yampp -j 2

# Sequential execution
yampp -j 1

# Unlimited parallelism
yampp -j 0
```

### Task-Level Control
```yamfile
// This task always runs alone
serial: database_migration {
    npm run migrate
}

// These tasks can run in parallel
parallel_task1 {
    npm run task1
}

parallel_task2 {
    npm run task2
}
```

## Caching

Tasks are cached in `.yampp/` directory. Each successful task creates a `.done` file.

### Cache Behavior
- Cached tasks are skipped on subsequent runs
- Dependencies of cached tasks still execute if needed
- `[always]` modifier bypasses cache

### Managing Cache
```bash
# Clean all cache
yampp -c

# Force re-run with always modifier
always: build {
    npm run build
}
```

## Advanced Features

### Critical Tasks
```yamfile
critical: database_backup {
    pg_dump mydb > backup.sql
}
```
If a critical task fails, execution stops immediately.

### Conditional Execution
```yamfile
production_only {
    test "$NODE_ENV" = "production" && npm run prod-task
}
```

### Multi-Command Tasks
```yamfile
complex_task {
    echo "Starting complex task"
    npm install
    npm run build && npm test
    echo "Task complete"
}
```

## Configuration

### Environment Variables
- `YAMPP_JOBS` - Default number of parallel jobs
- `YAMPP_NO_COLOR` - Disable colored output
- `YAMPP_VERBOSE` - Enable verbose output

## Development

### Project Structure
```
yampp/
├── bin/
│   └── yampp.js        # CLI entry point
├── lib/
│   ├── parser.js       # Peggy-based DSL parser
│   ├── yamfile.pegjs   # Peggy grammar definition
│   ├── task.js         # Task and DAG management
│   ├── validator.js    # Syntax/semantic validation
│   ├── runner.js       # Task executor
│   ├── file-watcher.js # File watching implementation
│   └── state.js        # Cache management
├── vscode-extension/   # VS Code extension
├── intellij-plugin/    # IntelliJ plugin
└── examples/
    └── Yamfile         # Example configuration
```

### Running Tests
```bash
npm test
```

### Contributing
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Author

**Matias Denda**
- Email: matutetandil@gmail.com
- GitHub: [@matiasdenda](https://github.com/matiasdenda)

## Execution Modes

Yam++ offers multiple execution modes to suit different workflows and debugging needs:

### 🔍 Dry Run Mode (`--dry-run`, `-n`)

Preview exactly what commands would be executed without making any changes:

```bash
yampp --dry-run build test
```

**Output:**
```
🔍 Dry Run Mode - No commands will be executed

→ Would execute tasks: build, test
→ Would execute 3 task instance(s) with max 10 parallel job(s)

[build] Would execute:
[build] → echo "Building project..."
[build] → npm run build

[test] Would execute:
[test] → Skipped (cached)
```

Perfect for:
- Validating task execution order
- Checking cache behavior
- Debugging complex dependency chains
- Ensuring commands are correct before execution

### 📋 Execution Plan Mode (`--plan`, `-p`)

View a Terraform-style execution plan showing task dependencies and modifiers:

```bash
yampp --plan deploy
```

**Output:**
```
📋 Execution Plan

Plan Summary:
  Tasks to run: deploy
  Total task instances: 4
  Max parallel jobs: 10

Execution Plan:
  1. build ⏭ Skip (cached)
  2. test ⚡ Run
     Dependencies: build
  3. package ⚡ Run
     Dependencies: build, test
     ⚠ Serial execution (no parallelism)
  4. deploy ⚡ Run
     Dependencies: package
     🚨 Critical (failure stops all)
     🔄 Always run (ignores cache)

Use --dry-run to see the actual commands that would be executed
```

Perfect for:
- Understanding execution flow before running
- Analyzing task dependencies
- Identifying performance bottlenecks
- Planning complex deployments

### 🎭 Ugly Mode (`--ugly`, `-u`)

Simple mixed output with task prefixes (like `make`):

```bash
yampp --ugly build test
```

**Output:**
```
[build] Starting...
[test] Starting...
[build] Building project...
[test] Running tests...
[build] Build complete!
[build] Completed (1.2s)
[test] All tests passed!
[test] Completed (0.8s)
```

Perfect for:
- Debugging parallel execution issues
- Simple CI/CD environments
- When you want immediate output without formatting

### 📊 Standard Output Modes

**Default Mode**: Organized blocks with clean separation
**Verbose Mode (`-v`)**: Shows detailed command output within organized blocks
**Quiet Mode (`-q`)**: Suppresses all output except errors

## Comparison with Other Tools

| Feature | Yam++ | Make | npm scripts | Just |
|---------|-------|------|-------------|------|
| Parallel execution | ✅ Default | ❌ Manual | ❌ | ❌ |
| Custom DSL | ✅ | ✅ | ❌ | ✅ |
| Cross-platform | ✅ | ⚠️ | ✅ | ✅ |
| Dependency graph | ✅ | ✅ | ❌ | ✅ |
| Syntax validation | ✅ | ❌ | ❌ | ❌ |
| IDE support | ✅ | ⚠️ | ⚠️ | ⚠️ |
| No binary deps | ✅ | ❌ | ✅ | ❌ |

## Troubleshooting

### Common Issues

**yampp: command not found**
```bash
# Ensure global installation
npm install -g yampp
```

**Permission denied**
```bash
# Fix npm permissions or use npx
npx yampp
```

**Task not found**
```bash
# List available tasks
yampp -l
```

## License

MIT

## Links

- [GitHub Repository](https://github.com/matiasdenda/yampp)
- [npm Package](https://www.npmjs.com/package/yampp)
- [Documentation](https://github.com/matiasdenda/yampp#readme)
- [VS Code Extension](https://marketplace.visualstudio.com/items?itemName=matiasdenda.yampp-vscode)
- [IntelliJ Plugin](https://plugins.jetbrains.com/plugin/yampp)