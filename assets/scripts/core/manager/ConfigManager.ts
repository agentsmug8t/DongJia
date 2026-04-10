// 文件路径：assets/scripts/core/manager/ConfigManager.ts
// 依赖：core/utils/Singleton.ts, core/utils/Logger.ts, core/manager/ResourceManager.ts

import { Singleton } from 'db://assets/scripts/core/utils/Singleton';
import { Logger } from 'db://assets/scripts/core/utils/Logger';
import { ResourceManager } from 'db://assets/scripts/core/manager/ResourceManager';

/**
 * 配置表管理器
 * 统一管理所有 JSON 配置表的加载、查询
 *
 * @example
 * await ConfigManager.getInstance().loadAll(['item', 'order', 'shop']);
 * const item = ConfigManager.getInstance().get<ItemConfig>('item', 1001);
 */
export class ConfigManager extends Singleton<ConfigManager>() {
    // 存储格式：tableName -> Map<id, record>
    private _tables: Map<string, Map<number, Record<string, unknown>>> = new Map();

    protected init(): void {
        Logger.info('ConfigManager', '初始化完成');
    }

    /**
     * 加载多张配置表
     */
    async loadAll(tableNames: string[]): Promise<void> {
        const tasks = tableNames.map((name) => this._loadTable(name));
        await Promise.all(tasks);
        Logger.info('ConfigManager', `配置表加载完成: ${tableNames.join(', ')}`);
    }

    /**
     * 按 ID 获取配置
     */
    get<T extends Record<string, unknown>>(tableName: string, id: number): T | null {
        return (this._tables.get(tableName)?.get(id) as T) ?? null;
    }

    /**
     * 获取整张表（数组形式）
     */
    getAll<T extends Record<string, unknown>>(tableName: string): T[] {
        const table = this._tables.get(tableName);
        if (!table) return [];
        return Array.from(table.values()) as T[];
    }

    /**
     * 条件查询
     */
    getByCondition<T extends Record<string, unknown>>(
        tableName: string,
        condition: (item: T) => boolean
    ): T[] {
        return this.getAll<T>(tableName).filter(condition);
    }

    /**
     * 判断 ID 是否存在
     */
    has(tableName: string, id: number): boolean {
        return this._tables.get(tableName)?.has(id) ?? false;
    }

    /**
     * 热重载单张表（开发模式）
     */
    async reload(tableName: string): Promise<void> {
        this._tables.delete(tableName);
        await this._loadTable(tableName);
        Logger.info('ConfigManager', `配置表已热重载: ${tableName}`);
    }

    private async _loadTable(tableName: string): Promise<void> {
        if (this._tables.has(tableName)) return;
        try {
            const json = await ResourceManager.getInstance().loadConfig(tableName);
            const map = new Map<number, Record<string, unknown>>();
            // 支持两种格式：数组 [{id, ...}] 或对象 {id: {...}}
            if (Array.isArray(json)) {
                for (const item of json as Record<string, unknown>[]) {
                    map.set(item['id'] as number, item);
                }
            } else {
                for (const [key, value] of Object.entries(json)) {
                    map.set(Number(key), value as Record<string, unknown>);
                }
            }
            this._tables.set(tableName, map);
        } catch (err) {
            Logger.error('ConfigManager', `配置表加载失败: ${tableName}`, err);
            throw err;
        }
    }

    protected onDestroy(): void {
        this._tables.clear();
    }
}
