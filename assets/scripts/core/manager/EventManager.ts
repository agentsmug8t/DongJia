// 文件路径：assets/scripts/core/manager/EventManager.ts
// 依赖：core/utils/Singleton.ts, core/utils/Logger.ts

import { Singleton } from 'db://assets/scripts/core/utils/Singleton';
import { Logger } from 'db://assets/scripts/core/utils/Logger';

interface ListenerItem {
    callback: (...args: unknown[]) => void;
    target: unknown;
    once: boolean;
}

/** 事件触发耗时统计条目 */
export interface EventProfile {
    event: string;
    callCount: number;
    totalMs: number;
    avgMs: number;
    maxMs: number;
}

/**
 * 事件总线（全局事件管理器）
 * 模块间解耦通信的核心，基于发布-订阅模式
 *
 * 支持：
 * - 精确事件监听：`on('shop:order:taken', cb)`
 * - 命名空间通配符：`on('shop:*', cb)` 匹配所有 shop: 开头的事件
 * - 调试模式：打印所有事件触发
 * - 耗时统计：分析事件回调性能瓶颈
 *
 * @example
 * const em = EventManager.getInstance();
 * em.on(PlayerEvent.LevelUp, this.onLevelUp, this);
 * em.on('shop:*', this.onAnyShopEvent, this);
 * em.emit(PlayerEvent.LevelUp, { newLevel: 5 });
 * em.offAll(this);
 */
export class EventManager extends Singleton<EventManager>() {
    private _eventMap: Map<string, ListenerItem[]> = new Map();
    private _debugMode: boolean = false;
    private _profileEnabled: boolean = false;
    private _profileData: Map<string, { callCount: number; totalMs: number; maxMs: number }> = new Map();

    protected init(): void {
        Logger.info('EventManager', '初始化完成');
    }

    /**
     * 开启调试模式（打印所有事件触发）
     * @param enabled - 是否开启
     */
    setDebugMode(enabled: boolean): void {
        this._debugMode = enabled;
    }

    /**
     * 开启耗时统计（用于性能分析）
     * @param enabled - 是否开启
     */
    setProfileEnabled(enabled: boolean): void {
        this._profileEnabled = enabled;
        if (!enabled) this._profileData.clear();
    }

    /**
     * 获取耗时统计报告（按总耗时降序）
     * @returns 事件耗时统计数组
     */
    getProfileReport(): EventProfile[] {
        const report: EventProfile[] = [];
        for (const [event, data] of this._profileData) {
            report.push({
                event,
                callCount: data.callCount,
                totalMs: Math.round(data.totalMs * 100) / 100,
                avgMs: Math.round((data.totalMs / data.callCount) * 100) / 100,
                maxMs: Math.round(data.maxMs * 100) / 100,
            });
        }
        return report.sort((a, b) => b.totalMs - a.totalMs);
    }

    /** 清空耗时统计数据 */
    clearProfile(): void {
        this._profileData.clear();
    }

    /**
     * 监听事件
     * 支持命名空间通配符，如 `'shop:*'` 匹配所有 `shop:` 开头的事件
     * @param event - 事件名或通配符模式
     * @param callback - 回调函数
     * @param target - 回调绑定的 this 对象（用于 offAll 批量清理）
     */
    on(event: string, callback: (...args: unknown[]) => void, target?: unknown): void {
        let listeners = this._eventMap.get(event);
        if (!listeners) {
            listeners = [];
            this._eventMap.set(event, listeners);
        }
        const exists = listeners.some((l) => l.callback === callback && l.target === target);
        if (!exists) {
            listeners.push({ callback, target, once: false });
        }
    }

    /**
     * 监听一次性事件（触发后自动移除）
     * @param event - 事件名
     * @param callback - 回调函数
     * @param target - 回调绑定的 this 对象
     */
    once(event: string, callback: (...args: unknown[]) => void, target?: unknown): void {
        let listeners = this._eventMap.get(event);
        if (!listeners) {
            listeners = [];
            this._eventMap.set(event, listeners);
        }
        listeners.push({ callback, target, once: true });
    }

    /**
     * 移除监听
     * @param event - 事件名
     * @param callback - 不传则移除该事件所有监听
     * @param target - 不传则忽略 target 匹配
     */
    off(event: string, callback?: (...args: unknown[]) => void, target?: unknown): void {
        const listeners = this._eventMap.get(event);
        if (!listeners) return;
        if (!callback) {
            this._eventMap.delete(event);
            return;
        }
        const filtered = listeners.filter(
            (l) => !(l.callback === callback && (target === undefined || l.target === target))
        );
        if (filtered.length === 0) {
            this._eventMap.delete(event);
        } else {
            this._eventMap.set(event, filtered);
        }
    }

    /**
     * 移除某个 target 对象的所有监听（对象销毁时调用）
     * @param target - 要清理的目标对象
     */
    offAll(target: unknown): void {
        for (const [event, listeners] of this._eventMap) {
            const filtered = listeners.filter((l) => l.target !== target);
            if (filtered.length === 0) {
                this._eventMap.delete(event);
            } else {
                this._eventMap.set(event, filtered);
            }
        }
    }

    /**
     * 派发事件
     * 同时触发精确匹配和命名空间通配符匹配的监听
     * @param event - 事件名
     * @param args - 传递给回调的参数
     */
    emit(event: string, ...args: unknown[]): void {
        if (this._debugMode) {
            Logger.debug('EventManager', `emit: ${event}`, args);
        }

        const startTime = this._profileEnabled ? performance.now() : 0;

        // 精确匹配
        this._dispatch(event, args);

        // 命名空间通配符匹配：事件 'shop:order:taken' 会触发 'shop:*' 的监听
        const colonIndex = event.indexOf(':');
        if (colonIndex > 0) {
            const namespace = event.substring(0, colonIndex);
            const wildcardKey = `${namespace}:*`;
            if (this._eventMap.has(wildcardKey)) {
                this._dispatch(wildcardKey, [event, ...args]);
            }
        }

        // 耗时统计
        if (this._profileEnabled) {
            const elapsed = performance.now() - startTime;
            const profile = this._profileData.get(event) ?? { callCount: 0, totalMs: 0, maxMs: 0 };
            profile.callCount++;
            profile.totalMs += elapsed;
            profile.maxMs = Math.max(profile.maxMs, elapsed);
            this._profileData.set(event, profile);
        }
    }

    /**
     * 检查是否有监听者
     * @param event - 事件名
     */
    hasListener(event: string): boolean {
        const listeners = this._eventMap.get(event);
        return !!listeners && listeners.length > 0;
    }

    /**
     * 获取当前注册的事件总数（调试用）
     */
    getEventCount(): number {
        return this._eventMap.size;
    }

    /** 内部派发逻辑 */
    private _dispatch(key: string, args: unknown[]): void {
        const listeners = this._eventMap.get(key);
        if (!listeners || listeners.length === 0) return;

        const snapshot = [...listeners];
        const toRemove: ListenerItem[] = [];

        for (const item of snapshot) {
            try {
                item.callback.apply(item.target, args);
            } catch (err) {
                Logger.error('EventManager', `事件回调异常: ${key}`, err);
            }
            if (item.once) toRemove.push(item);
        }

        if (toRemove.length > 0) {
            const remaining = listeners.filter((l) => !toRemove.includes(l));
            if (remaining.length === 0) {
                this._eventMap.delete(key);
            } else {
                this._eventMap.set(key, remaining);
            }
        }
    }

    protected onDestroy(): void {
        this._eventMap.clear();
        this._profileData.clear();
    }
}
