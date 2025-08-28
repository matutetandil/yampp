# Yam++ (Yet Another Modern Task Runner)

![Version](https://img.shields.io/badge/version-0.7.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)
![npm](https://img.shields.io/badge/npm-package-red)

A modern, concurrent, declarative task runner with its own DSL, written in Node.js with ES6 modules. Yam++ provides parallel task execution by default, intelligent caching, and a clean, readable syntax for defining build tasks.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Basic Usage](#basic-usage)
- [Yamfile Syntax](#yamfile-syntax)
  - [Task Definition](#task-definition)
  - [Dependencies](#dependencies)
  - [Task Modifiers](#task-modifiers)
  - [Comments](#comments)
  - [Variables and Constants](#variables-and-constants)
  - [Environment Variables](#environment-variables)
  - [Internal Task Calls](#internal-task-calls)
  - [File Watching](#file-watching)
  - [Parameterized Tasks](#parameterized-tasks)
  - [Input Prompts](#input-prompts)
- [CLI Options](#cli-options)
- [Advanced Features](#advanced-features)
  - [Execution Modes](#execution-modes)
  - [Output Formats](#output-formats)
  - [Input Overrides](#input-overrides)
- [Translation Examples from Other Task Runners](#translation-examples-from-other-task-runners)
  - [AI-Powered Translation with yampp-translator](#ai-powered-translation-with-yampp-translator)
  - [Manual Translation Patterns](#manual-translation-patterns)
  - [Makefile → Yamfile](#makefile--yamfile)
  - [Gulp → Yamfile](#gulp--yamfile)
  - [npm scripts → Yamfile](#npm-scripts--yamfile)
- [Examples](#examples)
  - [Basic Build Pipeline](#basic-build-pipeline)
  - [Web Development Workflow](#web-development-workflow)
  - [Complex Project with Parameters](#complex-project-with-parameters)
  - [Interactive Build System](#interactive-build-system)
  - [CI/CD Pipeline](#cicd-pipeline)
  - [File Watching Example](#file-watching-example)
- [Working with Legacy Scripts](#working-with-legacy-scripts)
- [IDE Support](#ide-support)
  - [VS Code Extension](#vs-code-extension)
  - [IntelliJ Plugin](#intellij-plugin)
  - [AI-Powered Translation Tool](#ai-powered-translation-tool)
- [Development](#development)
  - [Project Structure](#project-structure)
  - [Building from Source](#building-from-source)
  - [Testing](#testing)
- [API Reference](#api-reference)
- [FAQ](#faq)
- [Troubleshooting](#troubleshooting)
- [Performance](#performance)
- [Contributing](#contributing)
- [License](#license)
- [Author](#author)
- [Links](#links)

## Features

- 🚀 **Concurrent by Default** - Executes tasks in parallel using worker threads
- 📝 **Custom DSL** - Clean, readable syntax for defining tasks and dependencies
- 🎯 **Smart Caching** - Tracks completed tasks to avoid redundant executions
- 🎨 **Claude Code Interface** - Professional output system with real-time task blocks, animated spinners, and intelligent collapse
- ✨ **Dynamic Task Visualization** - Live task blocks with timers, smart truncation, and multi-task parallel display
- 🔄 **Dependency Management** - Automatic dependency resolution with DAG validation
- ⚡ **Task Modifiers** - Support for `always`, `serial`, and `critical` task modifiers
- 📊 **Execution Summary** - Clear summary of completed and failed tasks
- ✅ **Syntax Validation** - Pre-execution syntax and semantic checking
- 🔌 **Complete IDE Ecosystem** - VS Code extension, IntelliJ plugin, and AI-powered translation tools
- 🤖 **AI-Powered Migration** - Intelligent translation from Makefile, Gulpfile, npm scripts with yampp-translator
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

### Environment Variables

Access system environment variables at runtime using the `env` keyword. Environment variables are evaluated when the task executes, making them perfect for CI/CD pipelines and deployment scripts.

#### Global Environment Variables

Declare environment variables globally for project-wide access:

```yamfile
// Global environment variables
env HOME
env USER
env PATH
env NODE_ENV

const PROJECT = "yam-plus-plus"

deploy(target) {
    echo "Deploying $PROJECT to $target"
    echo "Running as user: $USER"
    echo "Environment: $NODE_ENV"
}
```

#### Local Environment Variables

Declare environment variables within tasks for local access:

```yamfile
deploy(environment) {
    // Local environment variables
    env DATABASE_URL
    env API_SECRET_KEY
    env REDIS_URL
    
    echo "Deploying to: $environment"
    echo "Database: $DATABASE_URL"
    echo "Redis: $REDIS_URL"
    // API_SECRET_KEY available but not echoed for security
}
```

#### Runtime Evaluation

Environment variables are evaluated at execution time, not parse time:

```bash
# Set environment variables and run
NODE_ENV=production DATABASE_URL=postgres://prod yampp deploy:prod

# Different environment, different values
NODE_ENV=development DATABASE_URL=sqlite://dev.db yampp deploy:dev
```

#### Precedence Order

Variable resolution follows this precedence (highest to lowest):

1. **Task Parameters**: `yampp task:value`
2. **Local Environment Variables**: `env VAR` inside task
3. **Local Variables/Constants**: `var`/`const` inside task
4. **Global Environment Variables**: `env VAR` outside task
5. **Global Variables/Constants**: `var`/`const` outside task

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
- `__input "prompt" variable "default"` - Interactive text input with optional defaults
- `__input_password "prompt" variable` - Hidden password input with character masking  
- `__input_select "prompt" variable ["opt1", "opt2"] "default"` - Multiple choice selection
- `__input_confirm "prompt" variable "yes/no"` - Yes/no confirmation prompts

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

Yam++ has dedicated IDE extensions for enhanced development experience:

### VS Code Extension

**Repository:** [yampp-vscode-extension](https://github.com/matutetandil/yampp-vscode-extension)

Full VS Code support with:
- Complete syntax highlighting for Yamfile DSL
- Task execution and management commands
- Code completion and hover providers
- Support for latest features (env variables, internal functions)
- Integrated task provider for VS Code Tasks system

Install from VS Code marketplace or manually from the repository.

### IntelliJ Plugin

**Repository:** [yampp-intellij-plugin](https://github.com/matutetandil/yampp-intellij-plugin)

Professional IntelliJ IDEA plugin with:
- Comprehensive lexer and syntax highlighting
- Task execution and run configurations
- Structure view and code completion
- Tool window integration and line markers
- Support for all Yamfile DSL features

Install from JetBrains marketplace or build from source.

### AI-Powered Translation Tool

**Repository:** [yampp-translator](https://github.com/matutetandil/yampp-translator)

Dedicated AI-powered translation tool for migrating existing build systems to Yamfile format:

#### Features
- **9 AI Providers**: Ollama, Claude, OpenAI, Gemini, Mistral, DeepSeek, Hugging Face, Cohere, Grok
- **Multi-format support**: Makefile, Gulpfile, npm scripts
- **Smart conversion**: Preserves dependencies, adds modern patterns
- **Interactive enhancements**: Suggests internal functions for user input

#### AI Editor Agents
Specialized agents for seamless integration with AI-powered editors:
- **Claude Code** (`yampp-translation-agent.md`) - Self-contained agent
- **Cursor AI** (`cursor-yampp-agent.md`) - System prompt integration  
- **GitHub Copilot** (`copilot-yampp-instructions.md`) - Custom instructions
- **JetBrains** (`junie-yampp-guidelines.md`) - AI Assistant + Junie support

#### Installation & Usage
```bash
npm install -g yampp-translator
yampp-translator setup
yampp-translator translate Makefile
```

Or use AI editor agents for conversational, educational translation directly in your preferred editor.

**Ecosystem Integration**: The translator tool and AI agents work seamlessly with IDE extensions for a complete Yamfile development experience.

Both IDE extensions and the translation ecosystem are actively maintained and support all latest Yam++ features including environment variables, internal function calls, and parameterized tasks.

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

## Translation Examples from Other Task Runners

### 🤖 AI-Powered Translation with yampp-translator

For **automated migration assistance**, use **yampp-translator** - a dedicated AI-powered tool that intelligently converts build files to Yamfile format:

**Repository:** [yampp-translator](https://github.com/matutetandil/yampp-translator)

#### Universal AI Editor Support
yampp-translator provides specialized agents for all major AI-powered editors:

- **🤖 Claude Code**: Self-contained translation agent (`yampp-translation-agent.md`)
- **🎯 Cursor AI**: System prompt integration (`cursor-yampp-agent.md`) 
- **🚀 GitHub Copilot**: Custom instructions (`copilot-yampp-instructions.md`)
- **🧠 JetBrains IDEs**: AI Assistant + Junie guidelines (`junie-yampp-guidelines.md`)

#### AI Provider Support (9 Providers)
- **Local & Open Source**: Ollama, Hugging Face
- **Enterprise**: OpenAI (GPT-4), Claude, Google Gemini, Cohere
- **Specialized**: Mistral AI, DeepSeek, Grok (X AI)

#### Installation & Usage
```bash
# Install globally
npm install -g yampp-translator

# Interactive setup
yampp-translator setup

# Translate any build file
yampp-translator translate Makefile
yampp-translator translate gulpfile.js  
yampp-translator translate package.json

# Or use AI editor agents for conversational translation
```

#### Key Features
- ✅ **Smart conversion** with dependency preservation
- ✅ **Interactive enhancements** using internal functions (`__input`, `__call`, etc.)
- ✅ **Educational explanations** of translation decisions
- ✅ **Modern patterns** (file watching, parallel execution)
- ✅ **Zero-setup** experience with AI editor agents

### Manual Translation Patterns

For manual migration or understanding the conversion patterns, here are common examples:

### Makefile → Yamfile

#### Basic Build Pattern
**Before (Makefile):**
```makefile
.PHONY: clean build test install
CC=gcc
CFLAGS=-Wall -Wextra -std=c99

all: build

clean:
	rm -rf build/
	rm -f *.o

build: clean
	mkdir -p build/
	$(CC) $(CFLAGS) src/*.c -o build/myapp

test: build
	./build/myapp --test

install: build test
	cp build/myapp /usr/local/bin/
	chmod +x /usr/local/bin/myapp
```

**After (Yamfile):**
```yamfile
const CC = "gcc"
const CFLAGS = "-Wall -Wextra -std=c99"

all needs build {
    echo "Build complete"
}

always: clean {
    rm -rf build/
    rm -f *.o
}

build needs clean {
    mkdir -p build/
    $CC $CFLAGS src/*.c -o build/myapp
}

test needs build {
    ./build/myapp --test
}

install needs build test {
    cp build/myapp /usr/local/bin/
    chmod +x /usr/local/bin/myapp
}
```

#### Make with File Dependencies
**Before (Makefile):**
```makefile
build/myapp: src/*.c src/*.h Makefile
	mkdir -p build/
	gcc -Wall src/*.c -o build/myapp

clean:
	rm -rf build/
```

**After (Yamfile):**
```yamfile
build watches "src/*.c" "src/*.h" "Makefile" {
    mkdir -p build/
    gcc -Wall src/*.c -o build/myapp
}

always: clean {
    rm -rf build/
}
```

### Gulp → Yamfile

#### Series and Parallel Tasks
**Before (gulpfile.js):**
```javascript
const { src, dest, series, parallel, watch } = require('gulp');
const sass = require('gulp-sass');
const uglify = require('gulp-uglify');
const clean = require('gulp-clean');

function cleanTask() {
    return src('dist/*', {read: false})
        .pipe(clean());
}

function sassTask() {
    return src('src/scss/**/*.scss')
        .pipe(sass())
        .pipe(dest('dist/css'));
}

function jsTask() {
    return src('src/js/**/*.js')
        .pipe(uglify())
        .pipe(dest('dist/js'));
}

function watchTask() {
    watch('src/scss/**/*.scss', sassTask);
    watch('src/js/**/*.js', jsTask);
}

exports.clean = cleanTask;
exports.build = series(cleanTask, parallel(sassTask, jsTask));
exports.dev = series(cleanTask, parallel(sassTask, jsTask), watchTask);
exports.default = exports.build;
```

**After (Yamfile):**
```yamfile
all needs build {
    echo "Build complete"
}

always: clean {
    rm -rf dist/
}

// These run in parallel automatically
css needs clean watches "src/scss/**/*.scss" {
    sass src/scss/main.scss dist/css/main.css
}

js needs clean watches "src/js/**/*.js" {
    uglifyjs src/js/**/*.js -o dist/js/main.min.js
}

build needs clean css js {
    echo "Assets compiled"
}

// Serial task for development workflow
serial: dev needs build {
    echo "Development build complete"
    echo "Use file watching with 'watches' keyword instead of gulp.watch"
}
```

#### Gulp Streams and Pipes
**Before (gulpfile.js):**
```javascript
function buildStyles() {
    return src('src/sass/**/*.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(autoprefixer())
        .pipe(cleanCSS())
        .pipe(dest('dist/css'));
}

function buildScripts() {
    return src('src/js/**/*.js')
        .pipe(babel({presets: ['@babel/preset-env']}))
        .pipe(concat('main.js'))
        .pipe(uglify())
        .pipe(dest('dist/js'));
}
```

**After (Yamfile):**
```yamfile
styles watches "src/sass/**/*.scss" {
    sass src/sass/main.scss | autoprefixer | cleancss > dist/css/main.css
}

scripts watches "src/js/**/*.js" {
    babel src/js/**/*.js --presets=@babel/preset-env | concat main.js | uglifyjs > dist/js/main.js
    // Or use external tools:
    // npx babel src/js --out-file dist/js/main.js --presets=@babel/preset-env
    // npx uglifyjs dist/js/main.js -o dist/js/main.min.js
}
```

### npm scripts → Yamfile

#### Basic npm Scripts
**Before (package.json):**
```json
{
  "scripts": {
    "clean": "rm -rf dist/",
    "prebuild": "npm run clean",
    "build": "webpack --mode=production",
    "postbuild": "npm run optimize",
    "optimize": "terser dist/*.js -o dist/main.min.js",
    "test": "jest",
    "pretest": "npm run lint",
    "lint": "eslint src/",
    "dev": "webpack serve --mode=development",
    "start": "npm run build && npm run dev",
    "deploy": "npm run build && npm run test && aws s3 sync dist/ s3://my-bucket"
  }
}
```

**After (Yamfile):**
```yamfile
// Pre/post hooks become explicit dependencies
always: clean {
    rm -rf dist/
}

lint {
    eslint src/
}

build needs clean {
    webpack --mode=production
}

optimize needs build {
    terser dist/*.js -o dist/main.min.js
}

test needs lint {
    jest
}

dev needs clean {
    webpack serve --mode=development
}

start needs build {
    __call dev
}

deploy needs build test {
    aws s3 sync dist/ s3://my-bucket
}
```

#### Complex npm Workflow with Parallelization
**Before (package.json):**
```json
{
  "scripts": {
    "build:css": "sass src/styles:dist/css --style=compressed",
    "build:js": "webpack --entry=./src/index.js --output-path=dist/js",
    "build:assets": "npm-run-all --parallel build:css build:js",
    "build": "npm-run-all clean build:assets optimize",
    "clean": "rimraf dist",
    "optimize": "npm-run-all --parallel optimize:*",
    "optimize:css": "cleancss -o dist/css/main.min.css dist/css/*.css",
    "optimize:js": "terser dist/js/*.js -o dist/js/main.min.js",
    "test:unit": "jest",
    "test:e2e": "playwright test",
    "test": "npm-run-all --parallel test:*",
    "ci": "npm-run-all lint test build"
  }
}
```

**After (Yamfile):**
```yamfile
// Parallel by default - no need for npm-run-all
always: clean {
    rimraf dist
}

// These run in parallel automatically
build_css needs clean watches "src/styles/**/*.scss" {
    sass src/styles:dist/css --style=compressed
}

build_js needs clean watches "src/**/*.js" {
    webpack --entry=./src/index.js --output-path=dist/js
}

// Parallel dependencies
build_assets needs build_css build_js {
    echo "Assets built"
}

// These also run in parallel
optimize_css needs build_css {
    cleancss -o dist/css/main.min.css dist/css/*.css
}

optimize_js needs build_js {
    terser dist/js/*.js -o dist/js/main.min.js
}

optimize needs optimize_css optimize_js {
    echo "Assets optimized"
}

build needs build_assets optimize {
    echo "Build complete"
}

// Parallel tests
test_unit {
    jest
}

test_e2e {
    playwright test
}

test needs test_unit test_e2e {
    echo "All tests passed"
}

lint {
    eslint src/
}

ci needs lint test build {
    echo "CI pipeline complete"
}
```

### Advanced Migration Patterns

#### Conditional Execution
**Before (npm scripts):**
```json
{
  "scripts": {
    "deploy:dev": "cross-env NODE_ENV=development npm run deploy:base",
    "deploy:prod": "cross-env NODE_ENV=production npm run deploy:base",
    "deploy:base": "if [ \"$NODE_ENV\" = \"production\" ]; then npm run build:prod; else npm run build:dev; fi"
  }
}
```

**After (Yamfile):**
```yamfile
deploy(env) {
    if [ "$env" = "production" ]; then
        __call build_prod
    else
        __call build_dev
    fi
}

build_dev {
    NODE_ENV=development webpack --mode=development
}

build_prod {
    NODE_ENV=production webpack --mode=production --optimize-minimize
}
```

#### Environment-Specific Configurations
**Before (Multiple package.json files):**
```json
// package.json
{
  "scripts": {
    "build": "npm run build:$NODE_ENV",
    "build:development": "webpack --config webpack.dev.js",
    "build:staging": "webpack --config webpack.staging.js", 
    "build:production": "webpack --config webpack.prod.js"
  }
}
```

**After (Yamfile):**
```yamfile
env NODE_ENV

build(environment) {
    const config_file = "webpack.$environment.js"
    webpack --config $config_file
}

// Usage: yampp build:development, yampp build:production
// Or with env var: NODE_ENV=staging yampp build:staging
```

### Key Migration Benefits

1. **Explicit Dependencies**: No more guessing pre/post hook order
2. **Built-in Parallelization**: Automatic parallel execution without npm-run-all
3. **File Watching**: Native incremental builds without gulp.watch
4. **Parameter Support**: Dynamic task configuration without environment variable juggling  
5. **Better Error Handling**: Critical tasks and proper exit codes
6. **Cross-Platform**: No need for cross-env or rimraf
7. **IDE Support**: Syntax highlighting and task execution
8. **Validation**: Pre-execution checking of dependencies and syntax

### Migration Checklist

- [ ] Identify pre/post hooks and convert to explicit dependencies
- [ ] Replace npm-run-all parallel tasks with natural Yam++ parallelization
- [ ] Convert gulp.watch patterns to `watches` file dependencies
- [ ] Transform environment-specific scripts to parameterized tasks
- [ ] Add `always` modifier to clean tasks
- [ ] Use `serial` modifier for database migrations or deployment steps
- [ ] Add `critical` modifier to essential deployment tasks
- [ ] Leverage variables and constants for configuration management

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
│   ├── output-manager.js # Advanced output handling
│   ├── input-manager.js  # Interactive input system
│   ├── state.js        # Cache management
│   └── internal-functions/  # Strategy pattern for extensibility
│       ├── registry.js      # Function registry
│       ├── base-function.js # Abstract base class
│       ├── input-function.js
│       ├── input-password-function.js
│       ├── input-select-function.js
│       ├── input-confirm-function.js
│       └── call-function.js
└── examples/
    └── Interactive-Example.yamfile
```

### Architecture Highlights

**Strategy Pattern**: Internal functions use the Strategy pattern for maximum extensibility:
- Each `__function` has its own class implementing `BaseInternalFunction`
- `InternalFunctionRegistry` manages all strategies dynamically
- Easy to add new functions without modifying core runner
- Perfect for plugin architecture (future enhancement)

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
- GitHub: [@matutetandil](https://github.com/matutetandil)

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

### 🎨 Claude Code Interface (Default)

**Revolutionary output system inspired by Claude Code's professional interface:**

```bash
yampp build test deploy
```

**Live Execution Display:**
```
→ Executing tasks: build, test, deploy
→ Executing 3 task instance(s) with max 10 parallel job(s)

⠹ build [1.2s]
  Building project...
  Compiling sources...

⠴ test [0.8s]
  Running unit tests...
  Running integration tests...

⠦ deploy [2.1s]
  Uploading to server...
  Configuring services...
```

**On Task Completion:**
```
✅ build Completed [1.8s]
✅ test Completed [1.2s] 
❌ deploy Failed [2.1s]
  Uploading to server...
  Configuring services...
  Error: Connection timeout

Execution Summary:
✓ 2 tasks completed successfully
✗ 1 task failed
  ✗ deploy: Command failed: curl -X POST ...
Total: 3 tasks in 2.15s
```

**Key Features:**
- **🎯 Real-time Task Blocks**: Live task visualization with animated spinners
- **⏱️ Live Timers**: Real-time duration tracking for each task
- **📝 Smart Output Truncation**: Maximum 6 lines per task to prevent information overload
- **✨ Intelligent Collapse**: Successful tasks collapse to single lines, failed tasks stay expanded for debugging
- **🎭 Multi-task Display**: Multiple task blocks shown simultaneously during parallel execution
- **🎨 Professional Typography**: Consistent emojis, bold text, and color coding
- **📊 Detailed Summary**: Comprehensive execution summary with specific error details

### 📊 Additional Output Modes

**Verbose Mode (`-v`)**: Shows command execution within task blocks
**Quiet Mode (`-q`)**: Completely silent execution

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

- [GitHub Repository](https://github.com/matutetandil/yampp)
- [npm Package](https://www.npmjs.com/package/yampp)
- [Documentation](https://github.com/matutetandil/yampp#readme)
- [yampp-translator](https://github.com/matutetandil/yampp-translator) - AI-powered translation tool with 9 AI providers and universal editor agents
- [VS Code Extension](https://github.com/matutetandil/yampp-vscode-extension)
- [IntelliJ Plugin](https://github.com/matutetandil/yampp-intellij-plugin)