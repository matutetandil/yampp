# Changelog

All notable changes to Yam++ (Yet Another Modern Task Runner) will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
- **🔧 Internal Task Calls**: New `_call` syntax for invoking tasks internally
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
- **Internal Calls**: `_call task_name($var1, literal_value, $var2)`
- **Assignment**: `var_name = "new_value"` or `var_name = $other_var`

### Enhanced IDE Support
- **VS Code**: Updated TextMate grammar with new keywords (`const`, `var`, `_call`)
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
- **Call Execution**: Recursive task execution for `_call` statements
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