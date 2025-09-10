import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { createHash } from 'crypto';
import { TaskState } from './tasks/types/task-state.js';
import { CachedTask } from './cache/types/cached-task.js';

export class StateManager {
  private readonly stateDir: string;

  constructor(stateDir: string = '.yampp') {
    this.stateDir = stateDir;
  }
  
  private async ensureStateDir(): Promise<void> {
    try {
      await fs.mkdir(this.stateDir, { recursive: true });
    } catch (error) {
      // Directory might already exist, that's fine
    }
  }
  
  private getTaskStateFile(taskName: string): string {
    return join(this.stateDir, `${taskName}.done`);
  }
  
  public async isTaskDone(taskName: string): Promise<boolean> {
    try {
      const stateFile = this.getTaskStateFile(taskName);
      await fs.access(stateFile);
      return true;
    } catch {
      return false;
    }
  }
  
  public async getTaskTimestamp(taskName: string): Promise<number> {
    try {
      const stateFile = this.getTaskStateFile(taskName);
      const stats = await fs.stat(stateFile);
      return stats.mtimeMs;
    } catch {
      return 0; // If file doesn't exist, return 0
    }
  }
  
  public async markTaskDone(taskName: string): Promise<void> {
    await this.ensureStateDir();
    const stateFile = this.getTaskStateFile(taskName);
    
    const state: TaskState = {
      task: taskName,
      completedAt: new Date().toISOString(),
      hash: this.generateHash(taskName)
    };
    
    await fs.writeFile(stateFile, JSON.stringify(state, null, 2));
  }
  
  public async getTaskState(taskName: string): Promise<TaskState | null> {
    try {
      const stateFile = this.getTaskStateFile(taskName);
      const content = await fs.readFile(stateFile, 'utf-8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }
  
  public async clearTaskState(taskName: string): Promise<void> {
    try {
      const stateFile = this.getTaskStateFile(taskName);
      await fs.unlink(stateFile);
    } catch {
      // File might not exist, that's fine
    }
  }
  
  public async cleanAll(): Promise<void> {
    try {
      await fs.rm(this.stateDir, { recursive: true, force: true });
    } catch {
      // Directory might not exist, that's fine
    }
  }
  
  public async clean(taskName: string): Promise<void> {
    await this.clearTaskState(taskName);
  }
  
  public async listCachedTasks(): Promise<CachedTask[]> {
    try {
      await this.ensureStateDir();
      const files = await fs.readdir(this.stateDir);
      const tasks: CachedTask[] = [];
      
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
  
  private generateHash(taskName: string): string {
    const hash = createHash('sha256');
    hash.update(taskName);
    hash.update(Date.now().toString());
    return hash.digest('hex').substring(0, 16);
  }
  
  public async invalidateIfChanged(taskName: string, commands: string[]): Promise<void> {
    const state = await this.getTaskState(taskName);
    if (!state) return;
    
    const currentHash = this.generateCommandsHash(commands);
    if (state.commandsHash && state.commandsHash !== currentHash) {
      await this.clearTaskState(taskName);
    }
  }
  
  private generateCommandsHash(commands: string[]): string {
    const hash = createHash('sha256');
    for (const cmd of commands) {
      hash.update(cmd);
    }
    return hash.digest('hex');
  }
}