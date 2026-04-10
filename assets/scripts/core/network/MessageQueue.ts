// 文件路径：assets/scripts/core/network/MessageQueue.ts
// 依赖：core/utils/Logger.ts

import { Logger } from 'db://assets/scripts/core/utils/Logger';

/** 消息优先级 */
export enum MessagePriority {
    LOW = 0,
    NORMAL = 1,
    HIGH = 2,
    CRITICAL = 3,
}

interface QueuedMessage {
    id: number;
    event: string;
    data: unknown;
    priority: MessagePriority;
    createdAt: number;
    expireAt: number; // 0 = 永不过期
}

/**
 * 消息队列
 * 网络断开时缓存消息，恢复后自动重发
 *
 * @example
 * const mq = new MessageQueue();
 * mq.enqueue('order:take', { orderId: 1 }, MessagePriority.HIGH);
 * // 网络恢复后
 * const messages = mq.flush();
 * for (const msg of messages) { socket.emit(msg.event, msg.data); }
 */
export class MessageQueue {
    private _queue: QueuedMessage[] = [];
    private _idCounter: number = 0;
    private _maxSize: number;

    constructor(maxSize = 100) {
        this._maxSize = maxSize;
    }

    /**
     * 入队消息
     * @param event 事件名
     * @param data 消息数据
     * @param priority 优先级
     * @param ttl 存活时间（毫秒），0 = 永不过期
     */
    enqueue(event: string, data: unknown, priority = MessagePriority.NORMAL, ttl = 0): number {
        // 队列满时丢弃最低优先级的消息
        if (this._queue.length >= this._maxSize) {
            this._queue.sort((a, b) => a.priority - b.priority);
            const dropped = this._queue.shift();
            if (dropped) {
                Logger.warn('MessageQueue', `队列已满，丢弃消息: ${dropped.event}`);
            }
        }

        const id = ++this._idCounter;
        const now = Date.now();
        this._queue.push({
            id,
            event,
            data,
            priority,
            createdAt: now,
            expireAt: ttl > 0 ? now + ttl : 0,
        });

        // 按优先级排序（高优先级在前）
        this._queue.sort((a, b) => b.priority - a.priority);

        return id;
    }

    /**
     * 取出所有未过期消息（清空队列）
     */
    flush(): Array<{ event: string; data: unknown }> {
        const now = Date.now();
        const valid = this._queue.filter((m) => m.expireAt === 0 || m.expireAt > now);
        this._queue.length = 0;

        Logger.info('MessageQueue', `flush: ${valid.length} 条消息`);
        return valid.map((m) => ({ event: m.event, data: m.data }));
    }

    /**
     * 移除指定消息
     */
    remove(id: number): boolean {
        const index = this._queue.findIndex((m) => m.id === id);
        if (index !== -1) {
            this._queue.splice(index, 1);
            return true;
        }
        return false;
    }

    /**
     * 清空队列
     */
    clear(): void {
        this._queue.length = 0;
    }

    /**
     * 清理过期消息
     */
    purgeExpired(): number {
        const now = Date.now();
        const before = this._queue.length;
        this._queue = this._queue.filter((m) => m.expireAt === 0 || m.expireAt > now);
        return before - this._queue.length;
    }

    get size(): number { return this._queue.length; }
    get isEmpty(): boolean { return this._queue.length === 0; }
}
