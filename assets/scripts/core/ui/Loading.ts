// 文件路径：assets/scripts/core/ui/Loading.ts
// 依赖：core/utils/Logger.ts

import { Logger } from 'db://assets/scripts/core/utils/Logger';

/**
 * 加载遮罩管理
 * 支持普通模式（转圈）和进度条模式
 *
 * @example
 * Loading.show('正在加载...');
 * Loading.setProgress(0.5, '加载中 50%');
 * Loading.hide();
 */
export class Loading {
    private static _refCount: number = 0;

    /** 显示回调（由 UIManager 注入） */
    static onShow: ((message?: string) => void) | null = null;
    /** 隐藏回调 */
    static onHide: (() => void) | null = null;
    /** 进度更新回调 */
    static onProgress: ((progress: number, message?: string) => void) | null = null;

    /**
     * 显示加载遮罩（引用计数，多次 show 需要对应次数 hide）
     */
    static show(message?: string): void {
        Loading._refCount++;
        if (Loading._refCount === 1) {
            if (Loading.onShow) {
                Loading.onShow(message);
            } else {
                Logger.warn('Loading', '未注入渲染回调');
            }
        }
    }

    /**
     * 隐藏加载遮罩
     */
    static hide(): void {
        Loading._refCount = Math.max(0, Loading._refCount - 1);
        if (Loading._refCount === 0) {
            Loading.onHide?.();
        }
    }

    /**
     * 强制隐藏（忽略引用计数）
     */
    static forceHide(): void {
        Loading._refCount = 0;
        Loading.onHide?.();
    }

    /**
     * 更新进度（0~1）
     */
    static setProgress(progress: number, message?: string): void {
        Loading.onProgress?.(Math.max(0, Math.min(1, progress)), message);
    }

    static get isShowing(): boolean {
        return Loading._refCount > 0;
    }
}
