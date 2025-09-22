# Yam++ (Yet Another Modern Task Runner)

![Version](https://img.shields.io/badge/version-0.12.4-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)
![npm](https://img.shields.io/badge/npm-package-red)
![SOLID](https://img.shields.io/badge/SOLID-97.8%25-brightgreen)
![Architecture](https://img.shields.io/badge/Architecture-A-gold)

A modern, concurrent, declarative task runner with enterprise-grade architecture and native cross-platform shell execution. The unique task runner that combines the power of Make with cross-platform compatibility, native shell integration (bash/PowerShell/cmd), professional interface, and **perfect SOLID design principles**.

> **🪝 v0.12.3 Hook System** - Complete lifecycle hook implementation with automatic execution. Task naming convention: `before_X`, `after_X`, `finally_X` automatically execute around task `X`. Global `before_all`/`after_all` hooks. Robust validation prevents orphaned hooks. Perfect integration with DAG and concurrent execution.

## 🚀 Quick Start

```bash
# Install globally
pnpm add -g @yampp/yampp

# Create a Yamfile in your project
cat > Yamfile << 'EOF'
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
EOF

# Run tasks
yampp build         # Run single task
yampp test deploy   # Run multiple tasks
yampp --list        # List all tasks
```

## 🌟 Key Features

- **🪝 Lifecycle Hook System** - Automatic `before_X`, `after_X`, `finally_X` execution around tasks. Global `before_all`/`after_all` hooks run once per session
- **🌍 Cross-Platform Native Shell** - Full bash/PowerShell/cmd execution with platform annotations (`@linux @mac @windows`)
- **⚡ Concurrent by Default** - Parallel task execution using worker threads
- **🎨 Professional Interface** - Real-time task blocks with animated spinners (Claude Code interface)
- **🔄 Smart Dependencies** - Automatic dependency resolution with DAG validation
- **📦 Intelligent Caching** - Skip unchanged tasks with file watching support
- **🎯 Execution Profiles** - Flexible profile system with default profiles and nested platform-specific configurations (`@production`, `@development`, `@staging`)
- **📁 Include/Import System** - Smart modular Yamfile composition with `include "path/file.yamfile"` syntax, circular dependency protection, and profile-aware merging
- **💬 Interactive Functions** - Built-in prompts for user input (`__input`, `__input_password`, `__input_select`, `__input_confirm`)
- **🎛️ Inline Variables Anywhere** - Variables with internal functions work inside if/case/for blocks respecting control flow
- **🎯 Parameterized Tasks** - Tasks with parameters and variable substitution
- **🔌 Complete Ecosystem** - VS Code extension, IntelliJ plugin, and AI-powered migration tools
- **🏗️ Enterprise Architecture** - **98% SOLID compliance** with perfect ISP/SRP/OCP/LSP, extensible plugin system, registry patterns
- **⚙️ Professional Configuration** - Fluent configuration API with Builder pattern and constants management
- **🔧 Extensible Design** - Plugin architecture for internal functions, configurable modifier system, dynamic shell strategies

## 📚 Documentation

- **[User Guide](docs/USER_GUIDE.md)** - Complete guide to using Yampp
- **[Migration Guide](docs/MIGRATION_GUIDE.md)** - Migrate from Make, Gulp, npm scripts, and more
- **[Architecture](docs/ARCHITECTURE.md)** - Technical architecture and design decisions
- **[Advanced Features](docs/ADVANCED_FEATURES.md)** - Deep dive into advanced capabilities
- **[API Reference](docs/API_REFERENCE.md)** - Programmatic usage and extension

## 💡 Why Yampp?

### The Problem
- **Make** is powerful but Unix-only and has arcane syntax
- **npm scripts** lack proper dependency management and parallelization
- **Gulp/Grunt** require JavaScript programming and complex configurations
- **Just** is simpler but lacks advanced features and cross-platform support

### The Solution
Yampp combines the best of all worlds:
- Simple declarative syntax like Make
- Cross-platform native shell execution
- Modern features like file watching and interactive prompts
- Professional output with real-time feedback
- Zero configuration with sensible defaults

## 🎯 Example Yamfile

```yamfile
// Variables and default profile
var PROJECT = "myapp"
const VERSION = "1.0.0"
default production

// Production environment
@production {
    build {
        echo "Building $PROJECT v$VERSION for production"
        npm run build:prod
    }
    
    @linux @mac {
        deploy {
            echo "Deploying to Unix production server"
            ./deploy-unix.sh
        }
    }
    
    @windows {
        deploy {
            echo "Deploying to Windows production server"
            powershell ./deploy-windows.ps1
        }
    }
}

// Development environment  
@development {
    build(env = "dev") watches src/**/*.ts {
        echo "Building $PROJECT for development"
        npm run build:dev
    }
    
    test {
        echo "Running development tests"
        npm test
    }
}

// Interactive deployment with inline variables
deploy needs build {
    var target = __input_select "Deploy target:" "aws" "aws,azure,gcp"
    
    if [ "$target" = "aws" ]; then
        var region = __input_select "AWS region:" "us-east-1" "us-east-1,us-west-2,eu-west-1"
        var confirm = __input_confirm "Deploy to $target ($region)?" "false"
    else
        var confirm = __input_confirm "Deploy to $target?" "false"
    fi
    
    if [ "$confirm" = "true" ]; then
        ./deploy.sh --target $target --region $region
    fi
}

// Task with modifiers
always serial critical: backup {
    pg_dump mydb > backup.sql
    aws s3 cp backup.sql s3://backups/
}
```

## 🛠️ Installation

### From npm registry

```bash
pnpm add -g @yampp/yampp
```

### From Source

```bash
git clone https://github.com/yourusername/yampp.git
cd yampp
pnpm install
pnpm link --global
```

## 📖 Basic Usage

### CLI Commands

```bash
# Task execution
yampp                   # Run default task (uses default profile if defined)
yampp build test        # Run specific tasks
yampp build:prod        # Run with parameters

# Profile management
yampp --profile production build    # Run tasks in specific profile
yampp --profile dev --profile test  # Use multiple profiles
yampp --list           # List tasks from default profile
yampp --profile staging --list      # List tasks from specific profile

# Task management  
yampp --graph          # Show dependency graph
yampp --graph --graph-format dot > graph.dot  # Export to DOT format
yampp --graph --graph-format ascii  # Beautiful ASCII art visualization
yampp --clean          # Clean cache

# Execution control
yampp -j 2 build test  # Limit parallelism
yampp --force build    # Ignore cache
yampp --dry-run deploy # Enhanced analysis with time estimation
yampp --plan deploy    # Show execution plan
yampp --watch build    # Watch files and re-execute on changes (Ctrl+C twice to exit)
```

### Yamfile Syntax

```yamfile
// Default profile (optional)
default profilename

// Task definition
taskname {
    command1
    command2
}

// Dependencies
taskname needs dep1 dep2 {
    commands
}

// Execution profiles
@production {
    taskname { commands }
}

@development {
    taskname { commands }
}

// Nested profiles and platforms
@production {
    @linux {
        deploy { ./deploy-linux.sh }
    }
    @windows {
        deploy { powershell ./deploy-windows.ps1 }
    }
}

// Modifiers
always: taskname { }      // Always run
serial: taskname { }      // Sequential execution
critical: taskname { }    // Must succeed

// Variables
var name = "value"        // Mutable
const name = "value"      // Immutable

// File watching
taskname watches pattern {
    commands
}

// Parameters
taskname(param1, param2 = "default") {
    echo "$param1 $param2"
}

// Internal functions
taskname {
    var varname = __input "Prompt:" "default"
    __call other_task($varname)
}
```

## 🪝 Hook System

The Hook System enables automatic lifecycle management for tasks using simple naming conventions. Hooks execute automatically when their target tasks run, providing clean setup, teardown, and error handling.

### Hook Types

#### Task-Specific Hooks
```yamfile
# Hooks for 'setup' task
before_setup {
    echo "Preparing for setup..."
    mkdir -p dist tmp
}

setup {
    echo "Running setup..."
    npm install
}

after_setup {
    echo "Setup completed successfully!"
}

finally_setup {
    echo "Cleanup after setup (always runs)"
    rm -rf tmp
}
```

#### Global Hooks
```yamfile
# Run once before any task execution
before_all {
    echo "🚀 Starting build process..."
    export BUILD_ID=$(date +%s)
}

# Run once after all tasks complete
after_all {
    echo "✅ Build process completed!"
    echo "Final Build ID: $BUILD_ID"
}
```

### Automatic Execution

When you run a task, its hooks execute automatically:

```bash
yampp setup
# Executes: before_all → before_setup → setup → after_setup → finally_setup → after_all

yampp build  # (if build needs setup)
# Executes: before_all → before_setup → setup → after_setup → finally_setup →
#           before_build → build → after_build → after_all
```

### Hook Features

- **🔄 Automatic Integration**: No configuration needed - hooks auto-detect based on task names
- **🎯 Dependency Aware**: Hooks respect task dependencies and execute in correct order
- **🛡️ Validation**: Orphaned hooks (e.g., `before_missing` without `missing` task) are detected and prevented
- **⚡ Concurrent Safe**: Hooks work with parallel execution and respect serial modifiers
- **🏷️ Modifier Support**: Hooks can use modifiers like `always: before_build`
- **🌍 Global Scope**: `before_all`/`after_all` execute once per session, not per task

### Hook Execution Order

For complex dependency chains:
```
before_all → before_X → X → after_X → finally_X → ... → after_all
```

Global hooks run only once even with multiple tasks:
```bash
yampp task1 task2 task3
# before_all runs once, after_all runs once at the end
```

## 🔧 IDE Support

### VS Code Extension
- Syntax highlighting
- IntelliSense completion
- Task runner integration
- [Install from Marketplace](https://marketplace.visualstudio.com/items?itemName=yampp.yampp-vscode)

### IntelliJ Plugin
- Full language support
- Task execution from IDE
- Refactoring support
- [Install from JetBrains Marketplace](https://plugins.jetbrains.com/plugin/yampp)

## 🤖 AI-Powered Migration

Automatically migrate from other task runners using [yampp-translator](https://github.com/yourusername/yampp-translator):

```bash
# Install translator
pnpm add -g @yampp/translator

# Translate existing files
yampp-translator translate Makefile
yampp-translator translate gulpfile.js
yampp-translator translate package.json

# Use with AI providers (9 supported)
yampp-translator translate Makefile --provider openai --model gpt-4o
```

Supports:
- 9 AI providers (OpenAI, Claude, Gemini, Mistral, DeepSeek, Hugging Face, Cohere, Grok, Ollama)
- 4 AI editor agents (Claude Code, Cursor, GitHub Copilot, JetBrains AI)
- Automatic pattern detection and conversion

## 🏗️ Development

### Project Structure

```
yampp/
├── bin/             # CLI entry point
├── lib/             # Core modules
├── grammar/         # Peggy parser grammar
├── examples/        # Example Yamfiles
└── docs/           # Documentation
```

### Building from Source

```bash
# Clone repository
git clone https://github.com/yourusername/yampp.git
cd yampp

# Install dependencies
pnpm install

# Run tests
pnpm test

# Build
pnpm run build

# Install locally
pnpm link --global
```

### Running Tests

```bash
pnpm test              # Run all tests
pnpm run test:unit     # Unit tests only
pnpm run test:e2e      # End-to-end tests
pnpm run test:coverage # With coverage
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by GNU Make, Gulp, and Just
- Built with [Peggy](https://peggyjs.org/) parser generator
- Uses [chalk](https://github.com/chalk/chalk) for beautiful output
- Powered by [p-limit](https://github.com/sindresorhus/p-limit) for concurrency control

## 📊 Comparison with Other Tools

| Feature | Yampp | Make | npm scripts | Gulp | Just |
|---------|-------|------|-------------|------|------|
| Cross-platform | ✅ | ❌ | ✅ | ✅ | ✅ |
| Native shell | ✅ | ✅ | Limited | ❌ | Limited |
| Parallel execution | ✅ | Limited | ❌ | ✅ | ❌ |
| File watching | ✅ | Limited | ❌ | ✅ | ❌ |
| Interactive prompts | ✅ | ❌ | ❌ | ❌ | ❌ |
| Professional UI | ✅ | ❌ | ❌ | ❌ | ❌ |
| IDE support | ✅ | ✅ | ✅ | ✅ | Limited |
| AI migration | ✅ | ❌ | ❌ | ❌ | ❌ |
| Zero config | ✅ | ✅ | ✅ | ❌ | ✅ |

## 🔗 Links

- [Documentation](docs/)
- [Examples](examples/)
- [Changelog](CHANGELOG.md)
- [Roadmap](TODO.md)
- [Issues](https://github.com/yourusername/yampp/issues)
- [Discussions](https://github.com/yourusername/yampp/discussions)

## 👤 Author

**Matias Denda**

- GitHub: [@matutetandil](https://github.com/matutetandil)
- Twitter: [@matutetandil](https://twitter.com/matutetandil)

---

**Made with ❤️ for developers who value simplicity and power**
