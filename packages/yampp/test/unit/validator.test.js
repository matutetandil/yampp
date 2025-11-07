import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Validator } from '../../dist/validator.js';
import { Task } from '../../dist/models/task.js';

describe('Validator', () => {
  describe('Global Declarations', () => {
    it('should validate valid global variables and constants', () => {
      const validator = new Validator();
      const tasks = new Map();
      const globalVariables = new Map([['PROJECT', 'test']]);
      const globalConstants = new Map([['VERSION', '1.0.0']]);

      const result = validator.validate(tasks, globalVariables, globalConstants);

      assert.equal(result.valid, true);
      assert.equal(result.errors.length, 0);
    });
  });

  describe('Task Name Validation', () => {
    it('should validate valid task names', () => {
      const validator = new Validator();
      const task = new Task({
        name: 'build',
        commands: ['echo "Building..."']
      });
      const tasks = new Map([['build', task]]);

      const result = validator.validate(tasks);

      assert.equal(result.valid, true);
      assert.equal(result.errors.length, 0);
    });

    it('should reject empty task names', () => {
      const validator = new Validator();
      const task = new Task({ name: '' });
      const tasks = new Map([['', task]]);

      const result = validator.validate(tasks);

      assert.equal(result.valid, false);
      assert.ok(result.errors.length > 0);
    });
  });

  describe('Dependency Validation', () => {
    it('should validate tasks with valid dependencies', () => {
      const validator = new Validator();

      const build = new Task({
        name: 'build',
        commands: ['echo "Building..."']
      });

      const test = new Task({
        name: 'test',
        commands: ['echo "Testing..."'],
        dependencies: ['build']
      });

      const tasks = new Map([
        ['build', build],
        ['test', test]
      ]);

      const result = validator.validate(tasks);

      assert.equal(result.valid, true);
      assert.equal(result.errors.length, 0);
    });

    it('should detect missing dependencies', () => {
      const validator = new Validator();

      const test = new Task({
        name: 'test',
        commands: ['echo "Testing..."'],
        dependencies: ['nonexistent']
      });

      const tasks = new Map([['test', test]]);

      const result = validator.validate(tasks);

      assert.equal(result.valid, false);
      assert.ok(result.errors.some(e =>
        e.message && e.message.includes('nonexistent')
      ));
    });

    it('should detect circular dependencies', () => {
      const validator = new Validator();

      const taskA = new Task({
        name: 'taskA',
        dependencies: ['taskB']
      });

      const taskB = new Task({
        name: 'taskB',
        dependencies: ['taskA']
      });

      const tasks = new Map([
        ['taskA', taskA],
        ['taskB', taskB]
      ]);

      const result = validator.validate(tasks);

      assert.equal(result.valid, false);
      assert.ok(result.errors.some(e =>
        e.message && (e.message.toLowerCase().includes('circular') || e.message.toLowerCase().includes('cycle'))
      ));
    });
  });

  describe('Command Validation', () => {
    it('should validate tasks with commands', () => {
      const validator = new Validator();

      const task = new Task({
        name: 'build',
        commands: ['echo "test"', 'npm run build']
      });

      const tasks = new Map([['build', task]]);

      const result = validator.validate(tasks);

      assert.equal(result.valid, true);
    });

    it('should handle tasks with no commands', () => {
      const validator = new Validator();

      const task = new Task({
        name: 'empty',
        commands: []
      });

      const tasks = new Map([['empty', task]]);

      const result = validator.validate(tasks);

      // Empty tasks might be valid (e.g., organizational tasks)
      assert.equal(typeof result.valid, 'boolean');
    });
  });

  describe('Hook Validation', () => {
    it('should validate valid hook relationships', () => {
      const validator = new Validator();

      const build = new Task({
        name: 'build',
        commands: ['npm run build']
      });

      const beforeBuild = new Task({
        name: 'before_build',
        commands: ['echo "Preparing..."']
      });

      const tasks = new Map([
        ['build', build],
        ['before_build', beforeBuild]
      ]);

      const result = validator.validate(tasks);

      assert.equal(result.valid, true);
    });

    it('should detect orphaned hooks', () => {
      const validator = new Validator();

      const beforeMissing = new Task({
        name: 'before_missing',
        commands: ['echo "Before..."']
      });

      const tasks = new Map([['before_missing', beforeMissing]]);

      const result = validator.validate(tasks);

      assert.equal(result.valid, false);
      assert.ok(result.errors.some(e =>
        e.message && e.message.includes('missing')
      ));
    });

    it('should allow global hooks without specific tasks', () => {
      const validator = new Validator();

      const beforeAll = new Task({
        name: 'before_all',
        commands: ['echo "Starting..."']
      });

      const afterAll = new Task({
        name: 'after_all',
        commands: ['echo "Done"']
      });

      const tasks = new Map([
        ['before_all', beforeAll],
        ['after_all', afterAll]
      ]);

      const result = validator.validate(tasks);

      // Global hooks are special and should be valid
      assert.equal(result.valid, true);
    });
  });

  describe('Modifier Validation', () => {
    it('should validate known modifiers', () => {
      const validator = new Validator();

      const task = new Task({
        name: 'build',
        commands: ['npm run build'],
        modifiers: ['always', 'serial']
      });

      const tasks = new Map([['build', task]]);

      const result = validator.validate(tasks);

      assert.equal(result.valid, true);
    });
  });

  describe('Parameter Validation', () => {
    it('should validate tasks with parameters', () => {
      const validator = new Validator();

      const deploy = new Task({
        name: 'deploy',
        commands: ['echo "Deploying to $env"'],
        parameters: [{ name: 'env', defaultValue: null }]
      });

      const tasks = new Map([['deploy', deploy]]);

      const result = validator.validate(tasks);

      assert.equal(result.valid, true);
    });
  });
});
