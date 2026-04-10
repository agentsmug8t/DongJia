// 文件路径：assets/scripts/core/base/BaseModel.ts
// 依赖：core/manager/EventManager.ts

import { EventManager } from 'db://assets/scripts/core/manager/EventManager';

/**
 * 数据模型基类
 * 提供数据变更通知能力，子类在修改数据后调用 notify() 派发事件
 *
 * @example
 * class ShopModel extends BaseModel {
 *   private _gold: number = 0;
 *   get gold() { return this._gold; }
 *   set gold(v: number) { this._gold = v; this.notify('shop:gold:changed', v); }
 * }
 */
export abstract class BaseModel {
    protected _eventManager: EventManager = EventManager.getInstance();

    /**
     * 派发数据变更事件
     */
    protected notify(event: string, ...args: unknown[]): void {
        this._eventManager.emit(event, ...args);
    }

    /**
     * 从普通对象批量赋值（用于服务器数据同步）
     */
    fromJSON(data: Record<string, unknown>): void {
        Object.assign(this, data);
    }

    /**
     * 序列化为普通对象（用于本地存档）
     */
    toJSON(): Record<string, unknown> {
        return JSON.parse(JSON.stringify(this)) as Record<string, unknown>;
    }

    /**
     * 重置为初始状态（子类可重写）
     */
    reset(): void {}
}
