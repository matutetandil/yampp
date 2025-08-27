# Changelog

All notable changes to Yam++ (Yet Another Modern Task Runner) will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.6.3] - 2025-08-27

### 🎯 Interactive Input Functions - Now Fully Implemented!

This release completes the implementation of all interactive input functions, transforming Yam++ into a fully interactive task runner suitable for setup wizards, deployment confirmations, and CI/CD pipelines.

### New Features

#### Complete Input Function Implementation
All internal input functions are now fully operational:

- **`__input`**: Text input with optional defaults
  ```yamfile
  __input "Enter your name:" username "John"
  ```

- **`__input_password`**: Secure password input with character masking
  ```yamfile
  __input_password "Database password:" db_pass
  ```

- **`__input_select`**: Multiple choice selection with array syntax
  ```yamfile
  __input_select "Choose environment:" env ["dev", "staging", "prod"] "staging"
  ```

- **`__input_confirm`**: Yes/no confirmation prompts
  ```yamfile
  __input_confirm "Deploy to production?" confirm "no"
  ```

#### CI/CD Compatibility
- **Automatic Non-Interactive Mode**: Detects CI environments and uses defaults
- **Input Overrides**: `--input variable=value` for complete automation
- **Graceful Fallbacks**: Uses defaults when available in non-interactive mode

#### Technical Improvements
- **Parser Enhancement**: Added `ArrayLiteral` support for `["opt1", "opt2"]` syntax
- **Unified Internal Functions**: All `__` functions now handled consistently
- **`__call` Consolidation**: Removed legacy `_call`, only `__call` exists now

### Fixed
- Parser now correctly handles array syntax in `__input_select`
- Internal functions no longer leak into command execution
- `__call` function now properly executes with parameters

### Examples
```yamfile
serial: interactive_deploy {
    __input "Version to deploy:" version "latest"
    __input_select "Target:" env ["dev", "staging", "prod"] "staging"
    __input_password "Deploy key:" key
    __input_confirm "Proceed?" confirm "no"
    
    if [ "$confirm" = "yes" ]; then
        __call deploy($env, $version)
        echo "Deployed $version to $env"
    fi
}
```

## [0.6.2] - 2025-08-26

### 🌱 New Feature: Environment Variables Support

This release adds native support for environment variables using the `env` keyword, providing seamless integration with system environment and CI/CD pipelines.

### New Features

#### Environment Variable Declarations
- **Global Environment Variables**: `env VARIABLE_NAME` at file level for project-wide access
- **Local Environment Variables**: `env VARIABLE_NAME` within tasks for scoped access
- **Runtime Evaluation**: Variables are resolved at execution time using `process.env`
- **CI/CD Integration**: Perfect for deployment scripts and environment-specific configuration

#### Syntax Examples
```yamfile
// Global environment variables
env NODE_ENV
env DATABASE_URL
env API_KEY

deploy(target) {
    // Local environment variables  
    env DEPLOY_TOKEN
    env CLUSTER_ENDPOINT
    
    echo "Deploying to $target environment: $NODE_ENV"
    echo "Database: $DATABASE_URL"
    echo "Cluster: $CLUSTER_ENDPOINT"
}
```

#### Variable Precedence System
Enhanced variable resolution with clear precedence order:
1. Task Parameters (`yampp task:value`)
2. Local Environment Variables (`env VAR` inside task)
3. Local Variables/Constants (`var`/`const` inside task)  
4. Global Environment Variables (`env VAR` outside task)
5. Global Variables/Constants (`var`/`const` outside task)

### Technical Implementation
- **Parser Enhancement**: Updated Peggy grammar with `GlobalEnvironmentVariable` and `LocalEnvironmentVariable` rules
- **Runtime Integration**: Environment variables evaluated using `process.env` during task execution
- **Task System**: Full integration with existing variable substitution system
- **Backward Compatibility**: Zero impact on existing Yamfiles

### Examples
```bash
# Set environment variables and execute
NODE_ENV=production API_URL=https://api.prod.com yampp deploy:production

# Different environment, different values
NODE_ENV=development API_URL=http://localhost:3000 yampp deploy:development
```

---

## [0.6.1] - 2025-08-26

### 🚀 Major Parser Enhancement: Universal Internal Function System

This release completes the internal function system with a revolutionary generic parser that enables unlimited extensibility while maintaining clean syntax.

### Enhanced Features

#### Universal Internal Function Parser
- **Generic Function Recognition**: Any function starting with `__` followed by a valid identifier is automatically recognized
- **Intelligent Parameter Parsing**: Functions accept mixed parameter types (strings, variables, identifiers, parameter groups)  
- **Line-Based Termination**: Functions automatically terminate at line end, just like bash commands
- **Zero Configuration**: No need to pre-define function signatures in the grammar

#### Parser Architecture Improvements  
- **Peggy Grammar Enhancement**: Simplified and robust grammar using `InlineSpace` for precise token parsing
- **Token-Based Parameters**: All parameters parsed as structured tokens for flexible interpreter handling
- **Backward Compatibility**: All existing DSL syntax continues to work unchanged
- **Performance Optimized**: Clean parsing without complex lookaheads or backtracking

#### Examples of New Flexibility
```yamfile
serial: deployment {
    __input "Enter username:" user
    __input_password "Enter password:" pwd  
    __input_select "Choose env:" env "dev" "staging" "prod"
    __call deploy_app($user, $env)
    __custom_log "Deployment" $user $env "success"
    __notify_slack "Deploy completed" "#deployments"
    echo "All done!"
}
```

### Technical Improvements
- **Grammar Simplification**: Reduced parser complexity while increasing capability
- **Extensibility**: New internal functions can be added without grammar changes
- **Error Handling**: Better error messages for malformed function calls
- **AST Consistency**: Clean, predictable Abstract Syntax Tree structure

### Fixed
- Fixed `__call` parsing with parenthesized parameters  
- Resolved multi-line function parameter consumption bug
- Corrected whitespace handling in function parameter parsing

### Migration Notes
- All existing `_call` references updated to `__call` (breaking change handled automatically)
- No syntax changes required for existing Yamfiles
- New internal functions can be implemented in the runner without parser modifications

---

## [0.6.0] - 2025-08-26

### 🎯 Revolutionary Feature: Interactive Input System

This release introduces a game-changing feature that sets Yam++ apart from all other task runners - a complete interactive input system with multiple input types, CI/CD compatibility, and secure password handling.

### New Features

#### Interactive Input Functions
- **`__input`**: Basic text input with optional defaults
  - Syntax: `__input "prompt" variable_name "default_value"`
  - Stores user input in task variables for immediate use
  
- **`__input_password`**: Secure password input with hidden characters
  - Input is masked with asterisks during typing
  - Perfect for database passwords, API keys, and sensitive data
  
- **`__input_confirm`**: Yes/no confirmation prompts
  - Smart validation ensures only yes/no answers
  - Configurable defaults (yes/no)
  - Returns "yes" or "no" string values
  
- **`__input_select`**: Multiple choice selection
  - Present options as a numbered list
  - Arrow indicator for default selection
  - Accept both number and text input

#### CI/CD Integration
- **Automatic CI Detection**: Detects common CI environments (Jenkins, GitHub Actions, GitLab CI, etc.)
- **Non-Interactive Mode**: Automatically uses defaults in CI environments
- **CLI Overrides**: New `--input key=value` option for non-interactive overrides
- **Safe Failures**: Clear error messages when required inputs lack defaults in CI

#### Implementation Details
- **Serial Task Requirement**: Input prompts require `serial` modifier to prevent concurrent prompts
- **Validation**: Compile-time validation ensures inputs only appear in serial tasks
- **Variable Scoping**: Input variables integrate seamlessly with existing variable system
- **Dry Run Support**: `--dry-run` shows what would be prompted without executing
- **Plan Support**: `--plan` indicates tasks with interactive inputs

### Technical Improvements
- **InputManager Class**: Centralized input handling with override support
- **Enhanced Parser**: Peggy grammar extended with input command support
- **Task Validation**: New validation rules for input usage
- **Runner Integration**: Seamless input processing during task execution

### Examples

```yamfile
serial: deploy {
    __input_select "Environment:" env ["dev", "staging", "prod"] "staging"
    __input "Version tag:" tag "latest"
    __input_password "Deploy key:" key
    __input_confirm "Proceed with deployment?" confirm "no"
    
    if [ "$confirm" = "yes" ]; then
        echo "Deploying $tag to $env..."
        // Use $key for authentication
    fi
}
```

### Usage
```bash
# Interactive mode
yampp deploy

# With CLI overrides
yampp deploy --input env=prod --input confirm=yes

# CI/CD mode (automatic defaults)
CI=true yampp deploy

# Dry run to preview
yampp --dry-run deploy
```

## [0.5.1] - 2025-08-25

### New Features: Multiple Execution Modes 🎭

- **🔍 Dry Run Mode (`--dry-run`, `-n`)**: Preview commands without execution
  - Shows exactly what commands would be executed
  - Respects cache state and displays "Skipped (cached)" for completed tasks
  - Perfect for validating execution plans and debugging
  - Integrates with file watching and all existing features

- **📋 Execution Plan Mode (`--plan`, `-p`)**: Terraform-style execution planning
  - Displays comprehensive execution plan with task dependencies
  - Shows task modifiers with visual indicators:
    - ⚡ Run / ⏭ Skip (cached) status
    - 🔄 Always run (ignores cache)
    - ⚠ Serial execution (no parallelism)
    - 🚨 Critical (failure stops all)
    - 🔗 File watching dependencies
  - Provides execution summary and statistics

- **🎭 Ugly Mode (`--ugly`, `-u`)**: Simple mixed output
  - Make-style mixed output with task prefixes
  - Immediate command output without fancy formatting
  - Perfect for debugging parallel execution and CI/CD environments
  - All task output appears in real-time with `[taskname]` prefixes

### Enhanced Output System
- **Multiple Output Modes**: Choose between organized (default), verbose, quiet, or ugly output
- **Improved CLI Options**: Consistent short flags for all modes (`-n`, `-p`, `-u`)
- **Better User Experience**: Clear help text with examples for all new modes
- **Defensive Code**: Robust handling of different task data structures and edge cases

### Technical Improvements
- **OutputManager Enhancement**: Added support for ugly mode with immediate output
- **CLI Integration**: Seamless integration of new modes with existing workflow
- **Error Handling**: Improved error handling in plan and dry-run modes
- **Performance**: Minimal overhead for execution planning and simulation

### Documentation
- **Updated README**: Comprehensive documentation for all execution modes
- **CLI Help**: Enhanced help text with practical examples
- **Usage Examples**: Clear examples showing when to use each mode

## [0.5.0] - 2025-08-21

### Major Changes
- **🎯 Parser Migration to Peggy**: Complete rewrite of parser using Peggy parser generator
  - Replaced fragile regex-based parser with robust BNF-style grammar
  - Professional-grade parsing with precise error messages (line and column)
  - Automatic AST generation with proper node types
  - Easier to extend and maintain grammar rules
  - Better debugging capabilities with visual grammar inspection

### Technical Improvements
- **Grammar Definition**: Created comprehensive `yamfile.pegjs` with full DSL specification
- **Error Handling**: Significantly improved error messages with exact location information
- **Maintainability**: Grammar is now readable and self-documenting
- **Performance**: Deterministic parsing without regex backtracking issues
- **Extensibility**: Adding new language features is now straightforward

### Fixed
- Parser no longer incorrectly captures variable declarations as tasks
- Resolved issues with multi-line content being greedily matched
- Fixed modifier parsing for colon syntax (e.g., `always:`)
- Improved handling of complex dependency chains with file watching

## [0.4.2] - 2025-08-21

### Changed
- **Keyword Consistency Fix**: Changed `watches` keyword to `watches` for consistency with existing `needs` syntax
  - Updated parser to use `watches` instead of `watch`
  - Updated all examples and documentation
  - Updated VS Code and IntelliJ IDE plugins
  - Maintains backward compatibility with file watching functionality

## [0.4.1] - 2025-08-21

### Major New Feature: File Watching 🎯
- **📁 Make-style File Dependencies**: Added `watches` keyword for file-based task dependencies
  - Tasks only re-execute when watched files are newer than cache
  - Supports single files, multiple files, and glob patterns
  - Seamless integration with existing task caching system
- **🔍 Intelligent File Checking**: Advanced timestamp comparison logic
  - Compares file modification times with task cache timestamps  
  - Automatic glob pattern expansion for complex file matching
  - Efficient file caching to minimize stat() calls
- **⚡ Incremental Builds**: Dramatically faster builds for large projects
  - Skip tasks when source files haven't changed
  - Perfect for TypeScript, CSS preprocessing, Docker builds
  - Compatible with existing `needs` dependencies

### Syntax Enhancements
- **File Watching Syntax**: `task watch "file1" "pattern/**/*" { ... }`
- **Combined Dependencies**: `task needs dep1 dep2 watch "src/**/*" { ... }`
- **Glob Pattern Support**: Full glob syntax with `**`, `*`, `?`, and `{}`
- **Quoted Patterns**: Support for both quoted and unquoted file patterns

### New Components
- **FileWatcher Class**: Comprehensive file timestamp and pattern matching
- **Enhanced StateManager**: Added `getTaskTimestamp()` for cache time comparison
- **Pattern Expansion**: Built-in glob support using `glob` library
- **Smart Caching**: File stat caching with 1-second TTL for performance

### IDE Support Updates
- **VS Code**: Added `watches` keyword highlighting and file pattern recognition
- **IntelliJ**: Enhanced lexer and syntax highlighter for `watches` syntax
- **Pattern Highlighting**: Special highlighting for file patterns and globs

### Parser & Validator Improvements
- **Enhanced Parser**: Updated regex to handle `watches` clauses in task definitions
- **File Pattern Validation**: Comprehensive validation of file patterns and paths
- **Smart Warnings**: Helpful warnings for potentially problematic patterns
- **Security Checks**: Validation for unsafe path patterns (`..`, absolute paths)

### Examples & Documentation
- **New Example File**: `File-Watching-Example.yamfile` with real-world scenarios
- **Updated Main Examples**: Added file watching to build and test tasks
- **Complete Documentation**: Comprehensive section on file watching in README
- **Practical Use Cases**: TypeScript compilation, CSS processing, Docker builds

### Performance Optimizations
- **File Stat Caching**: Reduces filesystem calls for better performance
- **Efficient Pattern Matching**: Optimized glob expansion and file checking
- **Smart Cache Integration**: Only checks files when cache exists

### Benefits Delivered
- **🚀 Faster Builds**: Only rebuild when necessary (like Make)
- **🎯 Precise Dependencies**: File-level granularity for task execution
- **🔄 Incremental Workflows**: Perfect for CI/CD and development workflows
- **⚙️ Developer Friendly**: Familiar Make-style semantics with modern features

## [0.4.0] - 2025-08-21

### Major New Features
- **🎯 Variables & Constants System**: Added comprehensive support for global and local variables/constants
  - `const` keyword for immutable constants
  - `var` keyword for mutable variables  
  - Global scope: declared outside tasks, available everywhere
  - Local scope: declared inside tasks, override global variables
  - Proper scoping rules similar to C/Java languages
- **🔧 Internal Task Calls**: New `__call` syntax for invoking tasks internally
  - Better control flow compared to dependency declarations
  - Pass computed variables and parameters to called tasks
  - Execute tasks conditionally within task logic
  - Handle task failures within calling context
- **📝 Variable Assignment**: Support for variable reassignment within tasks
  - Syntax: `variable_name = new_value`
  - Only variables (not constants) can be reassigned
  - Full variable substitution support

### Syntax Enhancements
- **Global Declarations**: `const PROJECT = "name"` and `var ENV = "dev"`
- **Local Declarations**: Variables/constants within task blocks
- **Internal Calls**: `__call task_name($var1, literal_value, $var2)`
- **Assignment**: `var_name = "new_value"` or `var_name = $other_var`

### Enhanced IDE Support
- **VS Code**: Updated TextMate grammar with new keywords (`const`, `var`, `__call`)
- **IntelliJ**: Enhanced lexer and syntax highlighter for all new language features
- **Syntax Highlighting**: Proper highlighting for variable declarations and internal calls

### Parser & Runtime Improvements
- **Enhanced Parser**: Complete rewrite of content parsing to handle variable declarations
- **Variable Scoping**: Implemented proper scoping with precedence rules
- **Validator Updates**: Comprehensive validation for variable references and assignments
- **Runner Enhancements**: Full variable substitution and internal call execution
- **Error Handling**: Better error messages for variable and calling issues

### Examples & Documentation
- **New Example File**: `Variables-Example.yamfile` with comprehensive variable usage
- **Updated Documentation**: Complete sections on variables, constants, and internal calls
- **Enhanced README**: Updated examples showcasing new features
- **Real-world Examples**: Practical CI/CD pipelines using variables and internal calls

### Technical Details
- **Variable Storage**: Maps for global/local variables and constants
- **Scoping Engine**: Hierarchical variable resolution (parameters > local > global)
- **Call Execution**: Recursive task execution for `__call` statements
- **Assignment Handling**: Runtime variable updates with validation
- **Substitution Engine**: Enhanced `$variable` substitution in commands and calls

### Breaking Changes
- **Parser API**: `parser.parse()` now returns `{tasks, globalVariables, globalConstants}`
- **Runner Constructor**: Now accepts global variables and constants as parameters
- **Validator Interface**: Updated to validate variables and constants

## [0.3.2] - 2025-08-21

### Added
- **Multi-line Comments**: Support for C/Java/PHP-style multi-line comments `/* ... */`
- **Enhanced IDE Support**: Updated both VS Code and IntelliJ plugins with multi-line comment syntax highlighting
- **Complete IntelliJ Plugin**: Added comprehensive IntelliJ IDEA plugin with syntax highlighting, run configurations, and tool windows
- **Rich Documentation Comments**: Examples now include multi-line documentation comments explaining task purposes

### Changed
- Parser now handles both single-line (`//`) and multi-line (`/* */`) comments
- VS Code syntax highlighting updated to properly highlight multi-line comments
- IntelliJ plugin completely restructured with proper syntax highlighting components
- Examples updated to showcase both comment styles effectively

### Technical
- Enhanced comment removal logic in parser to preserve line numbers for error reporting
- Added complete IntelliJ Platform integration classes:
  - Lexer, Parser, and Syntax Highlighter
  - Run Configuration support
  - Tool Window and Structure View
  - Code completion and line markers (stubs)
- Updated TextMate grammar for VS Code with multi-line comment patterns

## [0.3.1] - 2025-08-21

### Improved
- **Enhanced Parameter Syntax**: Clarified distinction between literal values and variable references in dependency parameters
- **Clear Variable References**: Use `$variable` syntax to reference task parameters in dependencies
- **Literal Value Support**: Use plain text for literal string values in dependencies
- **Updated Examples**: All examples now use clear `$variable` vs literal syntax
- **Enhanced IDE Support**: Updated VS Code syntax highlighting to distinguish between `$variable` references and literal values

### Changed
- Dependencies now clearly distinguish between `dep($variable)` for variable references and `dep(literal)` for literal values
- Updated parser to handle new parameter passing syntax with type distinction
- Enhanced validator to properly validate variable references vs literal values
- Updated all documentation and examples to reflect clearer syntax

### Technical
- Enhanced parameter parsing to distinguish between literal and variable parameter types
- Improved validation for variable references in dependency parameters
- Updated VS Code TextMate grammar for better syntax highlighting of parameters

## [0.3.0] - 2025-08-20

### Added
- **Parameterized Tasks**: Tasks can now accept parameters using `task(param1, param2)` syntax
- **Variable Substitution**: Use `$variable` syntax in commands for parameter substitution
- **Parameter Passing**: Dependencies can receive parameters from parent tasks
- **Scope Management**: Each task instance has its own parameter scope (similar to C/Java)
- **CLI Parameter Support**: Execute tasks with parameters using `yampp task:param1:param2` syntax
- **Parameter Validation**: Comprehensive validation of parameter names, counts, and references
- **Enhanced Examples**: Added parameterized task examples in Yamfile

### Changed
- Updated parser to handle task parameter syntax `task(param1, param2)`
- Updated runner to support parameter passing between task dependencies
- Enhanced validator with parameter-specific validation rules
- Extended CLI to parse and validate task parameter calls

### Technical
- Added parameter and variable support to Task class
- Implemented execution plan builder for parameterized tasks
- Added variable substitution engine in runner
- Enhanced dependency resolution with parameter passing

## [0.2.1] - 2025-08-20

### Changed
- **BREAKING**: Updated DSL syntax to be cleaner and more intuitive
- Modifiers now use space-separated format: `always serial: task` instead of `[always, serial]: task`
- Dependencies now use space-separated format: `needs dep1 dep2` instead of `needs dep1, dep2`
- Updated parser to handle new syntax with improved regex
- Updated all examples and documentation
- Updated VS Code syntax highlighting for new format
- Added validation error for old bracket syntax with helpful migration message

## [0.2.0] - 2025-08-20

### Changed
- **BREAKING**: Complete rewrite from Rust to Node.js with ES6 modules
- Improved portability and ease of installation via npm
- CLI now follows Make-style syntax (yampp [tasks] instead of subcommands)
- Better syntax and semantic validation with detailed error messages

### Added
- Pre-execution syntax and semantic validation
- Comprehensive error reporting with line numbers
- Make-style CLI interface (yampp without args runs default task)
- VS Code extension stub with syntax highlighting and task execution
- IntelliJ IDEA plugin stub for IDE integration
- Support for 'all' as default task name
- Warning system for potentially dangerous commands
- Better validation for task names and dependencies

### Technical Changes
- Migrated from Rust to Node.js 18+ with ES modules
- Uses worker threads for parallel execution instead of tokio
- Replaced clap with Node.js parseArgs
- Uses chalk for colored output instead of colored crate
- Implemented with p-limit for concurrency control

## [0.1.0] - 2025-08-20 (Rust Version - Deprecated)

### Added
- Initial release of Yam++ task runner
- Custom DSL parser for Yamfile syntax
- Concurrent task execution with configurable parallelism (`-j` flag)
- Task dependency management with DAG validation
- Circular dependency detection
- Task state caching with `.done` files in `.yampp/` directory
- Task modifiers support:
  - `always`: Execute regardless of cache state
  - `serial`: Execute serially (not in parallel)
  - `critical`: Abort execution if task fails
- Colored output with task-specific prefixes
- CLI commands:
  - `run`: Execute tasks
  - `list`: List available tasks
  - `clean`: Remove all cached states
  - `graph`: Display dependency graph
- Comments support in Yamfile (using `//`)
- Command chaining with `&&` operator
- Comprehensive error handling and reporting
- Execution summary with success/failure statistics
- Example Yamfile with various task configurations
- Full test suite for all modules
- Documentation and README

### Technical Details
- Built with Rust edition 2021
- Uses `tokio` for async/concurrent execution
- `petgraph` for dependency graph management
- `clap` for CLI argument parsing
- `colored` for terminal output formatting
- `regex` for DSL parsing
- State persistence with JSON serialization

### Known Limitations
- No variable substitution in commands yet
- No conditional task execution
- No file watching mode
- Line numbers not shown in parse errors

## [Unreleased]

### Planned Features
- Variable substitution in commands
- Conditional task execution based on environment
- File watching mode for automatic task re-execution
- Better error messages with line numbers
- Dry-run mode
- Task groups/namespaces
- Configuration file support (`.yampprc`)
- Plugin system for custom task types
- Remote task execution
- Interactive mode with task selection