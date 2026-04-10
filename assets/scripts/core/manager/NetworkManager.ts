// 文件路径：assets/scripts/core/manager/NetworkManager.ts
// 依赖：core/utils/Singleton.ts, core/utils/Logger.ts, core/manager/EventManager.ts,
//        core/network/SocketClient.ts, core/network/HttpClient.ts, core/network/MessageQueue.ts,
//        core/constants/EventTypes.ts

import { Singleton } from 'db://assets/scripts/core/utils/Singleton';
import { Logger } from 'db://assets/scripts/core/utils/Logger';
import { EventManager } from 'db://assets/scripts/core/manager/EventManager';
import { SocketClient, ConnectionState } from 'db://assets/scripts/core/network/SocketClient';
import { HttpClient } from 'db://assets/scripts/core/network/HttpClient';
import { MessageQueue, MessagePriority } from 'db://assets/scripts/core/network/MessageQueue';
import { NetworkEvent } from 'db://assets/scripts/core/constants/EventTypes';

/**
 * 网络管理器
 * 集成 SocketClient + HttpClient + MessageQueue，对外提供统一的网络接口
 *
 * @example
 * const nm = NetworkManager.getInstance();
 * await nm.connect('wss://game.example.com');
 * const res = await nm.request<TakeOrderResponse>('order:take', { orderId: 1 });
 */
export class NetworkManager extends Singleton<NetworkManager>() {
    private _socket: SocketClient = new SocketClient();
    private _messageQueue: MessageQueue = new MessageQueue();
    private _serverUrl: string = '';

    protected init(): void {
        Logger.info('NetworkManager', '初始化完成');

        // 监听连接状态变更，转发为全局事件
        this._socket.onStateChange((state) => {
            const em = EventManager.getInstance();
            switch (state) {
                case ConnectionState.CONNECTED:
                    em.emit(NetworkEvent.Connected);
                    this._flushQueue();
                    break;
                case ConnectionState.DISCONNECTED:
                    em.emit(NetworkEvent.Disconnected);
                    break;
                case ConnectionState.RECONNECTING:
                    em.emit(NetworkEvent.Reconnecting);
                    break;
            }
        });
    }

    /**
     * 连接 WebSocket 服务器
     */
    async connect(url: string, options?: Record<string, unknown>): Promise<void> {
        this._serverUrl = url;
        await this._socket.connect(url, options);
    }

    /**
     * 断开连接
     */
    disconnect(): void {
        this._socket.disconnect();
    }

    /**
     * 发送请求（带 ACK 应答）
     * 如果未连接，消息入队等待重连后自动发送
     */
    async request<T = unknown>(event: string, data: unknown): Promise<T> {
        if (!this._socket.isConnected) {
            Logger.warn('NetworkManager', `未连接，消息入队: ${event}`);
            this._messageQueue.enqueue(event, data, MessagePriority.NORMAL, 30_000);
            throw new Error('Network disconnected');
        }
        return this._socket.request<T>(event, data);
    }

    /**
     * 发送消息（无应答）
     */
    send(event: string, data: unknown): void {
        if (!this._socket.isConnected) {
            this._messageQueue.enqueue(event, data, MessagePriority.NORMAL, 30_000);
            return;
        }
        this._socket.send(event, data);
    }

    /**
     * 监听服务器推送
     */
    on(event: string, callback: (...args: unknown[]) => void): void {
        this._socket.on(event, callback);
    }

    off(event: string, callback?: (...args: unknown[]) => void): void {
        this._socket.off(event, callback);
    }

    /**
     * HTTP GET
     */
    httpGet<T>(url: string): Promise<T> {
        return HttpClient.get<T>(url);
    }

    /**
     * HTTP POST
     */
    httpPost<T>(url: string, body?: unknown): Promise<T> {
        return HttpClient.post<T>(url, body);
    }

    /**
     * 设置 HTTP 基础 URL
     */
    setHttpBaseUrl(url: string): void {
        HttpClient.setBaseUrl(url);
    }

    /**
     * 设置 HTTP 认证 Token
     */
    setAuthToken(token: string): void {
        HttpClient.setHeader('Authorization', `Bearer ${token}`);
    }

    get isConnected(): boolean {
        return this._socket.isConnected;
    }

    get connectionState(): ConnectionState {
        return this._socket.state;
    }

    /** 网络恢复后，重发队列中的消息 */
    private _flushQueue(): void {
        if (this._messageQueue.isEmpty) return;
        const messages = this._messageQueue.flush();
        for (const msg of messages) {
            Logger.debug('NetworkManager', `重发消息: ${msg.event}`);
            this._socket.send(msg.event, msg.data);
        }
    }

    protected onDestroy(): void {
        this.disconnect();
        this._messageQueue.clear();
    }
}
