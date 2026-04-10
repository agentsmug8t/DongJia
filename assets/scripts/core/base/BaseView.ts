// 文件路径：assets/scripts/core/base/BaseView.ts
// 依赖：core/manager/EventManager.ts, core/utils/Logger.ts

import { EventManager } from 'db://assets/scripts/core/manager/EventManager';
import { Logger } from 'db://assets/scripts/core/utils/Logger';
import { Toast } from 'db://assets/scripts/core/ui/Toast';
import { Dialog, DialogOptions } from 'db://assets/scripts/core/ui/Dialog';
import { Loading } from 'db://assets/scripts/core/ui/Loading';

/**
 * 视图基类
 * 所有 UI 界面继承此类，提供统一的生命周期和事件管理
 *
 * 生命周期顺序：onCreate → onShow → (用户交互) → onHide → onDestroy
 *
 * @example
 * class ShopMainView extends BaseView {
 *   protected onCreate(params?: unknown): void {
 *     this.listenEvent(ShopEvent.OrderTaken, this.refreshOrders);
 *   }
 * }
 */
export abstract class BaseView {
    /** 界面唯一路径标识 */
    readonly viewPath: string;
    /** 打开时传入的参数 */
    protected params: unknown = null;

    private _eventManager: EventManager = EventManager.getInstance();
    private _isVisible: boolean = false;

    constructor(viewPath: string) {
        this.viewPath = viewPath;
    }

    // ─── 生命周期（框架调用，子类重写） ───────────────────────────

    /** 界面首次创建时调用（只调用一次） */
    protected onCreate(_params?: unknown): void {}

    /** 界面每次显示时调用 */
    protected onShow(): void {}

    /** 界面每次隐藏时调用 */
    protected onHide(): void {}

    /** 界面销毁时调用 */
    protected onDestroy(): void {}

    // ─── 框架内部调用 ─────────────────────────────────────────────

    /** @internal */
    _create(params?: unknown): void {
        this.params = params ?? null;
        Logger.debug('BaseView', `onCreate: ${this.viewPath}`);
        this.onCreate(params);
    }

    /** @internal */
    _show(): void {
        if (this._isVisible) return;
        this._isVisible = true;
        Logger.debug('BaseView', `onShow: ${this.viewPath}`);
        this.onShow();
    }

    /** @internal */
    _hide(): void {
        if (!this._isVisible) return;
        this._isVisible = false;
        Logger.debug('BaseView', `onHide: ${this.viewPath}`);
        this.onHide();
    }

    /** @internal */
    _destroy(): void {
        this._hide();
        // 清理数据绑定
        for (const binding of this._bindings) {
            binding.off();
        }
        this._bindings.length = 0;
        this._eventManager.offAll(this);
        Logger.debug('BaseView', `onDestroy: ${this.viewPath}`);
        this.onDestroy();
    }

    get isVisible(): boolean {
        return this._isVisible;
    }

    // ─── 便利方法 ─────────────────────────────────────────────────

    /**
     * 注册事件监听（界面销毁时自动清理）
     */
    protected listenEvent(event: string, callback: (...args: unknown[]) => void): void {
        this._eventManager.on(event, callback, this);
    }

    protected listenOnce(event: string, callback: (...args: unknown[]) => void): void {
        this._eventManager.once(event, callback, this);
    }

    protected emitEvent(event: string, ...args: unknown[]): void {
        this._eventManager.emit(event, ...args);
    }

    /**
     * 关闭自身
     */
    protected close(): void {
        this._eventManager.emit('ui:view:close:request', this.viewPath);
    }

    // ─── 数据绑定 ─────────────────────────────────────────────────

    /** 数据绑定清理列表 */
    private _bindings: Array<{ off: () => void }> = [];

    /**
     * 绑定 Model 属性到 UI 元素
     * 当 Model 派发指定事件时，自动调用 updater 更新 UI
     * 界面销毁时自动解绑
     *
     * @param event - 数据变更事件名
     * @param updater - UI 更新回调
     *
     * @example
     * this.bindData(PlayerEvent.CopperChanged, (copper) => {
     *   this._copperLabel.text = String(copper);
     * });
     */
    protected bindData(event: string, updater: (...args: unknown[]) => void): void {
        const callback = (...args: unknown[]) => updater(...args);
        this._eventManager.on(event, callback, this);
        this._bindings.push({
            off: () => this._eventManager.off(event, callback, this),
        });
    }

    // ─── 常用 UI 快捷方法 ─────────────────────────────────────────

    /**
     * 显示吐司提示
     * @param message - 提示文本
     */
    protected showToast(message: string): void {
        Toast.show(message);
    }

    /**
     * 显示确认对话框
     * @param options - 对话框配置
     */
    protected showDialog(options: DialogOptions): void {
        Dialog.confirm(options);
    }

    /**
     * 显示加载遮罩
     * @param message - 加载提示文本
     */
    protected showLoading(message?: string): void {
        Loading.show(message);
    }

    /**
     * 隐藏加载遮罩
     */
    protected hideLoading(): void {
        Loading.hide();
    }
}
