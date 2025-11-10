# @yampp/plugin-types

TypeScript type definitions for developing Yampp plugins.

## Installation

```bash
npm install --save-dev @yampp/plugin-types
```

## Usage

Create a plugin by implementing the required interfaces:

```typescript
import type {
  YamppPlugin,
  YamppContext,
  PluginMetadata,
  PluginFunction
} from '@yampp/plugin-types';

export default class MyPlugin implements YamppPlugin {
  getMetadata(): PluginMetadata {
    return {
      name: 'my-plugin',
      version: '1.0.0',
      description: 'My awesome Yampp plugin'
    };
  }

  getFunctions(): Map<string, PluginFunction> {
    const functions = new Map<string, PluginFunction>();

    functions.set('greet', {
      metadata: {
        name: 'greet',
        description: 'Greet someone',
        parameters: [
          { name: 'name', type: 'string', description: 'Name to greet' }
        ],
        hasReturnVariable: () => false
      },
      execute: async (args: string[], context: YamppContext) => {
        const name = args[0] || 'World';
        console.log(`Hello, ${name}!`);
      }
    });

    return functions;
  }
}
```

## Using in Yamfile

```yamfile
import @myorg/my-plugin

greet_task {
    my-plugin::greet("Alice")
}
```

## Type Definitions

### YamppPlugin

Main plugin interface with:
- `getMetadata()`: Returns plugin metadata
- `getFunctions()`: Returns map of available functions

### PluginFunction

Function definition with:
- `metadata`: Function metadata (name, description, parameters)
- `execute()`: Function implementation

### YamppContext

Execution context with:
- `variables`: Map of task variables
- `logger`: Logging interface
- `platform`: Current platform info
- `workingDirectory`: Current working directory

## Documentation

For complete documentation on plugin development, see:
- [Plugin Development Guide](https://github.com/matutetandil/yampp/blob/main/PLUGIN_DEVELOPMENT.md)
- [Yampp Documentation](https://github.com/matutetandil/yampp)

## License

MIT License - see [LICENSE](LICENSE) file for details.
