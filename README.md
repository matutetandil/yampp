# Yam++ (Yet Another Modern Task Runner)

![Version](https://img.shields.io/badge/version-0.8.2-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)
![npm](https://img.shields.io/badge/npm-package-red)

A modern, concurrent, declarative task runner with native cross-platform shell execution. The unique task runner that combines the power of Make with cross-platform compatibility, native shell integration (bash/PowerShell/cmd), and a modern professional interface.

## 🚀 Quick Start

```bash
# Install globally
npm install -g yampp

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

- **🌍 Cross-Platform Native Shell** - Full bash/PowerShell/cmd execution with platform annotations (`@linux @mac @windows`)
- **⚡ Concurrent by Default** - Parallel task execution using worker threads
- **🎨 Professional Interface** - Real-time task blocks with animated spinners (Claude Code interface)
- **🔄 Smart Dependencies** - Automatic dependency resolution with DAG validation
- **📦 Intelligent Caching** - Skip unchanged tasks with file watching support
- **💬 Interactive Functions** - Built-in prompts for user input (`__input`, `__input_password`, `__input_select`, `__input_confirm`)
- **🎯 Parameterized Tasks** - Tasks with parameters and variable substitution
- **🔌 Complete Ecosystem** - VS Code extension, IntelliJ plugin, and AI-powered migration tools

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
// Variables
var PROJECT = "myapp"
const VERSION = "1.0.0"

// Cross-platform task
@linux @mac: install {
    ./install.sh
}

@windows: install {
    .\install.ps1
}

// Parameterized task with file watching
build(env = "dev") watches src/**/*.ts {
    echo "Building $PROJECT v$VERSION for $env"
    npm run build:$env
}

// Interactive deployment
deploy needs build(production) {
    __input_select "Deploy target:" target ["aws", "azure", "gcp"] "aws"
    __input_confirm "Deploy to $target?" confirm "false"
    
    if [ "$confirm" = "true" ]; then
        ./deploy.sh --target $target
    fi
}

// Task with modifiers
always serial critical: backup {
    pg_dump mydb > backup.sql
    aws s3 cp backup.sql s3://backups/
}
```

## 🛠️ Installation

### From npm

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

## 📖 Basic Usage

### CLI Commands

```bash
# Task execution
yampp                   # Run default task
yampp build test        # Run specific tasks
yampp build:prod        # Run with parameters

# Task management
yampp --list           # List all tasks
yampp --graph          # Show dependency graph
yampp --clean          # Clean cache

# Execution control
yampp -j 2 build test  # Limit parallelism
yampp --force build    # Ignore cache
yampp --dry-run deploy # Preview without execution
yampp --plan deploy    # Show execution plan
```

### Yamfile Syntax

```yamfile
// Task definition
taskname {
    command1
    command2
}

// Dependencies
taskname needs dep1 dep2 {
    commands
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

// Platform specific
@linux @mac: taskname { }
@windows: taskname { }

// Parameters
taskname(param1, param2 = "default") {
    echo "$param1 $param2"
}

// Internal functions
taskname {
    __input "Prompt:" varname "default"
    __call other_task($varname)
}
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
npm install -g yampp-translator

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
npm install

# Run tests
npm test

# Build
npm run build

# Install locally
npm install -g .
```

### Running Tests

```bash
npm test              # Run all tests
npm run test:unit     # Unit tests only
npm run test:e2e      # End-to-end tests
npm run test:coverage # With coverage
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

**Your Name**

- GitHub: [@yourusername](https://github.com/yourusername)
- Twitter: [@yourtwitter](https://twitter.com/yourtwitter)

---

**Made with ❤️ for developers who value simplicity and power**