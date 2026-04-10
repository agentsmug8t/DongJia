// 文件路径：assets/scripts/core/base/BaseComponent.ts
// 依赖：core/manager/EventManager.ts

import { Component, Node } from 'cc';
import { EventManager } from 'db://assets/scripts/core/manager/EventManager';

/**
 * Cocos Component 基类
 * 提供事件自动清理、节点查找等便利方法
 *
 * 使用方式：
 * class MyComp extends BaseComponent {
 *   onLoad() { super.onLoad(); this.listenEvent(PlayerEvent.LevelUp, this.onLevelUp); }
 * }
 */
export abstract class BaseComponent extends Component {
    private _eventManager: EventManager = EventManager.getInstance();

    onLoad(): void {}

    onDestroy(): void {
        this._eventManager.offAll(this);
        this.unscheduleAllCallbacks();
    }

    /**
     * 注册事件监听（onDestroy 时自动清理）
     */
    protected listenEvent(event: string, callback: (...args: unknown[]) => void): void {
        this._eventManager.on(event, callback, this);
    }

    /**
     * 注册一次性事件监听
     */
    protected listenOnce(event: string, callback: (...args: unknown[]) => void): void {
        this._eventManager.once(event, callback, this);
    }

    /**
     * 派发事件
     */
    protected emitEvent(event: string, ...args: unknown[]): void {
        this._eventManager.emit(event, ...args);
    }

    /**
     * 安全获取子节点组件
     */
    protected getChildComponent<T extends Component>(childName: string, type: new () => T): T | null {
        const child = this.node.getChildByName(childName);
        return child?.getComponent(type) ?? null;
    }
}
