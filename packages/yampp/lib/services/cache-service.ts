import { ICacheService } from '../cache/types/cache-service.interface.js';
import { IStateManager } from '../core/types/state-manager.interface.js';

export class CacheService implements ICacheService {
  constructor(private readonly _stateManager: IStateManager) {}

  public async clean(): Promise<void> {
    await this._stateManager.cleanAll();
  }

  public async isTaskDone(taskId: string): Promise<boolean> {
    return await this._stateManager.isTaskDone(taskId);
  }

  public async markTaskDone(taskId: string): Promise<void> {
    await this._stateManager.markTaskDone(taskId);
  }

  public async getTaskTimestamp(taskId: string): Promise<number> {
    return await this._stateManager.getTaskTimestamp(taskId);
  }

  public async cleanAll(): Promise<void> {
    await this._stateManager.cleanAll();
  }
}