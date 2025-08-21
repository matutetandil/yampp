# Yam++ IntelliJ Plugin

IntelliJ IDEA plugin for Yam++ task runner support.

## Features

- **Syntax Highlighting**: Full syntax highlighting for Yamfile
- **Code Completion**: Intelligent code completion for tasks, modifiers, and dependencies
- **Task Execution**: Run tasks directly from the IDE
- **Run Line Markers**: Click to run tasks from the editor gutter
- **Structure View**: Navigate tasks in the structure view
- **Validation**: Real-time syntax and semantic validation
- **Tool Window**: Dedicated tool window for task management

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

## TODO

This is a stub implementation. The following features need to be completed:

- [ ] Proper lexer and parser implementation
- [ ] Full syntax highlighting rules
- [ ] Complete code completion provider
- [ ] Error highlighting and quick fixes
- [ ] Debugger support
- [ ] Task dependency visualization
- [ ] Integration with project tool window
- [ ] Settings/preferences page
- [ ] Documentation provider
- [ ] Refactoring support

## License

MIT