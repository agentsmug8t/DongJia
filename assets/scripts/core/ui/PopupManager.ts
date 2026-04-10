// 文件路径：assets/scripts/core/ui/PopupManager.ts
// 依赖：core/utils/Singleton.ts, core/utils/Logger.ts

import { Singleton } from 'db://assets/scripts/core/utils/Singleton';
import { Logger } from 'db://assets/scripts/core/utils/Logger';

interface PopupInfo {
    id: string;
    priority: number;
    showFn: () => void;
    shown: boolean;
}

/**
 * 弹窗管理器
 * 管理弹窗优先级队列，确保同一时间只显示一个弹窗
 * 适用于登录奖励、公告、活动弹窗等需要排队显示的场景
 *
 * @example
 * PopupManager.getInstance().enqueue('login_reward', 10, () => showLoginReward());
 * PopupManager.getInstance().enqueue('notice', 5, () => showNotice());
 * PopupManager.getInstance().start(); // 按优先级依次弹出
 */
export class PopupManager extends Singleton<PopupManager>() {
    private _queue: PopupInfo[] = [];
    private _currentPopup: PopupInfo | null = null;

    /**
     * 入队一个弹窗
     * @param id 唯一标识
     * @param priority 优先级（数字越大越先弹出）
     * @param showFn 显示弹窗的回调
     */
    enqueue(id: string, priority: number, showFn: () => void): void {
        // 去重
        if (this._queue.some((p) => p.id === id)) return;
        this._queue.push({ id, priority, showFn, shown: false });
        this._queue.sort((a, b) => b.priority - a.priority);
    }

    /**
     * 开始按优先级弹出
     */
    start(): void {
        this._showNext();
    }

    /**
     * 通知当前弹窗已关闭，弹出下一个
     */
    notifyClosed(): void {
        this._currentPopup = null;
        this._showNext();
    }

    /**
     * 移除指定弹窗（未弹出时）
     */
    remove(id: string): void {
        this._queue = this._queue.filter((p) => p.id !== id);
    }

    /**
     * 清空队列
     */
    clear(): void {
        this._queue.length = 0;
        this._currentPopup = null;
    }

    get hasPending(): boolean {
        return this._queue.length > 0;
    }

    private _showNext(): void {
        if (this._currentPopup || this._queue.length === 0) return;

        const next = this._queue.shift()!;
        this._currentPopup = next;
        Logger.debug('PopupManager', `弹出: ${next.id} (priority: ${next.priority})`);
        next.showFn();
    }
}
