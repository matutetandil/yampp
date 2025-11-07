# Contributing to Yampp

Thanks for your interest in contributing to Yampp! This document provides guidelines for contributing to the project.

## Project Status

Yampp is currently an **active personal project** (v0.12.x) demonstrating TypeScript architecture, cross-platform systems programming, and developer tooling design. Contributions are welcome, especially in areas that help improve code quality and test coverage.

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 9.0.0
- Git

### Development Setup

```bash
# Clone the repository
git clone https://github.com/matutetandil/yampp.git
cd yampp

# Install dependencies
pnpm install

# Build all packages
pnpm run build

# Link for local testing
cd packages/yampp && pnpm link --global

# Test your installation
yampp --version
```

## Project Structure

```
yampp/
├── packages/
│   ├── yampp/              # Core task runner
│   │   ├── bin/           # CLI entry point
│   │   ├── lib/           # Source code (~25K lines TypeScript)
│   │   ├── docs/          # Documentation
│   │   └── examples/      # Example Yamfiles
│   └── plugin-types/       # Plugin type definitions
├── test-plugins/           # Plugin development examples
└── pnpm-workspace.yaml     # Monorepo configuration
```

## How to Contribute

### Areas Where Help is Needed

**High Priority:**
1. **Test Suite** - Unit and integration tests are currently minimal
2. **CI/CD Setup** - GitHub Actions workflow for automated builds and tests
3. **Documentation** - Improve existing docs, add more examples
4. **Bug Fixes** - Issues tagged as `good-first-issue`

**Medium Priority:**
5. **Plugin Development** - Create example plugins demonstrating the plugin API
6. **Performance** - Profiling and optimization of task execution
7. **Cross-platform Testing** - Testing on Windows, Linux, macOS

**Nice to Have:**
8. **Features** - New features aligned with project roadmap
9. **IDE Support** - Improvements to VS Code and IntelliJ plugins

### Contribution Process

1. **Fork** the repository
2. **Create a branch** for your feature/fix
   ```bash
   git checkout -b feature/my-feature
   # or
   git checkout -b fix/issue-123
   ```
3. **Make your changes** following the code style
4. **Test your changes** locally
5. **Commit** with clear, descriptive messages
   ```bash
   git commit -m "feat: add support for X"
   git commit -m "fix: resolve issue with Y"
   git commit -m "docs: improve Z documentation"
   ```
6. **Push** to your fork
7. **Open a Pull Request** with description of changes

### Commit Message Convention

Use conventional commits format:

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `refactor:` - Code refactoring
- `test:` - Test additions or fixes
- `chore:` - Build process, dependencies

Examples:
```
feat: add support for environment variable expansion
fix: resolve circular dependency detection bug
docs: update user guide with hook examples
refactor: extract task orchestrator into separate module
test: add unit tests for parser
```

## Code Style

### TypeScript Guidelines

- Use **TypeScript** for all new code
- Follow existing code organization patterns
- Use **interfaces** over types where applicable
- Apply **SOLID principles** (the project emphasizes architecture quality)
- Prefer **composition over inheritance**
- Use **descriptive variable names**

### File Organization

- **One class per file** (following Single Responsibility Principle)
- Group related interfaces in appropriate directories
- Use barrel exports (`index.ts`) for clean imports
- Keep files focused and under 300 lines when possible

### Architecture Patterns

The project uses several design patterns:
- **Strategy Pattern** - Cross-platform shell execution
- **Registry Pattern** - Modifiers, functions, plugins
- **Builder Pattern** - Configuration objects
- **Factory Pattern** - Object creation

Follow these patterns when extending functionality.

## Testing

**Current Status:** Test suite is minimal - this is a high-priority contribution area!

### Running Tests (once implemented)
```bash
pnpm test              # Run all tests
pnpm test:unit         # Unit tests
pnpm test:integration  # Integration tests
pnpm run test:watch    # Watch mode
```

### Writing Tests
- Place tests in `__tests__` directories adjacent to source
- Use descriptive test names
- Follow Arrange-Act-Assert pattern
- Test edge cases and error conditions

## Documentation

### Updating Documentation
- Keep README.md concise - detailed info goes in `packages/yampp/docs/`
- Update CHANGELOG.md following [Keep a Changelog](https://keepachangelog.com/) format
- Add examples to `examples/` directory for new features
- Include JSDoc comments for public APIs

### Documentation Files
- `README.md` - Project overview (keep concise!)
- `packages/yampp/docs/USER_GUIDE.md` - Complete feature reference
- `packages/yampp/docs/ARCHITECTURE.md` - Technical design
- `packages/yampp/docs/ADVANCED_FEATURES.md` - Advanced usage
- `CHANGELOG.md` - Version history

## Pull Request Guidelines

### Before Submitting
- [ ] Code builds successfully (`pnpm run build`)
- [ ] Tests pass (when test suite exists)
- [ ] Documentation updated if needed
- [ ] CHANGELOG.md updated for significant changes
- [ ] Commit messages follow convention

### PR Description Should Include
- **What** - Summary of changes
- **Why** - Motivation for the changes
- **How** - Technical approach if non-obvious
- **Testing** - How you tested the changes
- **Screenshots** - For UI/output changes

## Questions and Support

- **Issues** - Use GitHub Issues for bugs and feature requests
- **Discussions** - Use GitHub Discussions for questions and ideas
- **Email** - matutetandil@gmail.com for other inquiries

## Code of Conduct

- Be respectful and constructive
- Focus on what is best for the project
- Show empathy towards other contributors
- Accept constructive criticism gracefully

## License

By contributing to Yampp, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to Yampp!** 🎉
