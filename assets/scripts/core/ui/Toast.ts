// 文件路径：assets/scripts/core/ui/Toast.ts
// 依赖：core/utils/Logger.ts

import { Logger } from 'db://assets/scripts/core/utils/Logger';

/** Toast 样式类型 */
export enum ToastStyle {
    INFO = 'info',
    SUCCESS = 'success',
    WARNING = 'warning',
    ERROR = 'error',
}

interface ToastItem {
    message: string;
    style: ToastStyle;
    duration: number;
}

/**
 * 吐司提示管理
 * 支持队列显示，多个 Toast 按顺序弹出
 *
 * @example
 * Toast.show('操作成功');
 * Toast.success('接单成功！');
 * Toast.error('铜钱不足');
 */
export class Toast {
    private static _queue: ToastItem[] = [];
    private static _isShowing: boolean = false;
    private static _defaultDuration: number = 2000;

    /** 显示回调（由 UIManager 注入实际渲染逻辑） */
    static onDisplay: ((message: string, style: ToastStyle, duration: number) => void) | null = null;

    static show(message: string, duration: number = Toast._defaultDuration): void {
        Toast._enqueue({ message, style: ToastStyle.INFO, duration });
    }

    static success(message: string, duration: number = Toast._defaultDuration): void {
        Toast._enqueue({ message, style: ToastStyle.SUCCESS, duration });
    }

    static warning(message: string, duration: number = Toast._defaultDuration): void {
        Toast._enqueue({ message, style: ToastStyle.WARNING, duration });
    }

    static error(message: string, duration: number = Toast._defaultDuration): void {
        Toast._enqueue({ message, style: ToastStyle.ERROR, duration });
    }

    private static _enqueue(item: ToastItem): void {
        Toast._queue.push(item);
        if (!Toast._isShowing) {
            Toast._showNext();
        }
    }

    private static _showNext(): void {
        if (Toast._queue.length === 0) {
            Toast._isShowing = false;
            return;
        }

        Toast._isShowing = true;
        const item = Toast._queue.shift()!;

        if (Toast.onDisplay) {
            Toast.onDisplay(item.message, item.style, item.duration);
        } else {
            Logger.warn('Toast', `未注入渲染回调，消息丢弃: ${item.message}`);
        }

        // 等待当前 Toast 消失后显示下一个
        setTimeout(() => Toast._showNext(), item.duration + 300);
    }

    /** 清空队列 */
    static clear(): void {
        Toast._queue.length = 0;
        Toast._isShowing = false;
    }
}
