// 文件路径：assets/scripts/core/manager/GameManager.ts
// 依赖：core/utils/Singleton.ts, core/utils/Logger.ts, core/manager/TimerManager.ts,
//        core/manager/EventManager.ts, core/constants/EventTypes.ts

import { Singleton } from 'db://assets/scripts/core/utils/Singleton';
import { Logger } from 'db://assets/scripts/core/utils/Logger';
import { TimerManager } from 'db://assets/scripts/core/manager/TimerManager';
import { EventManager } from 'db://assets/scripts/core/manager/EventManager';
import { SystemEvent } from 'db://assets/scripts/core/constants/EventTypes';

/** 游戏运行状态 */
export enum GameState {
    NONE = 'none',
    LOADING = 'loading',
    RUNNING = 'running',
    PAUSED = 'paused',
}

/**
 * 游戏主循环管理器
 * 驱动 TimerManager.update，管理游戏暂停/恢复，提供全局 update 入口
 *
 * @example
 * // 在 Main.ts 的 Cocos Component 中：
 * update(dt: number) { GameManager.getInstance().update(dt); }
 */
export class GameManager extends Singleton<GameManager>() {
    private _state: GameState = GameState.NONE;
    private _totalTime: number = 0;
    private _frameCount: number = 0;
    private _serverTimeDelta: number = 0; // 本地时间与服务器时间的差值（ms）

    get state(): GameState { return this._state; }
    get totalTime(): number { return this._totalTime; }
    get frameCount(): number { return this._frameCount; }

    protected init(): void {
        Logger.info('GameManager', '初始化完成');
        this._state = GameState.LOADING;
    }

    /**
     * 标记游戏进入运行状态（Bootstrap 完成后调用）
     */
    startGame(): void {
        this._state = GameState.RUNNING;
        Logger.info('GameManager', '游戏开始运行');
    }

    /**
     * 每帧调用（由挂载在场景上的 Component.update 驱动）
     */
    update(dt: number): void {
        if (this._state !== GameState.RUNNING) return;

        this._totalTime += dt;
        this._frameCount++;

        // 驱动定时器系统
        TimerManager.getInstance().update(dt);
    }

    /**
     * 暂停游戏（切后台时调用）
     */
    pause(): void {
        if (this._state !== GameState.RUNNING) return;
        this._state = GameState.PAUSED;
        TimerManager.getInstance().paused = true;
        EventManager.getInstance().emit(SystemEvent.AppPause);
        Logger.info('GameManager', '游戏暂停');
    }

    /**
     * 恢复游戏（切回前台时调用）
     */
    resume(): void {
        if (this._state !== GameState.PAUSED) return;
        this._state = GameState.RUNNING;
        TimerManager.getInstance().paused = false;
        EventManager.getInstance().emit(SystemEvent.AppResume);
        Logger.info('GameManager', '游戏恢复');
    }

    /**
     * 同步服务器时间
     * @param serverTimestamp 服务器时间戳（毫秒）
     */
    syncServerTime(serverTimestamp: number): void {
        this._serverTimeDelta = serverTimestamp - Date.now();
        Logger.debug('GameManager', `服务器时间差: ${this._serverTimeDelta}ms`);
    }

    /**
     * 获取校准后的服务器时间（毫秒）
     */
    getServerTime(): number {
        return Date.now() + this._serverTimeDelta;
    }

    /**
     * 获取校准后的服务器时间（秒）
     */
    getServerTimeSec(): number {
        return Math.floor(this.getServerTime() / 1000);
    }

    protected onDestroy(): void {
        this._state = GameState.NONE;
    }
}
