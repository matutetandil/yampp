# Plugin Development Guide

A comprehensive guide to developing plugins for Yam++ (Yet Another Modern Task Runner).

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- TypeScript knowledge
- Understanding of Yampp task runner basics

### Installation

```bash
# Create your plugin directory
mkdir my-yampp-plugin
cd my-yampp-plugin

# Initialize package.json
pnpm init

# Install plugin types (lightweight, ~5KB)
pnpm add @yampp/plugin-types
```

### Basic Plugin Structure

```typescript
// index.ts
import { BasePlugin, VoidFunction, ReturnValueFunction } from '@yampp/plugin-types';

// Define a void function (no return value)
class GreetFunction extends VoidFunction {
  constructor() {
    super();
    this.functionName = 'greet';
    this.functionDescription = 'Greets a user with a message';
  }

  async executeFunction(name: string, greeting: string = 'Hello'): Promise<void> {
    const message = `${greeting}, ${name}!`;
    console.log(`[my-plugin::greet] ${message}`);
  }
}

// Define a return value function
class CalculateFunction extends ReturnValueFunction {
  constructor() {
    super();
    this.functionName = 'calculate';
    this.functionDescription = 'Performs mathematical calculations';
  }

  async executeFunction(operation: string, a: number, b: number): Promise<string> {
    const numA = parseInt(a.toString());
    const numB = parseInt(b.toString());
    let result: number;

    switch (operation) {
      case 'add':
        result = numA + numB;
        break;
      case 'subtract':
        result = numA - numB;
        break;
      case 'multiply':
        result = numA * numB;
        break;
      case 'divide':
        if (numB === 0) throw new Error('Division by zero');
        result = numA / numB;
        break;
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }

    console.log(`[my-plugin::calculate] ${numA} ${operation} ${numB} = ${result}`);
    return result.toString();
  }
}

// Export the plugin
export class MyPlugin extends BasePlugin {
  constructor() {
    super();
    this.name = 'my-plugin';
    this.version = '1.0.0';
    this.description = 'A sample mathematical plugin for Yampp';
  }

  getFunctions() {
    return {
      greet: new GreetFunction(),
      calculate: new CalculateFunction()
    };
  }
}

export default new MyPlugin();
```

### Package Configuration

```json
{
  "name": "my-yampp-plugin",
  "version": "1.0.0",
  "description": "A sample plugin for Yampp",
  "main": "dist/index.js",
  "type": "module",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch"
  },
  "dependencies": {
    "@yampp/plugin-types": "^0.12.6"
  },
  "devDependencies": {
    "typescript": "^5.0.0"
  }
}
```

### TypeScript Configuration

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node",
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## 📖 Plugin Architecture

### Plugin Types

Yampp supports two types of plugin functions:

#### 1. Void Functions
- Execute without returning values
- Used for actions like logging, notifications, file operations
- Extend `VoidFunction` class

#### 2. Return Value Functions
- Return string values that can be captured in variables
- Used for calculations, data processing, API calls
- Extend `ReturnValueFunction` class

### Plugin Lifecycle

1. **Import**: Plugin imported in Yamfile with `import` statement
2. **Copy**: Plugin copied to `.yampp-plugins/` directory
3. **Install**: Dependencies installed automatically (pnpm/yarn/npm)
4. **Load**: Plugin dynamically loaded and registered
5. **Execute**: Functions called during task execution

## 🛠️ Development Patterns

### Function Naming Convention

```typescript
// Good: Descriptive function names
class DownloadFileFunction extends ReturnValueFunction {
  constructor() {
    super();
    this.functionName = 'download_file';  // snake_case recommended
    this.functionDescription = 'Downloads a file from URL';
  }
}

// Good: Namespace functions logically
class DockerPlugin extends BasePlugin {
  getFunctions() {
    return {
      build: new DockerBuildFunction(),    // docker::build
      push: new DockerPushFunction(),      // docker::push
      run: new DockerRunFunction()         // docker::run
    };
  }
}
```

### Error Handling

```typescript
class ApiCallFunction extends ReturnValueFunction {
  async executeFunction(url: string, method: string = 'GET'): Promise<string> {
    try {
      const response = await fetch(url, { method });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.text();
      return data;
    } catch (error) {
      // Errors are automatically handled by Yampp
      throw new Error(`API call failed: ${error.message}`);
    }
  }
}
```

### Parameter Validation

```typescript
class ValidatedFunction extends ReturnValueFunction {
  async executeFunction(required: string, optional?: string): Promise<string> {
    // Validate required parameters
    if (!required || required.trim() === '') {
      throw new Error('Required parameter cannot be empty');
    }

    // Provide defaults for optional parameters
    const processedOptional = optional || 'default_value';

    // Process and return
    return `processed: ${required}, ${processedOptional}`;
  }
}
```

## 📁 Plugin Project Structure

```
my-yampp-plugin/
├── src/
│   ├── index.ts              # Main plugin export
│   ├── functions/
│   │   ├── GreetFunction.ts  # Individual function classes
│   │   └── CalculateFunction.ts
│   └── types/
│       └── plugin-types.ts   # Custom type definitions
├── dist/                     # Compiled JavaScript (auto-generated)
├── package.json
├── tsconfig.json
└── README.md
```

## 🔧 Testing Your Plugin

### Local Development

```bash
# Build your plugin
pnpm run build

# Create a test Yamfile
cat > Yamfile << 'EOF'
import file://./my-yampp-plugin

test_plugin {
    // Test void function
    my-plugin::greet("Developer")

    // Test return value function
    var result = my-plugin::calculate("add", 5, 3)
    echo "Calculation result: $result"
}
EOF

# Test your plugin
yampp test_plugin
```

### Unit Testing

```typescript
// tests/plugin.test.ts
import { MyPlugin } from '../src/index.js';

describe('MyPlugin', () => {
  let plugin: MyPlugin;

  beforeEach(() => {
    plugin = new MyPlugin();
  });

  test('should have correct metadata', () => {
    expect(plugin.name).toBe('my-plugin');
    expect(plugin.version).toBe('1.0.0');
  });

  test('should provide expected functions', () => {
    const functions = plugin.getFunctions();
    expect(functions).toHaveProperty('greet');
    expect(functions).toHaveProperty('calculate');
  });

  test('calculate function should work correctly', async () => {
    const functions = plugin.getFunctions();
    const result = await functions.calculate.executeFunction('add', 5, 3);
    expect(result).toBe('8');
  });
});
```

## 📦 Distribution

### NPM Package

```bash
# Publish to npm
pnpm publish

# Users can then import with:
# import @your-scope/your-plugin-name
```

### Git Repository

```bash
# Users can import with:
# import git@github.com:username/plugin-name
# import git@gitlab.com:username/plugin-name#branch
```

### Local Distribution

```bash
# Users can import with:
# import file://./path/to/your/plugin
# import file:///absolute/path/to/plugin
```

## ⚡ Advanced Features

### Plugin Initialization

```typescript
export class AdvancedPlugin extends BasePlugin {
  private config: any;

  async initialize(context: IPluginContext): Promise<void> {
    // Initialize plugin with context
    this.config = await context.config.get('plugin-settings');

    // Setup logging
    context.logger.info(`Initialized ${this.name} v${this.version}`);
  }
}
```

### File System Operations

```typescript
class FilePlugin extends BasePlugin {
  getFunctions() {
    return {
      read: new ReadFileFunction(),
      write: new WriteFileFunction(),
      exists: new FileExistsFunction()
    };
  }
}

class ReadFileFunction extends ReturnValueFunction {
  async executeFunction(filePath: string): Promise<string> {
    const fs = await import('fs/promises');
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return content;
    } catch (error) {
      throw new Error(`Failed to read file ${filePath}: ${error.message}`);
    }
  }
}
```

### Shell Command Execution

```typescript
class ShellFunction extends ReturnValueFunction {
  async executeFunction(command: string): Promise<string> {
    const { execSync } = await import('child_process');

    try {
      const output = execSync(command, { encoding: 'utf-8' });
      return output.trim();
    } catch (error) {
      throw new Error(`Command failed: ${error.message}`);
    }
  }
}
```

## 🎯 Best Practices

### 1. Plugin Independence
- Depend only on `@yampp/plugin-types`
- Avoid dependencies on Yampp internals
- Use standard Node.js APIs when possible

### 2. Function Design
- Make functions focused and single-purpose
- Use descriptive names and documentation
- Handle errors gracefully with meaningful messages

### 3. Parameter Handling
- Validate all input parameters
- Provide sensible defaults for optional parameters
- Convert string inputs to appropriate types

### 4. Resource Management
- Clean up resources (files, connections) properly
- Use async/await for I/O operations
- Handle timeouts and cancellation gracefully

### 5. Documentation
- Document all functions with clear descriptions
- Provide usage examples in README
- Include TypeScript type definitions

## 🔍 Debugging

### Enable Debug Logging

```typescript
class DebugFunction extends VoidFunction {
  async executeFunction(message: string): Promise<void> {
    // Debug logging
    console.log(`[DEBUG] ${this.functionName}: ${message}`);

    // Use Yampp's logging if available
    // context.logger?.debug(message);
  }
}
```

### Common Issues

1. **Plugin not loading**: Check import syntax and file paths
2. **Functions not found**: Verify function names and registration
3. **Parameter errors**: Validate parameter types and counts
4. **Dependency issues**: Ensure clean `node_modules` installation

## 📚 Examples Repository

For complete working examples, see:
- [Official Plugin Examples](https://github.com/yampp/plugin-examples)
- [Community Plugins](https://github.com/yampp/community-plugins)

## 🤝 Contributing

Want to contribute to plugin development?

1. Fork the plugin types repository
2. Create feature branches for improvements
3. Submit pull requests with comprehensive tests
4. Update documentation for new features

## 📖 Additional Resources

- [Yampp User Guide](README.md)
- [API Reference](docs/API_REFERENCE.md)
- [Architecture Guide](docs/ARCHITECTURE.md)
- [Plugin Types API](packages/plugin-types/README.md)