// 文件路径：assets/scripts/core/ui/Dialog.ts
// 依赖：core/utils/Logger.ts

import { Logger } from 'db://assets/scripts/core/utils/Logger';

/** 对话框按钮配置 */
export interface DialogButton {
    text: string;
    callback?: () => void;
}

/** 对话框配置 */
export interface DialogOptions {
    title: string;
    content: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
    showCancel?: boolean;
}

/**
 * 对话框管理
 * 提供 confirm / alert 两种快捷方式
 *
 * @example
 * Dialog.confirm({
 *   title: '确认接单',
 *   content: '是否接取该订单？',
 *   onConfirm: () => { ... },
 * });
 * Dialog.alert({ title: '提示', content: '等级不足' });
 */
export class Dialog {
    /** 显示回调（由 UIManager 注入实际渲染逻辑） */
    static onDisplay: ((options: DialogOptions) => void) | null = null;

    /**
     * 确认对话框（确认 + 取消）
     */
    static confirm(options: DialogOptions): void {
        const opts: DialogOptions = {
            confirmText: '确认',
            cancelText: '取消',
            showCancel: true,
            ...options,
        };
        Dialog._show(opts);
    }

    /**
     * 提示对话框（仅确认）
     */
    static alert(options: Omit<DialogOptions, 'showCancel' | 'cancelText' | 'onCancel'>): void {
        const opts: DialogOptions = {
            confirmText: '确定',
            showCancel: false,
            ...options,
        };
        Dialog._show(opts);
    }

    private static _show(options: DialogOptions): void {
        if (Dialog.onDisplay) {
            Dialog.onDisplay(options);
        } else {
            Logger.warn('Dialog', `未注入渲染回调，对话框丢弃: ${options.title}`);
        }
    }
}
