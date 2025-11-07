import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Task } from '../../dist/models/task.js';

describe('Task', () => {
  describe('Task Creation', () => {
    it('should create task with name', () => {
      const task = new Task({ name: 'build' });

      assert.equal(task.getName(), 'build');
    });

    it('should initialize with empty commands by default', () => {
      const task = new Task({ name: 'test' });

      assert.equal(task.getCommands().length, 0);
    });

    it('should initialize with empty dependencies by default', () => {
      const task = new Task({ name: 'deploy' });

      assert.equal(task.getDependencies().length, 0);
    });

    it('should create task with commands', () => {
      const task = new Task({
        name: 'build',
        commands: ['npm run build', 'echo "Done"']
      });

      const commands = task.getCommands();
      assert.equal(commands.length, 2);
      assert.equal(commands[0], 'npm run build');
      assert.equal(commands[1], 'echo "Done"');
    });
  });

  describe('Commands', () => {
    it('should store multiple commands', () => {
      const task = new Task({
        name: 'test',
        commands: ['npm run lint', 'npm test', 'npm run coverage']
      });

      const commands = task.getCommands();
      assert.equal(commands.length, 3);
    });

    it('should maintain command order', () => {
      const task = new Task({
        name: 'deploy',
        commands: ['first', 'second', 'third']
      });

      const commands = task.getCommands();
      assert.equal(commands[0], 'first');
      assert.equal(commands[1], 'second');
      assert.equal(commands[2], 'third');
    });
  });

  describe('Dependencies', () => {
    it('should create task with dependencies', () => {
      const task = new Task({
        name: 'test',
        dependencies: ['build']
      });

      const deps = task.getDependencies();
      assert.equal(deps.length, 1);
      assert.ok(deps.includes('build'));
    });

    it('should create task with multiple dependencies', () => {
      const task = new Task({
        name: 'deploy',
        dependencies: ['build', 'test', 'lint']
      });

      const deps = task.getDependencies();
      assert.equal(deps.length, 3);
      assert.ok(deps.includes('build'));
      assert.ok(deps.includes('test'));
      assert.ok(deps.includes('lint'));
    });

    it('should support optional dependencies', () => {
      const task = new Task({
        name: 'build',
        optionalDependencies: ['optional_dep']
      });

      const optDeps = task.getOptionalDependencies();
      assert.equal(optDeps.length, 1);
      assert.ok(optDeps.includes('optional_dep'));
    });
  });

  describe('Modifiers', () => {
    it('should create task with modifiers', () => {
      const task = new Task({
        name: 'backup',
        modifiers: ['always']
      });

      assert.ok(task.hasModifier('always'));
    });

    it('should create task with multiple modifiers', () => {
      const task = new Task({
        name: 'critical_task',
        modifiers: ['always', 'serial', 'critical']
      });

      assert.ok(task.hasModifier('always'));
      assert.ok(task.hasModifier('serial'));
      assert.ok(task.hasModifier('critical'));
    });

    it('should return false for non-existent modifier', () => {
      const task = new Task({ name: 'build' });

      assert.equal(task.hasModifier('nonexistent'), false);
    });

    it('should get all modifiers', () => {
      const task = new Task({
        name: 'test',
        modifiers: ['always', 'serial']
      });

      const modifiers = task.getModifiers();
      assert.ok(modifiers.has('always'));
      assert.ok(modifiers.has('serial'));
    });
  });

  describe('Parameters', () => {
    it('should create task with parameters', () => {
      const task = new Task({
        name: 'deploy',
        parameters: [{ name: 'env', defaultValue: null }]
      });

      const params = task.getParameters();
      assert.equal(params.length, 1);
      assert.equal(params[0].name, 'env');
    });

    it('should create task with multiple parameters', () => {
      const task = new Task({
        name: 'deploy',
        parameters: [
          { name: 'env', defaultValue: null },
          { name: 'region', defaultValue: null },
          { name: 'version', defaultValue: null }
        ]
      });

      const params = task.getParameters();
      assert.equal(params.length, 3);
      assert.equal(params[0].name, 'env');
      assert.equal(params[1].name, 'region');
      assert.equal(params[2].name, 'version');
    });

    it('should support parameters with default values', () => {
      const task = new Task({
        name: 'build',
        parameters: [{ name: 'env', defaultValue: 'dev' }]
      });

      const params = task.getParameters();
      assert.equal(params.length, 1);
      assert.equal(params[0].defaultValue, 'dev');
    });
  });

  describe('Variables', () => {
    it('should create task with local variables', () => {
      const localVars = new Map([['BUILD_TIME', 'now']]);
      const task = new Task({
        name: 'build',
        localVariables: localVars
      });

      const variables = task.getLocalVariables();
      assert.ok(variables.has('BUILD_TIME'));
      assert.equal(variables.get('BUILD_TIME'), 'now');
    });

    it('should support runtime variables', () => {
      const task = new Task({ name: 'test' });

      // Runtime variables are mutable
      const vars = task.getVariables();
      vars.set('COUNTER', '1');

      assert.equal(task.getVariables().get('COUNTER'), '1');
    });

    it('should support local constants', () => {
      const localConsts = new Map([['API_KEY', 'secret']]);
      const task = new Task({
        name: 'deploy',
        localConstants: localConsts
      });

      const constants = task.getLocalConstants();
      assert.ok(constants.has('API_KEY'));
      assert.equal(constants.get('API_KEY'), 'secret');
    });
  });

  describe('File Watching', () => {
    it('should create task with watch patterns', () => {
      const task = new Task({
        name: 'build',
        watchedFiles: ['src/**/*.ts']
      });

      const watches = task.getWatchedFiles();
      assert.equal(watches.length, 1);
      assert.ok(watches.includes('src/**/*.ts'));
    });

    it('should support multiple watch patterns', () => {
      const task = new Task({
        name: 'build',
        watchedFiles: ['src/**/*.ts', 'package.json', 'tsconfig.json']
      });

      const watches = task.getWatchedFiles();
      assert.equal(watches.length, 3);
    });
  });

  describe('Task Status', () => {
    it('should initialize with pending status', () => {
      const task = new Task({ name: 'build' });

      assert.equal(task.getStatus(), 'pending');
    });

    it('should allow status updates', () => {
      const task = new Task({ name: 'test' });

      task.setStatus('running');
      assert.equal(task.getStatus(), 'running');

      task.setStatus('completed');
      assert.equal(task.getStatus(), 'completed');
    });

    it('should support error state', () => {
      const task = new Task({ name: 'deploy' });

      assert.equal(task.getError(), null);

      task.setError('Deployment failed');
      assert.equal(task.getError(), 'Deployment failed');
    });
  });

  describe('Task Properties', () => {
    it('should store line number', () => {
      const task = new Task({
        name: 'build',
        lineNumber: 42
      });

      assert.equal(task.getLineNumber(), 42);
    });

    it('should handle null line number', () => {
      const task = new Task({ name: 'test' });

      assert.equal(task.getLineNumber(), null);
    });

    it('should support dependency parameters', () => {
      const task = new Task({
        name: 'test',
        dependencyParams: {
          'build': [{ name: 'env', defaultValue: 'test' }]
        }
      });

      const depParams = task.getDependencyParams();
      assert.ok(depParams['build']);
      assert.equal(depParams['build'].length, 1);
    });
  });
});
