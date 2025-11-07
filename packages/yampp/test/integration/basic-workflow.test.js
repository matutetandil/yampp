import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Parser } from '../../dist/parser.js';
import { Validator } from '../../dist/validator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const fixturesDir = join(__dirname, '..', 'fixtures');

describe('Basic Workflow Integration', () => {
  describe('Parse and Validate Simple Yamfile', () => {
    it('should parse and validate simple Yamfile', () => {
      const yamfilePath = join(fixturesDir, 'simple.yamfile');
      const content = readFileSync(yamfilePath, 'utf-8');

      const parser = new Parser();
      const parseResult = parser.parse(content);

      assert.ok(parseResult.tasks);
      assert.ok(parseResult.tasks.has('build'));
      assert.ok(parseResult.tasks.has('test'));
      assert.ok(parseResult.tasks.has('cleanup'));

      const validator = new Validator();
      const validationResult = validator.validate(
        parseResult.tasks,
        parseResult.globalVariables,
        parseResult.globalConstants
      );

      assert.equal(validationResult.valid, true);
      assert.equal(validationResult.errors.length, 0);
    });

    it('should parse global variables', () => {
      const yamfilePath = join(fixturesDir, 'simple.yamfile');
      const content = readFileSync(yamfilePath, 'utf-8');

      const parser = new Parser();
      const result = parser.parse(content);

      assert.ok(result.globalVariables);
      assert.ok(result.globalVariables.has('PROJECT'));
      assert.equal(result.globalVariables.get('PROJECT'), 'test-project');
    });

    it('should parse task dependencies correctly', () => {
      const yamfilePath = join(fixturesDir, 'simple.yamfile');
      const content = readFileSync(yamfilePath, 'utf-8');

      const parser = new Parser();
      const result = parser.parse(content);

      const testTask = result.tasks.get('test');
      assert.ok(testTask);

      const deps = testTask.getDependencies();
      assert.ok(deps.includes('build'));
    });
  });

  describe('Parse and Validate Complex Yamfile', () => {
    it('should parse complex Yamfile with all features', () => {
      const yamfilePath = join(fixturesDir, 'complex.yamfile');
      const content = readFileSync(yamfilePath, 'utf-8');

      const parser = new Parser();
      const result = parser.parse(content);

      assert.ok(result.tasks.size > 0);

      // Check specific tasks
      assert.ok(result.tasks.has('compile'));
      assert.ok(result.tasks.has('cleanup'));
      assert.ok(result.tasks.has('deploy'));
      assert.ok(result.tasks.has('test'));
      assert.ok(result.tasks.has('build'));
    });

    it('should parse constants and variables', () => {
      const yamfilePath = join(fixturesDir, 'complex.yamfile');
      const content = readFileSync(yamfilePath, 'utf-8');

      const parser = new Parser();
      const result = parser.parse(content);

      assert.ok(result.globalConstants.has('VERSION'));
      assert.equal(result.globalConstants.get('VERSION'), '1.0.0');

      assert.ok(result.globalVariables.has('ENV'));
      assert.equal(result.globalVariables.get('ENV'), 'test');
    });

    it('should parse modifiers correctly', () => {
      const yamfilePath = join(fixturesDir, 'complex.yamfile');
      const content = readFileSync(yamfilePath, 'utf-8');

      const parser = new Parser();
      const result = parser.parse(content);

      const cleanupTask = result.tasks.get('cleanup');
      assert.ok(cleanupTask);
      assert.ok(cleanupTask.hasModifier('always'));

      const testTask = result.tasks.get('test');
      assert.ok(testTask);
      assert.ok(testTask.hasModifier('serial'));
    });

    it('should parse task parameters', () => {
      const yamfilePath = join(fixturesDir, 'complex.yamfile');
      const content = readFileSync(yamfilePath, 'utf-8');

      const parser = new Parser();
      const result = parser.parse(content);

      const deployTask = result.tasks.get('deploy');
      assert.ok(deployTask);

      const params = deployTask.getParameters();
      assert.ok(params.some(p => p.name === 'target'));
    });

    it('should parse file watches', () => {
      const yamfilePath = join(fixturesDir, 'complex.yamfile');
      const content = readFileSync(yamfilePath, 'utf-8');

      const parser = new Parser();
      const result = parser.parse(content);

      const buildTask = result.tasks.get('build');
      assert.ok(buildTask);

      const watches = buildTask.getWatchedFiles();
      assert.ok(watches.length > 0);
    });

    it('should parse hooks', () => {
      const yamfilePath = join(fixturesDir, 'complex.yamfile');
      const content = readFileSync(yamfilePath, 'utf-8');

      const parser = new Parser();
      const result = parser.parse(content);

      assert.ok(result.tasks.has('before_build'));
      assert.ok(result.tasks.has('after_build'));
    });

    it('should validate complex Yamfile', () => {
      const yamfilePath = join(fixturesDir, 'complex.yamfile');
      const content = readFileSync(yamfilePath, 'utf-8');

      const parser = new Parser();
      const parseResult = parser.parse(content);

      const validator = new Validator();
      const validationResult = validator.validate(
        parseResult.tasks,
        parseResult.globalVariables,
        parseResult.globalConstants
      );

      assert.equal(validationResult.valid, true);
      assert.equal(validationResult.errors.length, 0);
    });
  });

  describe('End-to-End Workflow', () => {
    it('should handle complete parse-validate workflow', () => {
      const yamfile = `
var PROJECT = "integration-test"

build {
    echo "Building $PROJECT"
}

test needs build {
    echo "Testing $PROJECT"
}
`;

      const parser = new Parser();
      const parseResult = parser.parse(yamfile);

      assert.ok(parseResult.tasks);
      assert.equal(parseResult.tasks.size, 2);

      const validator = new Validator();
      const validationResult = validator.validate(
        parseResult.tasks,
        parseResult.globalVariables,
        parseResult.globalConstants
      );

      assert.equal(validationResult.valid, true);
      assert.ok(validationResult.errors.length === 0);

      // Verify dependency chain
      const testTask = parseResult.tasks.get('test');
      const buildTask = parseResult.tasks.get('build');

      assert.ok(testTask);
      assert.ok(buildTask);
      assert.ok(testTask.getDependencies().includes('build'));
    });

    it('should detect validation errors in invalid Yamfile', () => {
      const yamfile = `
test needs nonexistent {
    echo "This will fail validation"
}
`;

      const parser = new Parser();
      const parseResult = parser.parse(yamfile);

      const validator = new Validator();
      const validationResult = validator.validate(
        parseResult.tasks,
        parseResult.globalVariables,
        parseResult.globalConstants
      );

      assert.equal(validationResult.valid, false);
      assert.ok(validationResult.errors.length > 0);
      assert.ok(validationResult.errors.some(e =>
        e.message && e.message.includes('nonexistent')
      ));
    });

    it('should handle orphaned hook detection', () => {
      const yamfile = `
before_missing {
    echo "This hook has no target task"
}
`;

      const parser = new Parser();
      const parseResult = parser.parse(yamfile);

      const validator = new Validator();
      const validationResult = validator.validate(
        parseResult.tasks,
        parseResult.globalVariables,
        parseResult.globalConstants
      );

      assert.equal(validationResult.valid, false);
      assert.ok(validationResult.errors.some(e =>
        e.message && e.message.includes('missing')
      ));
    });

    it('should allow global hooks', () => {
      const yamfile = `
before_all {
    echo "Starting..."
}

build {
    echo "Building..."
}

after_all {
    echo "Done"
}
`;

      const parser = new Parser();
      const parseResult = parser.parse(yamfile);

      const validator = new Validator();
      const validationResult = validator.validate(
        parseResult.tasks,
        parseResult.globalVariables,
        parseResult.globalConstants
      );

      // Global hooks should be valid
      assert.equal(validationResult.valid, true);
    });
  });
});
