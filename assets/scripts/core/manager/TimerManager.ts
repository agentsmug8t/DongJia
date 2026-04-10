// 文件路径：assets/scripts/core/manager/TimerManager.ts
// 依赖：core/utils/Singleton.ts, core/utils/Logger.ts

import { Singleton } from 'db://assets/scripts/core/utils/Singleton';
import { Logger } from 'db://assets/scripts/core/utils/Logger';

interface TimerEntry {
    id: number;
    callback: () => void;
    target: unknown;
    interval: number;    // 间隔（秒）
    elapsed: number;     // 已过时间
    repeat: boolean;     // true = setInterval, false = setTimeout
    paused: boolean;
}

/**
 * 定时器管理器
 * 基于游戏帧驱动（可暂停/缩放），替代原生 setTimeout/setInterval
 *
 * @example
 * const tm = TimerManager.getInstance();
 * const id = tm.setTimeout(() => console.log('done'), 3); // 3秒后
 * const id2 = tm.setInterval(() => this.tick(), 1);       // 每秒
 * tm.clearTimer(id);
 */
export class TimerManager extends Singleton<TimerManager>() {
    private _timers: Map<number, TimerEntry> = new Map();
    private _idCounter: number = 0;
    private _timeScale: number = 1;
    private _paused: boolean = false;

    protected init(): void {
        Logger.info('TimerManager', '初始化完成');
    }

    /**
     * 延迟执行（秒）
     */
    setTimeout(callback: () => void, delay: number, target?: unknown): number {
        const id = ++this._idCounter;
        this._timers.set(id, {
            id,
            callback,
            target,
            interval: delay,
            elapsed: 0,
            repeat: false,
            paused: false,
        });
        return id;
    }

    /**
     * 循环执行（秒）
     */
    setInterval(callback: () => void, interval: number, target?: unknown): number {
        const id = ++this._idCounter;
        this._timers.set(id, {
            id,
            callback,
            target,
            interval,
            elapsed: 0,
            repeat: true,
            paused: false,
        });
        return id;
    }

    /**
     * 清除定时器
     */
    clearTimer(id: number): void {
        this._timers.delete(id);
    }

    /**
     * 清除某个 target 的所有定时器
     */
    clearAll(target?: unknown): void {
        if (!target) {
            this._timers.clear();
            return;
        }
        for (const [id, entry] of this._timers) {
            if (entry.target === target) {
                this._timers.delete(id);
            }
        }
    }

    /**
     * 暂停/恢复指定定时器
     */
    pauseTimer(id: number, paused: boolean): void {
        const entry = this._timers.get(id);
        if (entry) entry.paused = paused;
    }

    /**
     * 全局暂停/恢复
     */
    set paused(value: boolean) { this._paused = value; }
    get paused(): boolean { return this._paused; }

    /**
     * 时间缩放（如 2 = 两倍速）
     */
    set timeScale(value: number) { this._timeScale = Math.max(0, value); }
    get timeScale(): number { return this._timeScale; }

    /**
     * 每帧调用（由 GameManager 驱动）
     * @param dt 帧间隔（秒）
     */
    update(dt: number): void {
        if (this._paused) return;

        const scaledDt = dt * this._timeScale;
        const toRemove: number[] = [];

        for (const [id, entry] of this._timers) {
            if (entry.paused) continue;

            entry.elapsed += scaledDt;

            if (entry.elapsed >= entry.interval) {
                try {
                    entry.callback();
                } catch (err) {
                    Logger.error('TimerManager', `定时器回调异常: id=${id}`, err);
                }

                if (entry.repeat) {
                    entry.elapsed -= entry.interval;
                } else {
                    toRemove.push(id);
                }
            }
        }

        for (const id of toRemove) {
            this._timers.delete(id);
        }
    }

    get timerCount(): number {
        return this._timers.size;
    }

    protected onDestroy(): void {
        this._timers.clear();
    }
}
