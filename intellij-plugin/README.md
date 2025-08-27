# Yam++ IntelliJ Plugin

IntelliJ IDEA plugin for Yam++ task runner support.

## Features

- **Syntax Highlighting**: Complete syntax highlighting for Yamfile DSL including:
  - Task definitions with modifiers (`always`, `serial`, `critical`)
  - Task parameters and dependencies
  - Variable declarations (`const`, `var`) and environment variables (`env`)
  - Internal function calls (`__call`, `_assign`)
  - File watching patterns (`watches`)
  - Comments (single-line `//` and multi-line `/* */`)
- **Code Completion**: Intelligent code completion for tasks, modifiers, and dependencies
- **Task Execution**: Run tasks directly from the IDE with full parameter support
- **Run Line Markers**: Click to run tasks from the editor gutter
- **Structure View**: Navigate tasks and dependencies in the structure view
- **Validation**: Real-time syntax and semantic validation
- **Tool Window**: Dedicated tool window for task management and visualization

## Installation

### From JetBrains Marketplace
1. Open IntelliJ IDEA
2. Go to `Settings/Preferences` → `Plugins`
3. Search for "Yam++ Task Runner"
4. Click `Install`

### From Disk
1. Build the plugin: `./gradlew buildPlugin`
2. Go to `Settings/Preferences` → `Plugins`
3. Click the gear icon → `Install Plugin from Disk`
4. Select the built plugin from `build/distributions/`

## Usage

### Running Tasks
- **From Editor**: Click the run icon in the gutter next to a task definition
- **From Menu**: `Run` → `Run Yam++ Task`
- **Keyboard Shortcut**: `Ctrl+Shift+Y` (Cmd+Shift+Y on macOS)

### Task Management
- Open the Yam++ tool window from the right sidebar
- View all tasks in the current project
- Double-click to run a task
- Right-click for more options

## Development

### Building
```bash
./gradlew buildPlugin
```

### Running in IDE
```bash
./gradlew runIde
```

### Testing
```bash
./gradlew test
```

## Requirements

- IntelliJ IDEA 2023.3 or later
- Java 17 or later
- [Yam++ Task Runner](https://github.com/matutetandil/yampp) installed globally via npm:
  ```bash
  npm install -g yampp
  ```

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

## Release Notes

See [CHANGELOG.md](./CHANGELOG.md) for detailed release notes.

## Issues and Feedback

Report issues at: https://github.com/matutetandil/yampp/issues

## License

MIT