// 文件路径：assets/scripts/core/manager/PoolManager.ts
// 依赖：core/utils/Singleton.ts, core/utils/Logger.ts

import { Node, Prefab, instantiate } from 'cc';
import { Singleton } from 'db://assets/scripts/core/utils/Singleton';
import { Logger } from 'db://assets/scripts/core/utils/Logger';

interface PoolEntry {
    prefab: Prefab;
    pool: Node[];
}

/**
 * 对象池管理器
 * 管理频繁创建/销毁的节点（如订单列表项、特效等）
 *
 * @example
 * const pm = PoolManager.getInstance();
 * pm.registerPool('orderItem', orderPrefab, 10);
 * const node = pm.get('orderItem');
 * pm.put('orderItem', node); // 回收
 */
export class PoolManager extends Singleton<PoolManager>() {
    private _pools: Map<string, PoolEntry> = new Map();

    protected init(): void {
        Logger.info('PoolManager', '初始化完成');
    }

    /**
     * 注册对象池
     * @param key 池标识
     * @param prefab 预制体
     * @param initialSize 预创建数量
     */
    registerPool(key: string, prefab: Prefab, initialSize = 0): void {
        if (this._pools.has(key)) {
            Logger.warn('PoolManager', `对象池已存在: ${key}`);
            return;
        }

        const entry: PoolEntry = { prefab, pool: [] };
        this._pools.set(key, entry);

        if (initialSize > 0) {
            this.preCreate(key, initialSize);
        }

        Logger.debug('PoolManager', `注册对象池: ${key}, 预创建: ${initialSize}`);
    }

    /** 从池中获取节点（池空则新建） */
    get(key: string): Node | null {
        const entry = this._pools.get(key);
        if (!entry) {
            Logger.error('PoolManager', `对象池不存在: ${key}`);
            return null;
        }

        let node: Node;
        if (entry.pool.length > 0) {
            node = entry.pool.pop()!;
        } else {
            node = instantiate(entry.prefab);
        }

        node.active = true;
        return node;
    }

    /** 回收节点到池中 */
    put(key: string, node: Node): void {
        const entry = this._pools.get(key);
        if (!entry) {
            Logger.warn('PoolManager', `对象池不存在，直接销毁: ${key}`);
            node.destroy();
            return;
        }

        node.active = false;
        node.removeFromParent();
        entry.pool.push(node);
    }

    /** 预创建指定数量的节点 */
    preCreate(key: string, count: number): void {
        const entry = this._pools.get(key);
        if (!entry) return;

        for (let i = 0; i < count; i++) {
            const node = instantiate(entry.prefab);
            node.active = false;
            entry.pool.push(node);
        }
    }

    /** 清空指定池 */
    clear(key: string): void {
        const entry = this._pools.get(key);
        if (!entry) return;

        for (const node of entry.pool) {
            node.destroy();
        }
        entry.pool.length = 0;
    }

    /** 清空所有池 */
    clearAll(): void {
        for (const [key] of this._pools) {
            this.clear(key);
        }
        this._pools.clear();
    }

    /** 获取池中空闲节点数量 */
    getPoolSize(key: string): number {
        return this._pools.get(key)?.pool.length ?? 0;
    }

    protected onDestroy(): void {
        this.clearAll();
    }
}
