# Yam++ Task Runner VS Code Extension

Language support and task runner integration for Yamfile syntax in Visual Studio Code.

## Features

- **Syntax Highlighting**: Complete syntax highlighting for Yamfile DSL including:
  - Task definitions with modifiers (`always`, `serial`, `critical`)
  - Task parameters and dependencies
  - Variable declarations (`const`, `var`) and environment variables (`env`)
  - Internal function calls (`__call`, `_assign`)
  - File watching patterns (`watches`)
  - Comments (single-line `//` and multi-line `/* */`)

- **Task Integration**: Run Yam++ tasks directly from VS Code
  - Command palette commands for running tasks
  - Context menu integration
  - Task provider for VS Code's built-in Tasks system

- **Code Intelligence**: 
  - Code completion for task names and modifiers
  - Hover documentation for tasks
  - Task detection and listing

## Installation

Install from the VS Code Marketplace or from VSIX package.

## Usage

1. Open a project containing a `Yamfile`
2. The extension automatically activates and provides syntax highlighting
3. Use Command Palette (`Ctrl+Shift+P`) to access Yam++ commands:
   - `Yam++: Run Task` - Execute a specific task
   - `Yam++: Run All Tasks` - Execute all tasks
   - `Yam++: List Tasks` - Show all available tasks
   - `Yam++: Clean Cache` - Clean .done cache files
   - `Yam++: Show Dependency Graph` - Visualize task dependencies

## Yamfile Syntax Example

```yamfile
// Environment variable
env NODE_ENV

// Constants and variables  
const VERSION = "1.0.0"
var BUILD_DIR = "dist"

// Task with modifiers, parameters, and dependencies
always: build(target) needs compile watches "src/**/*.js" {
    echo "Building $target version $VERSION"
    mkdir -p $BUILD_DIR
    __call webpack --mode=production
}

serial critical: deploy needs build(prod) {
    echo "Deploying to production"
    _assign DEPLOYED_VERSION = $VERSION
}
```

## Configuration

Configure the extension in VS Code settings:

- `yampp.defaultJobs`: Default number of parallel jobs (0 = auto)
- `yampp.showTasksInExplorer`: Show Yam++ tasks in Explorer sidebar
- `yampp.autoDetectTasks`: Automatically detect Yam++ tasks

## Requirements

- [Yam++ Task Runner](https://github.com/matutetandil/yampp) installed globally via npm:
  ```bash
  npm install -g yampp
  ```

## Release Notes

See [CHANGELOG.md](./CHANGELOG.md) for detailed release notes.

## Issues and Feedback

Report issues at: https://github.com/matutetandil/yampp/issues

## License

MIT License - see the main Yam++ repository for details.