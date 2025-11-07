# @yampp/yampp

Core task runner package for Yampp.

**For complete documentation, see the [main project README](../../README.md).**

## Quick Install

```bash
# Global installation
pnpm add -g @yampp/yampp

# Verify installation
yampp --version
```

## Documentation

This package contains the core task runner. All documentation is maintained in the main repository:

- **[Main README](../../README.md)** - Project overview and quick start
- **[User Guide](docs/USER_GUIDE.md)** - Complete feature reference
- **[Architecture](docs/ARCHITECTURE.md)** - Technical design and patterns
- **[Advanced Features](docs/ADVANCED_FEATURES.md)** - Deep dive into capabilities
- **[Migration Guide](docs/MIGRATION_GUIDE.md)** - Migrate from other tools
- **[API Reference](docs/API_REFERENCE.md)** - Programmatic usage

## Quick Example

```yamfile
build {
    echo "Building..."
    npm run compile
}

test needs build {
    npm test
}
```

```bash
yampp build test
```

## Development

```bash
# Build from source
pnpm install
pnpm run build

# Link globally for testing
pnpm link --global
```

## License

MIT - see [LICENSE](../../LICENSE) for details.
