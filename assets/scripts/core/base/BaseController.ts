// 文件路径：assets/scripts/core/base/BaseController.ts
// 依赖：core/manager/EventManager.ts, core/utils/Logger.ts

import { EventManager } from 'db://assets/scripts/core/manager/EventManager';
import { Logger } from 'db://assets/scripts/core/utils/Logger';

/**
 * 控制器基类
 * 负责协调 Model 和 View，处理业务逻辑
 * 生命周期：init → (业务运行) → destroy
 */
export abstract class BaseController {
    protected readonly TAG: string = this.constructor.name;
    protected _eventManager: EventManager = EventManager.getInstance();
    private _isInitialized: boolean = false;

    /**
     * 初始化控制器（注册事件监听等）
     */
    init(): void {
        if (this._isInitialized) return;
        this._isInitialized = true;
        this.onInit();
        Logger.debug(this.TAG, '控制器已初始化');
    }

    /**
     * 销毁控制器（清理事件监听等）
     */
    destroy(): void {
        if (!this._isInitialized) return;
        this._isInitialized = false;
        this._eventManager.offAll(this);
        this.onDestroy();
        Logger.debug(this.TAG, '控制器已销毁');
    }

    /** 子类实现：注册事件、初始化数据 */
    protected abstract onInit(): void;

    /** 子类可重写：清理资源 */
    protected onDestroy(): void {}

    protected on(event: string, callback: (...args: unknown[]) => void): void {
        this._eventManager.on(event, callback, this);
    }

    protected emit(event: string, ...args: unknown[]): void {
        this._eventManager.emit(event, ...args);
    }
}
