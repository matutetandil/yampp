# Changelog

All notable changes to the Yam++ VS Code extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.6.2] - 2025-08-27

### Added
- Support for environment variable declarations (`env VARIABLE_NAME`)
- Syntax highlighting for `_assign` internal function
- Updated publisher information to `matutetandil`

### Changed
- Updated internal function call syntax from `_call` to `__call`
- Improved syntax highlighting patterns for better recognition
- Version synchronized with Yam++ core v0.6.2

### Fixed
- Better variable and function recognition in syntax highlighting
- Improved token matching for internal functions

## [0.6.1] - 2025-08-27

### Added
- Initial VS Code extension release
- Complete syntax highlighting for Yamfile DSL
- Support for task modifiers (`always`, `serial`, `critical`)
- Support for task parameters and dependencies
- Support for variable declarations (`const`, `var`)
- Support for file watching patterns (`watches`)
- Support for comments (single-line and multi-line)
- Command palette integration
- Context menu commands
- Task provider for VS Code Tasks system
- Configuration options for task management

### Features
- Task execution from VS Code interface
- Automatic Yamfile detection and activation
- Code completion and hover providers
- Explorer sidebar integration
- Dependency graph visualization command

## [Unreleased]

### Planned
- Enhanced code completion with task parameter suggestions
- Real-time task execution status in status bar
- Integrated terminal for task output
- Task debugging capabilities
- Better error handling and diagnostics