# Advanced Features

Deep dive into Yampp's advanced capabilities and features.

## Table of Contents

- [Internal Functions System](#internal-functions-system)
- [Cooperative Control System](#cooperative-control-system)
- [Cross-Platform Shell Execution](#cross-platform-shell-execution)
- [File Watching System](#file-watching-system)
- [Professional Output Modes](#professional-output-modes)
- [Parameterized Tasks](#parameterized-tasks)
- [Task Modifiers](#task-modifiers)
- [Variable Scoping](#variable-scoping)
- [Execution Planning](#execution-planning)
- [Performance Optimization](#performance-optimization)

## Internal Functions System

### Overview

Internal functions are Yampp's built-in commands that provide enhanced functionality beyond simple shell execution. They enable interactive prompts, task orchestration, and cross-task communication.

### Available Functions

#### __call - Dynamic Task Execution

Execute other tasks dynamically with full parameter support:

```yamfile
deploy(env = "staging") {
    echo "Deploying to $env"
    __call build($env)
    __call test($env)
    
    # Conditional execution
    if [ "$env" = "production" ]; then
        __call backup_database
    fi
}

# Loop execution
batch_process {
    for i in 1 2 3 4 5; do
        __call process_item($i)
    done
}
```

#### __input - Interactive Text Input

Collect user input with validation and defaults:

```yamfile
configure {
    __input "Enter project name:" name "my-project"
    __input "Enter version:" version "1.0.0"
    
    # Input validation
    while [ -z "$name" ]; do
        __input "Name cannot be empty. Enter project name:" name
    done
    
    echo "Configuring $name v$version"
}
```

#### __input_password - Secure Password Input

Masked password input for sensitive data:

```yamfile
deploy_secure {
    __input "Username:" username
    __input_password "Password:" password
    __input_password "Confirm password:" password_confirm
    
    if [ "$password" != "$password_confirm" ]; then
        echo "Passwords don't match!"
        exit 1
    fi
    
    # Use credentials
    curl -u "$username:$password" https://api.example.com/deploy
}
```

#### __input_select - Multiple Choice Selection

Present options for user selection:

```yamfile
setup {
    __input_select "Choose database:" db ["postgres", "mysql", "sqlite"] "postgres"
    __input_select "Choose cache:" cache ["redis", "memcached", "none"] "redis"
    
    case "$db" in
        postgres)
            ./setup-postgres.sh
            ;;
        mysql)
            ./setup-mysql.sh
            ;;
        sqlite)
            touch database.sqlite
            ;;
    esac
}
```

#### __input_confirm - Yes/No Confirmation

Boolean confirmations with default values:

```yamfile
critical: destroy {
    __input_confirm "This will delete all data. Continue?" confirm "false"
    
    if [ "$confirm" = "true" ]; then
        rm -rf ./data
        echo "Data destroyed"
    else
        echo "Operation cancelled"
    fi
}
```

### CI/CD Mode

All input functions automatically use defaults in non-interactive environments:

```yamfile
deploy {
    # In CI/CD, automatically uses default "production"
    __input_select "Environment:" env ["dev", "staging", "production"] "production"
    
    # In CI/CD, automatically uses default "false"
    __input_confirm "Skip tests?" skip "false"
    
    if [ "$skip" != "true" ]; then
        __call test
    fi
    
    ./deploy.sh --env $env
}
```

## Cooperative Control System

### Bidirectional Variable Flow

Variables flow seamlessly between Yampp and shell scripts:

```yamfile
process {
    # Yampp to Shell
    __input "Enter value:" user_value "default"
    
    # Shell can use the variable
    echo "Processing $user_value"
    
    # Shell to Yampp
    export result="processed_$user_value"
    
    # Call another task with shell variable
    __call notify($result)
}

notify(message) {
    echo "Notification: $message"
}
```

### Advanced Shell Integration

```yamfile
@linux @mac: advanced_processing {
    # Define shell function
    process_file() {
        local file=$1
        echo "Processing $file"
        
        # Shell function can call Yampp tasks
        __call validate($file)
        
        # Continue with shell processing
        sed -i 's/old/new/g' "$file"
    }
    
    # Use shell features with Yampp integration
    for file in *.txt; do
        process_file "$file"
    done
}
```

### Variable Persistence

```yamfile
collect_info {
    __input "Project name:" project_name
    __input "Version:" version
    
    # Export for subsequent tasks
    export PROJECT="$project_name"
    export VERSION="$version"
}

build needs collect_info {
    # Variables available from previous task
    echo "Building $PROJECT v$VERSION"
    npm run build -- --project "$PROJECT" --version "$VERSION"
}
```

## Cross-Platform Shell Execution

### Platform Annotations

Define platform-specific implementations:

```yamfile
# Universal task (runs everywhere)
clean {
    echo "Cleaning build artifacts"
}

# Platform-specific implementations
@linux @mac: install {
    # Full bash power
    if [[ -f /etc/debian_version ]]; then
        sudo apt-get update
        sudo apt-get install -y build-essential
    elif [[ -f /etc/redhat-release ]]; then
        sudo yum groupinstall -y "Development Tools"
    elif command -v brew &> /dev/null; then
        brew install gcc
    fi
}

@windows: install {
    # Full PowerShell power
    if (Get-Command choco -ErrorAction SilentlyContinue) {
        choco install visualstudio2022buildtools -y
    } else {
        Write-Host "Please install Chocolatey first"
        exit 1
    }
}
```

### Complex Cross-Platform Scripts

```yamfile
@linux @mac: database_backup {
    #!/bin/bash
    set -e
    
    # Complex bash script
    DB_NAME="myapp"
    BACKUP_DIR="./backups"
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    
    mkdir -p "$BACKUP_DIR"
    
    # PostgreSQL backup with error handling
    if pg_dump "$DB_NAME" > "$BACKUP_DIR/backup_$TIMESTAMP.sql" 2>/dev/null; then
        echo "Backup successful: backup_$TIMESTAMP.sql"
        
        # Compress and encrypt
        gzip "$BACKUP_DIR/backup_$TIMESTAMP.sql"
        
        # Keep only last 5 backups
        ls -t "$BACKUP_DIR"/*.sql.gz | tail -n +6 | xargs -r rm
    else
        echo "Backup failed!" >&2
        exit 1
    fi
}

@windows: database_backup {
    # PowerShell equivalent
    $ErrorActionPreference = "Stop"
    
    $dbName = "myapp"
    $backupDir = ".\backups"
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    
    New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
    
    try {
        $backupFile = "$backupDir\backup_$timestamp.sql"
        pg_dump $dbName > $backupFile
        
        Write-Host "Backup successful: backup_$timestamp.sql"
        
        # Compress
        Compress-Archive -Path $backupFile -DestinationPath "$backupFile.zip"
        Remove-Item $backupFile
        
        # Keep only last 5 backups
        Get-ChildItem "$backupDir\*.zip" | 
            Sort-Object CreationTime -Descending | 
            Select-Object -Skip 5 | 
            Remove-Item
    }
    catch {
        Write-Error "Backup failed: $_"
        exit 1
    }
}
```

## File Watching System

### Advanced Watch Patterns

```yamfile
// Watch TypeScript files for compilation
compile watches src/**/*.ts !src/**/*.spec.ts {
    tsc
}

// Watch multiple patterns
test watches {
    src/**/*.ts
    tests/**/*.spec.ts
    package.json
} {
    jest
}

// Complex patterns with exclusions
docs watches {
    src/**/*.ts
    !src/**/*.test.ts
    !src/**/*.spec.ts
    README.md
    docs/**/*.md
} {
    typedoc --out docs/api src
}
```

### Conditional Rebuilds

```yamfile
// Only rebuild if source is newer than output
build watches src/**/*.js output: dist/bundle.js {
    webpack --mode production
}

// Multiple output files
compile watches src/**/*.ts output: {
    dist/index.js
    dist/types.d.ts
} {
    tsc
}
```

### Watch with Dependencies

```yamfile
// Chain of watched tasks
styles watches src/styles/**/*.scss {
    sass src/styles:dist/css
}

scripts watches src/**/*.js {
    webpack
}

build needs styles scripts watches {
    src/**/*
    public/**/*
} {
    echo "Full build complete"
}
```

## Professional Output Modes

### Claude Code Interface (Default)

Professional animated interface with intelligent features:

```bash
yampp build test deploy
```

Features:
- ✅ Real-time task blocks with spinners
- ✅ Live execution timers
- ✅ Smart output truncation (6 lines max)
- ✅ Parallel task visualization
- ✅ Automatic collapse on completion
- ✅ Color-coded status indicators

### Verbose Mode

Full output without collapse:

```bash
yampp --verbose build
```

Features:
- All output lines shown
- No truncation or collapse
- Task boundaries clearly marked
- Good for debugging

### Verbose-Ugly Mode

Raw output with timestamps and PIDs:

```bash
yampp --verbose-ugly test
```

Output format:
```
[2024-01-20 10:15:23.456] [PID:12345] [build] Starting task
[2024-01-20 10:15:23.789] [PID:12345] [build] Compiling source...
```

### Quiet Mode

Minimal output:

```bash
yampp --quiet deploy
```

Shows only:
- Errors
- Critical warnings
- Final status

### Ugly Mode

Completely raw output:

```bash
yampp --ugly build
```

Features:
- No formatting
- No colors
- Direct shell output
- Suitable for piping

## Parameterized Tasks

### Advanced Parameter Patterns

```yamfile
// Optional parameters with defaults
deploy(env = "staging", version = "latest", dry_run = "false") {
    if [ "$dry_run" = "true" ]; then
        echo "[DRY RUN] Would deploy $version to $env"
    else
        ./deploy.sh --env "$env" --version "$version"
    fi
}

// Variadic parameters (using shell arrays)
process_files(pattern = "*.txt") {
    for file in $pattern; do
        echo "Processing $file"
        __call validate($file)
    done
}

// Complex parameter handling
build_component(name, config = "default", flags = "") {
    echo "Building component: $name"
    echo "Configuration: $config"
    
    if [ -n "$flags" ]; then
        npm run build:$name -- --config $config $flags
    else
        npm run build:$name -- --config $config
    fi
}
```

### Parameter Inheritance

```yamfile
// Parent task with parameters
parent(env) {
    echo "Parent running in $env"
    __call child($env, "additional_param")
}

// Child receives parameters
child(env, extra) {
    echo "Child: env=$env, extra=$extra"
}

// Dependency parameters
deploy needs build(production) test(integration) {
    echo "Deploying after production build and integration tests"
}
```

## Task Modifiers

### Combining Modifiers

```yamfile
// Multiple modifiers
always serial critical: backup {
    # Always runs (ignores cache)
    # Commands run sequentially
    # Failure stops entire build
    
    pg_dump db1 > backup1.sql
    pg_dump db2 > backup2.sql
    pg_dump db3 > backup3.sql
}

// Modifier precedence
always: timestamp {
    date > timestamp.txt
}

serial: migrate needs backup {
    ./migrate-step1.sh
    ./migrate-step2.sh
    ./migrate-step3.sh
}
```

### Critical Tasks

```yamfile
critical: validate_environment {
    # This must succeed for build to continue
    if [ ! -f .env ]; then
        echo "ERROR: .env file missing"
        exit 1
    fi
    
    source .env
    
    if [ -z "$API_KEY" ]; then
        echo "ERROR: API_KEY not set"
        exit 1
    fi
}

build needs validate_environment {
    # Only runs if validation passes
    npm run build
}
```

## Variable Scoping

### Global vs Local Scope

```yamfile
// Global variables
var GLOBAL_VAR = "available everywhere"
const CONSTANT = "cannot be changed"

task1 {
    echo "Global: $GLOBAL_VAR"
    
    # Local variable
    var local_var = "only in task1"
    echo "Local: $local_var"
    
    # Modify global
    GLOBAL_VAR="modified"
}

task2 needs task1 {
    echo "Global: $GLOBAL_VAR"  # Shows "modified"
    echo "Local: $local_var"    # Undefined
}
```

### Environment Integration

```yamfile
// Read from environment
build {
    echo "NODE_ENV: $NODE_ENV"
    echo "USER: $USER"
    echo "PATH: $PATH"
}

// Set environment for child processes
test {
    export NODE_ENV="test"
    export DEBUG="app:*"
    
    npm test
}
```

## Execution Planning

### Dry Run Analysis

```bash
yampp --dry-run complex_deployment
```

Shows:
```
[DRY RUN] Execution Plan:
  1. validate_environment
  2. backup_database
  3. build(production) [parallel]
  4. test(integration) [parallel]
  5. migrate_database
  6. deploy_services
  7. health_check

Commands that would execute:
  - validate_environment: source .env && check_vars.sh
  - backup_database: pg_dump myapp > backup.sql
  ...
```

### Terraform-Style Planning

```bash
yampp --plan infrastructure
```

Output:
```
Yampp will perform the following actions:

  + create_vpc
  + create_subnets (depends on: create_vpc)
  ~ update_security_groups
  + deploy_instances (depends on: create_subnets)
  
Plan: 3 to create, 1 to update, 0 to destroy

Do you want to perform these actions? (yes/no):
```

## Performance Optimization

### Parallel Execution Control

```yamfile
// Limit parallelism for resource-intensive tasks
heavy_task1 {
    ./memory_intensive_process.sh
}

heavy_task2 {
    ./cpu_intensive_process.sh
}

// Run with limited parallelism
// yampp -j 2 heavy_task1 heavy_task2
```

### Smart Caching

```yamfile
// Cache expensive operations
expensive_computation {
    python calculate_dataset.py > results.json
}

// Force rebuild when needed
always: fresh_data {
    curl https://api.example.com/latest > data.json
}

// Conditional caching
build watches src/**/*.js cache: 1h {
    # Rebuilds if files change OR cache is older than 1 hour
    webpack
}
```

### Optimization Patterns

```yamfile
// Fail fast
validate {
    # Quick checks first
    [ -f package.json ] || exit 1
    [ -d src ] || exit 1
    
    # Then expensive checks
    npm audit
}

// Incremental builds
compile watches src/**/*.ts incremental {
    tsc --incremental
}

// Parallel test suites
test {
    __call test_unit &
    __call test_integration &
    __call test_e2e &
    wait
}
```

## Advanced Patterns

### Task Templates

```yamfile
// Reusable deployment template
deploy_service(service, port, replicas = "1") {
    echo "Deploying $service on port $port with $replicas replicas"
    
    docker build -t $service:latest ./$service
    docker run -d \
        --name $service \
        -p $port:$port \
        --replicas $replicas \
        $service:latest
}

// Use template
deploy_all {
    __call deploy_service(web, 8080, 3)
    __call deploy_service(api, 3000, 2)
    __call deploy_service(worker, 0, 5)
}
```

### Error Recovery

```yamfile
resilient_deploy {
    # Try primary deployment
    if ! __call deploy_primary; then
        echo "Primary failed, trying fallback"
        
        # Fallback strategy
        __call deploy_fallback
        
        # Notify about fallback
        __call send_alert("Deployed to fallback")
    fi
}
```

### Dynamic Task Generation

```yamfile
// Generate tasks based on discovery
process_all {
    # Discover services
    for service in services/*; do
        if [ -d "$service" ]; then
            name=$(basename "$service")
            __call process_service($name)
        fi
    done
}

process_service(name) {
    echo "Processing service: $name"
    cd "services/$name"
    __call build
    __call test
    __call deploy
}
```

## Best Practices

1. **Use internal functions** for user interaction
2. **Leverage platform annotations** for cross-platform support
3. **Implement proper error handling** with critical modifier
4. **Optimize with caching** and file watching
5. **Use parameters** for reusable tasks
6. **Combine modifiers** strategically
7. **Plan complex deployments** with --plan
8. **Debug with verbose modes** when needed
9. **Test with dry-run** before execution
10. **Document complex logic** with comments