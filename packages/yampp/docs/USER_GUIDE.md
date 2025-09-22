# Yampp User Guide

A comprehensive guide to using Yampp - Yet Another Modern Task Runner.

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Basic Usage](#basic-usage)
- [Yamfile Syntax](#yamfile-syntax)
- [Task Definition](#task-definition)
- [Dependencies](#dependencies)
- [Task Modifiers](#task-modifiers)
- [Variables and Constants](#variables-and-constants)
- [Internal Functions](#internal-functions)
- [Parameterized Tasks](#parameterized-tasks)
- [File Watching](#file-watching)
- [Cross-Platform Support](#cross-platform-support)
- [CLI Options](#cli-options)
- [Execution Modes](#execution-modes)
- [Examples](#examples)

## Installation

### From npm Registry

```bash
npm install -g yampp
```

### From Source

```bash
git clone https://github.com/yourusername/yampp.git
cd yampp
npm install
npm install -g .
```

### System Requirements

- Node.js >= 18.0.0
- npm >= 9.0.0
- Bash (Linux/macOS) or PowerShell (Windows)

## Quick Start

1. Create a `Yamfile` in your project root:

```yamfile
build {
    echo "Building project..."
    npm run compile
}

test needs build {
    echo "Running tests..."
    npm test
}

deploy needs test {
    echo "Deploying..."
    ./deploy.sh
}
```

2. Run tasks:

```bash
# List available tasks
yampp list

# Run specific task
yampp build

# Run multiple tasks
yampp build test

# Run default task (if defined)
yampp
```

## Basic Usage

### Running Tasks

```bash
# Run single task
yampp taskname

# Run multiple tasks
yampp task1 task2 task3

# Run with limited parallelism
yampp -j 2 build test deploy

# Dry run (preview without execution)
yampp --dry-run build

# Show execution plan
yampp --plan deploy
```

### Task Management

```bash
# List all tasks
yampp list

# Show dependency graph
yampp graph

# Clean cache
yampp clean

# Show help
yampp --help
```

## Yamfile Syntax

### Task Definition

Basic task structure:

```yamfile
taskname {
    command1
    command2
}
```

Task with dependencies:

```yamfile
taskname needs dep1 dep2 {
    echo "Running after dependencies"
}
```

### Dependencies

Dependencies are specified with the `needs` keyword:

```yamfile
compile {
    tsc
}

test needs compile {
    jest
}

deploy needs compile test {
    ./deploy.sh
}
```

### Task Modifiers

#### always

Always run, ignoring cache:

```yamfile
always: timestamp {
    date +%s > timestamp.txt
}
```

#### serial

Run commands sequentially within the task:

```yamfile
serial: migrate {
    npm run migrate:1
    npm run migrate:2
    npm run migrate:3
}
```

#### critical

Mark task as critical (affects error handling):

```yamfile
critical: database_backup {
    pg_dump mydb > backup.sql
}
```

Combined modifiers:

```yamfile
always serial: build_and_test {
    npm run clean
    npm run build
    npm run test
}
```

## Variables and Constants

### Global Variables

```yamfile
var BUILD_DIR = "./dist"
const VERSION = "1.0.0"

build {
    echo "Building version $VERSION"
    mkdir -p $BUILD_DIR
}
```

### Local Variables

```yamfile
test {
    var test_file = "test.spec.js"
    jest $test_file
}
```

### Environment Variables

Access environment variables directly:

```yamfile
deploy {
    echo "Deploying to $NODE_ENV"
    echo "User: $USER"
}
```

## Internal Functions

### __call - Call Other Tasks

```yamfile
build {
    echo "Building..."
    __call compile
    __call bundle
}
```

### __input - Text Input

```yamfile
deploy {
    __input "Enter deployment target:" target "production"
    echo "Deploying to $target"
}
```

### __input_password - Secure Password Input

```yamfile
login {
    __input "Username:" username
    __input_password "Password:" password
    curl -u $username:$password https://api.example.com/login
}
```

### __input_select - Multiple Choice

```yamfile
configure {
    __input_select "Choose environment:" env ["development", "staging", "production"] "development"
    echo "Configuring for $env"
}
```

### __input_confirm - Yes/No Confirmation

```yamfile
critical: delete_all {
    __input_confirm "Are you sure you want to delete everything?" confirm "false"
    if [ "$confirm" = "true" ]; then
        rm -rf ./data
    fi
}
```

## Parameterized Tasks

### Defining Parameterized Tasks

```yamfile
greet(name) {
    echo "Hello, $name!"
}

build(env = "dev") {
    echo "Building for $env environment"
    npm run build:$env
}
```

### Calling Parameterized Tasks

From command line:

```bash
yampp greet:World
yampp build:production
```

From other tasks:

```yamfile
deploy needs build(production) {
    echo "Deploying production build"
}

test {
    __call greet("Tester")
}
```

### Advanced Parameter Usage

```yamfile
// Task with multiple parameters
process(file, format = "json", verbose = "false") {
    if [ "$verbose" = "true" ]; then
        echo "Processing $file as $format"
    fi
    ./process.sh --input $file --format $format
}

// Using in loops
batch_process {
    for file in *.txt; do
        __call process($file, "csv", "true")
    done
}
```

## File Watching

### Basic File Dependencies

```yamfile
// Rebuild if source files change
build watches src/**/*.ts {
    tsc
}

// Multiple watch patterns
test watches src/**/*.ts tests/**/*.spec.ts {
    jest
}
```

### Conditional Execution

Tasks with `watches` only run if:
1. Watched files have changed since last run
2. Task hasn't been completed in current session

### Watch Patterns

Supports glob patterns:
- `*.js` - All JavaScript files in root
- `src/**/*.ts` - All TypeScript files in src
- `{src,lib}/**/*` - All files in src and lib
- `!node_modules/**` - Exclude node_modules

## Cross-Platform Support

### Platform Annotations

```yamfile
// Linux/Mac specific
@linux @mac: build {
    ./build.sh
    chmod +x dist/app
}

// Windows specific
@windows: build {
    build.bat
    attrib +x dist\app.exe
}

// Universal task (runs on all platforms)
test {
    npm test
}
```

### Complex Platform-Specific Tasks

```yamfile
@linux @mac: install_deps {
    # Install using homebrew or apt
    if command -v brew &> /dev/null; then
        brew install postgresql
    elif command -v apt-get &> /dev/null; then
        sudo apt-get install postgresql
    fi
}

@windows: install_deps {
    # Install using chocolatey
    choco install postgresql
}
```

### Shell-Specific Features

```yamfile
@linux @mac: advanced_build {
    # Full bash features available
    function build_module() {
        local module=$1
        echo "Building $module"
        cd $module && npm run build
    }
    
    for module in core utils cli; do
        build_module $module
    done
}

@windows: advanced_build {
    # Full PowerShell features available
    function Build-Module {
        param($module)
        Write-Host "Building $module"
        Set-Location $module
        npm run build
    }
    
    @("core", "utils", "cli") | ForEach-Object {
        Build-Module $_
    }
}
```

## CLI Options

### Execution Control

```bash
# Limit parallelism
yampp -j 2 build test deploy

# Specify Yamfile
yampp -f build/Yamfile.prod deploy
```

### Output Control

```bash
# Quiet mode (minimal output)
yampp --quiet build

# Verbose mode (no collapse)
yampp --verbose test

# Ugly mode (raw output)
yampp --ugly compile

# Verbose-ugly (timestamps + PIDs)
yampp --verbose-ugly build
```

### Planning and Testing

```bash
# Dry run (show commands without executing)
yampp --dry-run deploy

# Show execution plan
yampp --plan complex_task

# Clean cache
yampp clean
```

## Execution Modes

### Dry Run Mode

Preview what would be executed without running:

```bash
yampp --dry-run deploy
```

Output shows:
- Task execution order
- Commands that would run
- Dependencies resolution
- No actual execution

### Plan Mode

Terraform-style execution planning:

```bash
yampp --plan deploy
```

Shows:
- Tasks to be executed
- Dependency graph
- Estimated parallelism
- Cache status

### Input Override Mode

Internal functions automatically use default values in CI/CD environments (non-interactive).

## Examples

### Basic Build Pipeline

```yamfile
clean {
    rm -rf dist/
}

compile needs clean {
    tsc
}

test needs compile {
    jest
}

build needs test {
    webpack --mode production
}

default needs build {
    echo "Build complete!"
}
```

### Web Development Workflow

```yamfile
var PORT = "3000"

install {
    npm install
}

dev needs install watches src/**/* {
    npm run dev -- --port $PORT
}

lint watches src/**/*.{js,jsx,ts,tsx} {
    eslint src/
}

format {
    prettier --write src/**/*
}

build needs lint {
    npm run build
}
```

### Docker Workflow

```yamfile
docker_build(tag = "latest") {
    docker build -t myapp:$tag .
}

docker_run(port = "8080") needs docker_build {
    docker run -p $port:8080 myapp:latest
}

docker_push needs docker_build(latest) {
    __input "Docker Hub username:" username
    __input_password "Docker Hub password:" password
    
    echo $password | docker login -u $username --password-stdin
    docker tag myapp:latest $username/myapp:latest
    docker push $username/myapp:latest
}
```

### Database Migration

```yamfile
critical serial: migrate {
    __input_confirm "Run database migrations?" confirm "true"
    
    if [ "$confirm" = "true" ]; then
        npm run migrate:latest
        echo "Migrations completed"
    else
        echo "Migrations skipped"
    fi
}

seed needs migrate {
    __input_select "Seed environment:" env ["dev", "test", "prod"] "dev"
    npm run seed:$env
}
```

### Multi-Platform Build

```yamfile
@linux @mac: build_native {
    # Unix build
    ./configure
    make -j4
    make install
}

@windows: build_native {
    # Windows build
    msbuild project.sln /p:Configuration=Release
    copy Release\*.exe dist\
}

package needs build_native {
    echo "Creating distribution package..."
    tar -czf dist.tar.gz dist/
}
```

## Tips and Best Practices

1. **Use descriptive task names**: `build_frontend` instead of `bf`
2. **Leverage parallelism**: Yampp runs independent tasks concurrently
3. **Use variables for configuration**: Makes Yamfiles more maintainable
4. **Add comments**: Document complex tasks and logic
5. **Use platform annotations**: For cross-platform compatibility
6. **Implement proper error handling**: Use `critical` modifier for important tasks
7. **Cache wisely**: Use `always` modifier only when necessary
8. **Organize with dependencies**: Create clear task hierarchies
9. **Use internal functions**: For better control flow and user interaction
10. **Test with dry-run**: Always test complex workflows with `--dry-run` first

## Troubleshooting

### Common Issues

**Task not found:**
- Check task name spelling
- Verify Yamfile is in current directory or use `-f` flag

**Circular dependency detected:**
- Review task dependencies
- Use `yampp graph` to visualize dependency tree

**Permission denied:**
- Ensure scripts have execute permissions
- Use appropriate shell commands for the platform

**Cache issues:**
- Run `yampp clean` to clear cache

**Platform-specific task not running:**
- Verify platform annotation syntax
- Check that task has implementation for current OS

### Debug Output

Enable debug output with:

```bash
DEBUG=yampp:* yampp build
```

## Next Steps

- Explore [Advanced Features](./ADVANCED_FEATURES.md)
- Read about [Architecture](./ARCHITECTURE.md)
- Learn [Migration from other tools](./MIGRATION_GUIDE.md)
- Check [API Reference](./API_REFERENCE.md)