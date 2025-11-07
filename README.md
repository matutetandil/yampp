# Yam++ (Yet Another Modern Task Runner)

![Version](https://img.shields.io/badge/version-0.12.6-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)

A modern, concurrent task runner with its own DSL, written in TypeScript. Combines Make-style dependency management with cross-platform shell execution and modern features.

**Status:** Active development (v0.12.x) - Core features stable, advanced features in progress.

## Quick Start

```bash
# Install globally (or from source - see below)
pnpm add -g @yampp/yampp

# Create a Yamfile
cat > Yamfile << 'EOF'
build {
    echo "Building..."
    npm run compile
}

test needs build {
    npm test
}
EOF

# Run tasks
yampp build test
yampp --list
```

## Core Features

### What Works Well ✅
- **Concurrent Execution** - Parallel task execution with configurable job limits
- **Smart Dependencies** - DAG-based dependency resolution with cycle detection
- **Cross-Platform** - Runs on Linux, macOS, and Windows (bash/PowerShell/cmd)
- **File Watching** - Make-style file dependencies with glob pattern support
- **Variables & Parameters** - Task parameterization and variable substitution
- **Lifecycle Hooks** - `before_X`, `after_X`, `finally_X` task hooks
- **Interactive Input** - Built-in prompts for user input during task execution
- **Execution Profiles** - Environment-based task organization (`@production`, `@development`)

### Advanced Features 🚧
- **Plugin System** - Basic plugin architecture (in development)
- **Include System** - Modular Yamfile composition
- **Intelligent Caching** - Skip unchanged tasks based on file timestamps

## Example Yamfile

```yamfile
// Variables
var PROJECT = "myapp"
const VERSION = "1.0.0"

// Simple task
build watches "src/**/*.ts" {
    echo "Building $PROJECT v$VERSION..."
    npm run build
}

// Task with dependencies
test needs build {
    npm test
}

// Parameterized task
deploy(env) {
    echo "Deploying to $env..."
    ./deploy.sh --env=$env
}

// Cross-platform tasks
@linux @mac {
    package {
        tar -czf dist.tar.gz dist/
    }
}

@windows {
    package {
        powershell Compress-Archive dist dist.zip
    }
}

// Interactive deployment
serial: interactive_deploy {
    var target = __input_select "Deploy target:" "staging" "staging,production"
    var confirm = __input_confirm "Deploy to $target?" "no"

    if [ "$confirm" = "yes" ]; then
        __call deploy($target)
    fi
}
```

## Installation

### From npm (when published)
```bash
pnpm add -g @yampp/yampp
```

### From Source
```bash
git clone https://github.com/matutetandil/yampp.git
cd yampp
pnpm install
pnpm run build
cd packages/yampp && pnpm link --global
```

## CLI Usage

```bash
# Execute tasks
yampp build test              # Run multiple tasks
yampp deploy:production       # Parameterized task

# Execution control
yampp -j 4 build              # Limit parallelism to 4 jobs
yampp --force build           # Ignore cache
yampp --dry-run deploy        # Preview without executing

# Information
yampp --list                  # List all tasks
yampp --graph                 # Show dependency graph
yampp --clean                 # Clean cache

# Profiles
yampp --profile production build
```

## Documentation

- **[User Guide](packages/yampp/docs/USER_GUIDE.md)** - Complete feature reference
- **[Architecture](packages/yampp/docs/ARCHITECTURE.md)** - Technical design and implementation
- **[Advanced Features](packages/yampp/docs/ADVANCED_FEATURES.md)** - Deep dive into advanced capabilities
- **[Migration Guide](packages/yampp/docs/MIGRATION_GUIDE.md)** - Migrate from Make, npm scripts, etc
- **[API Reference](packages/yampp/docs/API_REFERENCE.md)** - Programmatic usage

## Project Structure

This is a pnpm monorepo workspace:

```
yampp/
├── packages/
│   ├── yampp/           # Core task runner (~25K lines TypeScript)
│   └── plugin-types/    # TypeScript type definitions for plugins
├── examples/            # Example Yamfiles
└── test-plugins/        # Plugin development examples
```

## Ecosystem

- **[yampp-translator](https://github.com/matutetandil/yampp-translator)** - AI-powered migration from Make/Gulp/npm scripts
- **[yampp-vscode-extension](https://github.com/matutetandil/yampp-vscode-extension)** - Syntax highlighting for VS Code
- **[yampp-intellij-plugin](https://github.com/matutetandil/yampp-intellij-plugin)** - IntelliJ IDEA language support

## Architecture Highlights

- **~25,000 lines** of TypeScript code
- **318 source files** with modular organization
- **96 TypeScript interfaces** following SOLID principles
- **Strategy Pattern** for cross-platform shell execution
- **Registry Pattern** for extensible modifiers and functions
- **Builder Pattern** for configuration management

## Comparison

| Feature | Yampp | Make | npm scripts | Just |
|---------|-------|------|-------------|------|
| Cross-platform | ✅ | ❌ | ✅ | ✅ |
| Native shell | ✅ | ✅ | Limited | Limited |
| Parallel execution | ✅ | Limited | ❌ | ❌ |
| File watching | ✅ | ✅ | ❌ | ❌ |
| Interactive prompts | ✅ | ❌ | ❌ | ❌ |
| Variables | ✅ | Limited | ✅ | ✅ |
| Modern syntax | ✅ | ❌ | N/A | ✅ |

## Development Status

**Current Version:** 0.12.6

**Stable:**
- Core task execution and dependency management
- Cross-platform shell execution
- File watching and caching
- Variables, parameters, and hooks
- Interactive input functions

**In Development:**
- Plugin system (basic implementation complete)
- Test suite (infrastructure complete, 40 tests passing, improving coverage)
- CI/CD integration examples

**Planned:**
- Polyglot execution system (@python, @docker, etc)
- Distributed cache
- Remote worker execution

## Testing

```bash
# Run all tests
pnpm test

# Run specific test suites
pnpm test:unit           # Unit tests only
pnpm test:integration    # Integration tests only
pnpm test:watch          # Watch mode
```

**Current Status:** Test infrastructure is set up and working (40 passing tests). Some tests need API alignment as the codebase evolved. See `packages/yampp/test/README.md` for detailed test documentation and status.

## Contributing

Contributions welcome! This is an active personal project demonstrating:
- TypeScript architecture and design patterns
- Cross-platform system programming
- DSL design and parser implementation
- Developer tooling ecosystem

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Author

**Matias Denda**
- GitHub: [@matutetandil](https://github.com/matutetandil)
- Email: matutetandil@gmail.com

---

**Project Goals:** Build a modern task runner that combines Make's power with cross-platform compatibility and modern developer experience. This is a personal project showcasing software architecture, TypeScript development, and systems programming skills.
