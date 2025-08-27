# Changelog

All notable changes to the Yam++ IntelliJ plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.6.2] - 2025-08-27

### Added
- Support for environment variable declarations (`env VARIABLE_NAME`)
- Syntax highlighting for `_assign` internal function
- Enhanced lexer with new token types for latest Yamfile features
- Complete syntax highlighting for all Yamfile DSL elements

### Changed
- Updated internal function call syntax from `_call` to `__call`
- Improved token recognition and syntax highlighting patterns
- Version synchronized with Yam++ core v0.6.2
- Updated documentation with comprehensive feature list and examples

### Fixed
- Better variable and function recognition in lexer
- Improved token matching for internal functions and assignments

## [0.1.0] - 2025-08-22

### Added
- Initial IntelliJ plugin implementation
- Basic file type support for Yamfile
- Lexer with FlexLexer for tokenization
- Syntax highlighting for core Yamfile elements:
  - Task definitions and modifiers (`always`, `serial`, `critical`)
  - Keywords (`const`, `var`, `needs`, `watches`)
  - Variable references (`$variable`)
  - Comments (line and block)
- Parser definition and PSI element structure
- Run configuration support for Yam++ tasks
- Run line marker contributors for task execution
- Code completion contributor framework
- Structure view factory for task navigation
- Tool window for task management
- Actions for task execution, listing, and cache cleaning
- Context menu integration

### Features
- Task execution from IDE with keyboard shortcut (Ctrl+Shift+Y)
- File type association for Yamfile and .yamfile extensions
- Basic plugin architecture with proper IntelliJ platform integration

### Technical
- Gradle build configuration with IntelliJ plugin support
- Compatible with IntelliJ IDEA 2023.3+
- Java-based implementation with full IntelliJ SDK integration

## [Unreleased]

### Planned
- Enhanced code completion with task parameter suggestions
- Real-time error highlighting and validation
- Task dependency graph visualization
- Debugger support for task execution
- Quick fixes and refactoring support
- Advanced documentation provider
- Integration with project tool window
- Settings/preferences page for plugin configuration