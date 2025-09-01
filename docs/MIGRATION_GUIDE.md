# Migration Guide

Complete guide for migrating from other task runners to Yampp.

## Table of Contents

- [AI-Powered Translation](#ai-powered-translation)
- [Manual Migration Patterns](#manual-migration-patterns)
- [Makefile to Yamfile](#makefile-to-yamfile)
- [Gulp to Yamfile](#gulp-to-yamfile)
- [npm scripts to Yamfile](#npm-scripts-to-yamfile)
- [Grunt to Yamfile](#grunt-to-yamfile)
- [Jake to Yamfile](#jake-to-yamfile)
- [Just to Yamfile](#just-to-yamfile)
- [Common Patterns](#common-patterns)

## AI-Powered Translation

### yampp-translator Tool

The easiest way to migrate is using our AI-powered translator that supports 9 AI providers and 4 AI editor agents.

#### Installation

```bash
npm install -g yampp-translator
```

#### Quick Usage

```bash
# Translate Makefile
yampp-translator translate Makefile

# Translate Gulpfile
yampp-translator translate gulpfile.js

# Translate package.json scripts
yampp-translator translate package.json

# Use specific AI provider
yampp-translator translate Makefile --provider openai --model gpt-4o

# Interactive mode
yampp-translator translate Makefile --interactive
```

#### Supported AI Providers

| Provider | Best For | Setup Required |
|----------|----------|----------------|
| Ollama | Local/Free | Install Ollama locally |
| Claude | High quality | Anthropic API key |
| OpenAI | Industry standard | OpenAI API key |
| Google Gemini | Google ecosystem | Google AI API key |
| Mistral AI | EU/GDPR compliant | Mistral API key |
| DeepSeek | Code specialist | DeepSeek API key |
| Hugging Face | Open source models | HF API token |
| Cohere | Enterprise | Cohere API key |
| Grok | X integration | X AI API key |

#### AI Editor Agents

Use specialized agents in your favorite AI-powered editor:

**Claude Code:**
```bash
# Generate agent file
yampp-translator agent claude-code > yampp-agent.md
# Then paste into Claude Code conversation
```

**Cursor AI:**
```bash
# Add to .cursorrules
yampp-translator agent cursor >> .cursorrules
```

**GitHub Copilot:**
```bash
# Add to repository
yampp-translator agent copilot > .github/copilot-instructions.md
```

**JetBrains AI:**
```bash
# Generate guidelines
yampp-translator agent jetbrains > ai-guidelines.md
```

## Manual Migration Patterns

### Core Concepts Mapping

| Concept | Make | Gulp | npm scripts | Yampp |
|---------|------|------|-------------|-------|
| Task Definition | target: | gulp.task() | "script": | taskname { } |
| Dependencies | target: dep1 dep2 | gulp.series() | pre/post scripts | needs dep1 dep2 |
| Variables | VAR=value | const var | N/A | var/const |
| Parallel | make -j | gulp.parallel() | npm-run-all | default behavior |
| Serial | default | gulp.series() | && | serial: modifier |
| File Watch | target: file.c | gulp.watch() | nodemon/watch | watches pattern |
| Clean | .PHONY | N/A | rm -rf | always: modifier |

## Makefile to Yamfile

### Basic Target

**Makefile:**
```makefile
build:
	gcc -o app main.c
	strip app
```

**Yamfile:**
```yamfile
build {
    gcc -o app main.c
    strip app
}
```

### Dependencies

**Makefile:**
```makefile
all: clean build test

clean:
	rm -rf dist/

build: clean
	mkdir dist
	gcc -o dist/app src/*.c

test: build
	./dist/app --test
```

**Yamfile:**
```yamfile
all needs clean build test {
    echo "Build complete"
}

clean {
    rm -rf dist/
}

build needs clean {
    mkdir dist
    gcc -o dist/app src/*.c
}

test needs build {
    ./dist/app --test
}
```

### Variables

**Makefile:**
```makefile
CC = gcc
CFLAGS = -Wall -O2
TARGET = myapp

$(TARGET): main.c
	$(CC) $(CFLAGS) -o $(TARGET) main.c
```

**Yamfile:**
```yamfile
var CC = "gcc"
var CFLAGS = "-Wall -O2"
var TARGET = "myapp"

build {
    $CC $CFLAGS -o $TARGET main.c
}
```

### Pattern Rules

**Makefile:**
```makefile
%.o: %.c
	$(CC) -c $< -o $@

app: main.o utils.o
	$(CC) $^ -o $@
```

**Yamfile:**
```yamfile
compile_main {
    gcc -c main.c -o main.o
}

compile_utils {
    gcc -c utils.c -o utils.o
}

app needs compile_main compile_utils {
    gcc main.o utils.o -o app
}
```

### File Dependencies

**Makefile:**
```makefile
output.txt: input.txt
	process < input.txt > output.txt
```

**Yamfile:**
```yamfile
output watches input.txt {
    process < input.txt > output.txt
}
```

### Phony Targets

**Makefile:**
```makefile
.PHONY: clean test install

clean:
	rm -rf build/

test:
	pytest

install:
	pip install -r requirements.txt
```

**Yamfile:**
```yamfile
always: clean {
    rm -rf build/
}

always: test {
    pytest
}

always: install {
    pip install -r requirements.txt
}
```

## Gulp to Yamfile

### Basic Task

**Gulpfile:**
```javascript
gulp.task('build', function() {
    return gulp.src('src/*.js')
        .pipe(babel())
        .pipe(gulp.dest('dist'));
});
```

**Yamfile:**
```yamfile
build {
    npx babel src --out-dir dist
}
```

### Series Tasks

**Gulpfile:**
```javascript
gulp.task('clean', () => del(['dist']));
gulp.task('build', () => /* ... */);
gulp.task('deploy', gulp.series('clean', 'build', () => {
    // deploy code
}));
```

**Yamfile:**
```yamfile
clean {
    rm -rf dist
}

build {
    npm run build
}

serial: deploy needs clean build {
    # deploy code
}
```

### Parallel Tasks

**Gulpfile:**
```javascript
gulp.task('css', () => /* process CSS */);
gulp.task('js', () => /* process JS */);
gulp.task('build', gulp.parallel('css', 'js'));
```

**Yamfile:**
```yamfile
css {
    # process CSS
}

js {
    # process JS
}

build needs css js {
    echo "Build complete"
}
```

### Watch Tasks

**Gulpfile:**
```javascript
gulp.task('watch', () => {
    gulp.watch('src/**/*.scss', gulp.series('css'));
    gulp.watch('src/**/*.js', gulp.series('js'));
});
```

**Yamfile:**
```yamfile
css watches src/**/*.scss {
    sass src/styles.scss dist/styles.css
}

js watches src/**/*.js {
    npx babel src --out-dir dist
}

watch needs css js {
    echo "Watching for changes..."
    # The watches declarations handle the file watching
}
```

### Complex Pipeline

**Gulpfile:**
```javascript
const sass = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');
const cleanCSS = require('gulp-clean-css');

gulp.task('styles', () => {
    return gulp.src('src/scss/**/*.scss')
        .pipe(sass())
        .pipe(autoprefixer())
        .pipe(cleanCSS())
        .pipe(gulp.dest('dist/css'));
});
```

**Yamfile:**
```yamfile
styles watches src/scss/**/*.scss {
    # Using npm scripts or CLI tools
    npx sass src/scss:dist/css
    npx postcss dist/css/**/*.css --use autoprefixer -d dist/css
    npx cleancss -o dist/css/styles.min.css dist/css/styles.css
}
```

## npm scripts to Yamfile

### Basic Scripts

**package.json:**
```json
{
  "scripts": {
    "build": "webpack",
    "test": "jest",
    "lint": "eslint src/",
    "start": "node server.js"
  }
}
```

**Yamfile:**
```yamfile
build {
    webpack
}

test {
    jest
}

lint {
    eslint src/
}

start {
    node server.js
}
```

### Pre/Post Scripts

**package.json:**
```json
{
  "scripts": {
    "prebuild": "npm run clean",
    "build": "webpack",
    "postbuild": "npm run copy-assets",
    "clean": "rimraf dist",
    "copy-assets": "cp -r assets dist/"
  }
}
```

**Yamfile:**
```yamfile
clean {
    rimraf dist
}

copy_assets {
    cp -r assets dist/
}

build needs clean {
    webpack
    __call copy_assets
}
```

### Complex Scripts

**package.json:**
```json
{
  "scripts": {
    "dev": "concurrently \"npm:watch:*\"",
    "watch:css": "sass --watch src:dist",
    "watch:js": "webpack --watch",
    "build:prod": "NODE_ENV=production webpack --mode production",
    "deploy": "npm run build:prod && scp -r dist/* user@server:/var/www"
  }
}
```

**Yamfile:**
```yamfile
watch_css {
    sass --watch src:dist
}

watch_js {
    webpack --watch
}

dev needs watch_css watch_js {
    echo "Development mode active"
}

build_prod {
    NODE_ENV=production webpack --mode production
}

deploy needs build_prod {
    scp -r dist/* user@server:/var/www
}
```

### Environment Variables

**package.json:**
```json
{
  "scripts": {
    "start:dev": "NODE_ENV=development node server.js",
    "start:prod": "NODE_ENV=production node server.js",
    "build": "cross-env NODE_ENV=production webpack"
  }
}
```

**Yamfile:**
```yamfile
start_dev {
    NODE_ENV=development node server.js
}

start_prod {
    NODE_ENV=production node server.js
}

build {
    NODE_ENV=production webpack
}
```

## Grunt to Yamfile

### Basic Configuration

**Gruntfile:**
```javascript
grunt.initConfig({
    clean: ['dist'],
    copy: {
        main: {
            src: 'src/**',
            dest: 'dist/'
        }
    }
});

grunt.registerTask('build', ['clean', 'copy']);
```

**Yamfile:**
```yamfile
clean {
    rm -rf dist
}

copy {
    cp -r src/* dist/
}

build needs clean copy {
    echo "Build complete"
}
```

## Jake to Yamfile

### Basic Task

**Jakefile:**
```javascript
desc('Build the project');
task('build', [], function() {
    jake.exec('npm run compile', {printStdout: true});
});
```

**Yamfile:**
```yamfile
build {
    npm run compile
}
```

## Just to Yamfile

### Basic Recipe

**Justfile:**
```just
build:
    cargo build --release

test: build
    cargo test

clean:
    cargo clean
```

**Yamfile:**
```yamfile
build {
    cargo build --release
}

test needs build {
    cargo test
}

clean {
    cargo clean
}
```

## Common Patterns

### Conditional Execution

**Other tools:** Often require scripting or plugins

**Yamfile:**
```yamfile
deploy {
    __input_select "Deploy environment:" env ["dev", "staging", "prod"] "dev"
    
    if [ "$env" = "prod" ]; then
        __input_confirm "Deploy to PRODUCTION?" confirm "false"
        if [ "$confirm" != "true" ]; then
            echo "Deployment cancelled"
            exit 1
        fi
    fi
    
    ./deploy.sh --env $env
}
```

### Cross-Platform Support

**Other tools:** Often require separate configurations or scripts

**Yamfile:**
```yamfile
@linux @mac: install {
    ./install.sh
}

@windows: install {
    .\install.ps1
}
```

### Dynamic Task Generation

**Make:** Complex pattern rules
**Gulp:** Programmatic task creation
**npm:** Not supported

**Yamfile with parameters:**
```yamfile
build(env = "dev") {
    echo "Building for $env"
    npm run build:$env
}

// Can be called as:
// yampp "build(prod)"
// yampp "build(staging)"
```

### Parallel Execution Control

**Make:** `make -j4`
**Gulp:** `gulp.parallel()` with limited control
**npm:** Requires additional tools like `concurrently`

**Yamfile:**
```bash
# Natural parallelism
yampp build test lint  # All run in parallel

# Limited parallelism
yampp -j 2 task1 task2 task3  # Max 2 concurrent

# Force serial
serial: deploy needs build test {
    ./deploy.sh
}
```

### Advanced File Watching

**Make:** Limited to modification times
**Gulp:** Requires gulp.watch() setup
**npm:** Requires nodemon or similar

**Yamfile:**
```yamfile
// Automatic rebuild on change
build watches src/**/*.ts {
    tsc
}

// Multiple watch patterns
test watches src/**/*.ts tests/**/*.spec.ts {
    jest
}

// Conditional execution based on file changes
docs watches src/**/*.ts README.md {
    typedoc
}
```

## Migration Checklist

1. **Inventory existing tasks** - List all current build tasks
2. **Identify dependencies** - Map task relationships
3. **Extract variables** - Find all configuration values
4. **Check for file watches** - Identify file-based triggers
5. **Review scripts** - Understand command sequences
6. **Platform considerations** - Note OS-specific commands
7. **Use yampp-translator** - Try AI-powered translation first
8. **Manual refinement** - Adjust generated Yamfile as needed
9. **Test incrementally** - Migrate and test one task at a time
10. **Optimize** - Leverage Yampp's parallel execution

## Best Practices for Migration

1. **Start simple** - Migrate basic tasks first
2. **Preserve behavior** - Ensure functionality remains the same
3. **Leverage Yampp features** - Use internal functions and modifiers
4. **Improve incrementally** - Optimize after migration works
5. **Document changes** - Note any behavioral differences
6. **Test thoroughly** - Use `--dry-run` to verify
7. **Keep both temporarily** - Run old and new in parallel during transition
8. **Use version control** - Commit working migrations incrementally

## Getting Help

- Use `yampp-translator` for automated translation
- Check [examples/](../examples/) for common patterns
- Read the [User Guide](./USER_GUIDE.md) for detailed syntax
- Submit issues at [GitHub Issues](https://github.com/yourusername/yampp/issues)