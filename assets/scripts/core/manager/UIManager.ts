// 文件路径：assets/scripts/core/manager/UIManager.ts
// 依赖：core/utils/Singleton.ts, core/utils/Logger.ts, core/base/BaseView.ts,
//        core/constants/UIConstants.ts, core/manager/EventManager.ts

import { Singleton } from 'db://assets/scripts/core/utils/Singleton';
import { Logger } from 'db://assets/scripts/core/utils/Logger';
import { BaseView } from 'db://assets/scripts/core/base/BaseView';
import { UILayer } from 'db://assets/scripts/core/constants/UIConstants';
import { EventManager } from 'db://assets/scripts/core/manager/EventManager';

/** 界面栈中的条目 */
interface ViewStackItem {
    viewPath: string;
    view: BaseView;
    layer: UILayer;
}

/**
 * UI 栈管理器
 * 基于栈的界面管理，支持 4 层级（BG / NORMAL / POPUP / TOP）
 *
 * @example
 * const ui = UIManager.getInstance();
 * await ui.open(ViewPath.SHOP_MAIN, { shopId: '001' });
 * ui.close(); // 关闭栈顶
 * ui.back();  // 返回上一界面
 */
export class UIManager extends Singleton<UIManager>() {
    private _viewStack: ViewStackItem[] = [];
    private _viewCache: Map<string, BaseView> = new Map();
    private _isTransitioning: boolean = false;

    /**
     * 界面工厂（需要外部注入，负责根据 viewPath 创建 BaseView 实例）
     * TODO: FairyGUI 集成时替换为 FairyGUI 的界面创建逻辑
     */
    viewFactory: ((viewPath: string) => Promise<BaseView>) | null = null;

    protected init(): void {
        Logger.info('UIManager', '初始化完成');
        // 监听界面自关闭请求
        EventManager.getInstance().on('ui:view:close:request', (path: unknown) => {
            this.close(path as string);
        }, this);
    }

    /**
     * 打开界面
     * @param viewPath 界面路径
     * @param params 传递给界面的参数
     * @param layer 界面层级（默认 NORMAL）
     */
    async open(viewPath: string, params?: unknown, layer: UILayer = UILayer.Normal): Promise<BaseView> {
        if (this._isTransitioning) {
            Logger.warn('UIManager', `界面切换中，忽略: ${viewPath}`);
            return Promise.reject(new Error('UI transitioning'));
        }

        this._isTransitioning = true;

        try {
            // 尝试从缓存获取
            let view = this._viewCache.get(viewPath);

            if (!view) {
                if (!this.viewFactory) {
                    throw new Error('UIManager.viewFactory 未注入');
                }
                view = await this.viewFactory(viewPath);
                view._create(params);
            }

            // 隐藏当前栈顶（同层级）
            const topItem = this._getTopByLayer(layer);
            if (topItem) {
                topItem.view._hide();
            }

            // 入栈并显示
            this._viewStack.push({ viewPath, view, layer });
            view._show();

            Logger.debug('UIManager', `打开界面: ${viewPath}, 栈深度: ${this._viewStack.length}`);
            EventManager.getInstance().emit('ui:view:opened', viewPath);

            return view;
        } finally {
            this._isTransitioning = false;
        }
    }

    /**
     * 关闭界面
     * @param viewPath 不传则关闭栈顶
     */
    close(viewPath?: string): void {
        if (this._viewStack.length === 0) return;

        let index: number;
        if (viewPath) {
            index = this._findLastIndex(viewPath);
            if (index === -1) return;
        } else {
            index = this._viewStack.length - 1;
        }

        const item = this._viewStack[index];
        this._viewStack.splice(index, 1);
        item.view._destroy();
        this._viewCache.delete(item.viewPath);

        // 恢复同层级的下一个栈顶
        const newTop = this._getTopByLayer(item.layer);
        if (newTop) {
            newTop.view._show();
        }

        Logger.debug('UIManager', `关闭界面: ${item.viewPath}, 栈深度: ${this._viewStack.length}`);
        EventManager.getInstance().emit('ui:view:closed', item.viewPath);
    }

    /**
     * 返回上一界面（关闭栈顶）
     */
    back(): void {
        this.close();
    }

    /**
     * 获取栈顶界面
     */
    getTopView(): BaseView | null {
        return this._viewStack.length > 0
            ? this._viewStack[this._viewStack.length - 1].view
            : null;
    }

    /**
     * 关闭所有界面
     */
    closeAll(): void {
        while (this._viewStack.length > 0) {
            const item = this._viewStack.pop()!;
            item.view._destroy();
        }
        this._viewCache.clear();
        Logger.info('UIManager', '所有界面已关闭');
    }

    /**
     * 获取当前栈深度
     */
    get stackSize(): number {
        return this._viewStack.length;
    }

    private _getTopByLayer(layer: UILayer): ViewStackItem | null {
        for (let i = this._viewStack.length - 1; i >= 0; i--) {
            if (this._viewStack[i].layer === layer) return this._viewStack[i];
        }
        return null;
    }

    private _findLastIndex(viewPath: string): number {
        for (let i = this._viewStack.length - 1; i >= 0; i--) {
            if (this._viewStack[i].viewPath === viewPath) return i;
        }
        return -1;
    }

    protected onDestroy(): void {
        this.closeAll();
        EventManager.getInstance().offAll(this);
    }
}
