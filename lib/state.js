import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { createHash } from 'crypto';

export class StateManager {
  constructor(stateDir = '.yampp') {
    this.stateDir = stateDir;
  }
  
  async ensureStateDir() {
    try {
      await fs.mkdir(this.stateDir, { recursive: true });
    } catch (error) {
      // Directory might already exist, that's fine
    }
  }
  
  getTaskStateFile(taskName) {
    return join(this.stateDir, `${taskName}.done`);
  }
  
  async isTaskDone(taskName) {
    try {
      const stateFile = this.getTaskStateFile(taskName);
      await fs.access(stateFile);
      return true;
    } catch {
      return false;
    }
  }
  
  async getTaskTimestamp(taskName) {
    try {
      const stateFile = this.getTaskStateFile(taskName);
      const stats = await fs.stat(stateFile);
      return stats.mtimeMs;
    } catch {
      return 0; // If file doesn't exist, return 0
    }
  }
  
  async markTaskDone(taskName) {
    await this.ensureStateDir();
    const stateFile = this.getTaskStateFile(taskName);
    
    const state = {
      task: taskName,
      completedAt: new Date().toISOString(),
      hash: this.generateHash(taskName)
    };
    
    await fs.writeFile(stateFile, JSON.stringify(state, null, 2));
  }
  
  async getTaskState(taskName) {
    try {
      const stateFile = this.getTaskStateFile(taskName);
      const content = await fs.readFile(stateFile, 'utf-8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }
  
  async clearTaskState(taskName) {
    try {
      const stateFile = this.getTaskStateFile(taskName);
      await fs.unlink(stateFile);
    } catch {
      // File might not exist, that's fine
    }
  }
  
  async cleanAll() {
    try {
      await fs.rm(this.stateDir, { recursive: true, force: true });
    } catch {
      // Directory might not exist, that's fine
    }
  }
  
  async listCachedTasks() {
    try {
      await this.ensureStateDir();
      const files = await fs.readdir(this.stateDir);
      const tasks = [];
      
      for (const file of files) {
        if (file.endsWith('.done')) {
          const taskName = file.replace('.done', '');
          const state = await this.getTaskState(taskName);
          tasks.push({
            name: taskName,
            completedAt: state?.completedAt || 'unknown'
          });
        }
      }
      
      return tasks;
    } catch {
      return [];
    }
  }
  
  generateHash(taskName) {
    const hash = createHash('sha256');
    hash.update(taskName);
    hash.update(Date.now().toString());
    return hash.digest('hex').substring(0, 16);
  }
  
  async invalidateIfChanged(taskName, commands) {
    const state = await this.getTaskState(taskName);
    if (!state) return;
    
    const currentHash = this.generateCommandsHash(commands);
    if (state.commandsHash && state.commandsHash !== currentHash) {
      await this.clearTaskState(taskName);
    }
  }
  
  generateCommandsHash(commands) {
    const hash = createHash('sha256');
    for (const cmd of commands) {
      hash.update(cmd);
    }
    return hash.digest('hex');
  }
}