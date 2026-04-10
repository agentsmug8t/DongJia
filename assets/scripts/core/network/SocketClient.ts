// 文件路径：assets/scripts/core/network/SocketClient.ts
// 依赖：core/utils/Logger.ts, core/constants/GameConstants.ts

import { Logger } from 'db://assets/scripts/core/utils/Logger';
import { GameConstants } from 'db://assets/scripts/core/constants/GameConstants';

// Socket.IO 4.x 类型声明（通过插件脚本注入到 window.io）
interface SocketIO {
    connected: boolean;
    connect(): void;
    disconnect(): void;
    emit(event: string, data: unknown, ack?: (response: unknown) => void): void;
    on(event: string, callback: (...args: unknown[]) => void): void;
    off(event: string, callback?: (...args: unknown[]) => void): void;
    io: { opts: Record<string, unknown> };
}

/** 获取 socket.io-client 4.x 的 io 函数（从全局 window 获取） */
function getIO(): (url: string, opts?: Record<string, unknown>) => SocketIO {
    const w = globalThis as Record<string, unknown>;
    // socket.io-client 4.x 浏览器版本会挂载到 window.io
    const ioFn = w['io'] as ((url: string, opts?: Record<string, unknown>) => SocketIO) | undefined;
    if (!ioFn) {
        throw new Error('socket.io-client 未加载，请在 Cocos 编辑器中将 socket.io.min.js 设为插件脚本');
    }
    return ioFn;
}

/** 连接状态 */
export enum ConnectionState {
    DISCONNECTED = 'disconnected',
    CONNECTING = 'connecting',
    CONNECTED = 'connected',
    RECONNECTING = 'reconnecting',
}

/** 连接状态变更回调 */
export type StateChangeCallback = (state: ConnectionState) => void;

/**
 * Socket.IO 客户端封装
 * 提供自动重连（指数退避）、心跳检测、ACK 应答
 *
 * @example
 * const client = new SocketClient();
 * await client.connect('wss://game.example.com');
 * const res = await client.request('order:take', { orderId: 1 });
 */
export class SocketClient {
    private _socket: SocketIO | null = null;
    private _state: ConnectionState = ConnectionState.DISCONNECTED;
    private _reconnectCount: number = 0;
    private _heartbeatTimer: ReturnType<typeof setInterval> | null = null;
    private _stateCallbacks: StateChangeCallback[] = [];

    get state(): ConnectionState { return this._state; }
    get isConnected(): boolean { return this._state === ConnectionState.CONNECTED; }

    /**
     * 连接服务器
     */
    connect(url: string, options?: Record<string, unknown>): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this._socket?.connected) {
                resolve();
                return;
            }

            this._setState(ConnectionState.CONNECTING);

            this._socket = getIO()(url, {
                transports: ['websocket'],
                reconnection: false,
                timeout: GameConstants.HTTP_TIMEOUT,
                ...options,
            });

            this._socket.on('connect', () => {
                this._reconnectCount = 0;
                this._setState(ConnectionState.CONNECTED);
                this._startHeartbeat();
                Logger.info('SocketClient', `已连接: ${url}`);
                resolve();
            });

            this._socket.on('disconnect', (reason: unknown) => {
                this._stopHeartbeat();
                this._setState(ConnectionState.DISCONNECTED);
                Logger.warn('SocketClient', `断开连接: ${String(reason)}`);
                this._tryReconnect(url, options);
            });

            this._socket.on('connect_error', (err: unknown) => {
                Logger.error('SocketClient', '连接错误', err);
                if (this._state === ConnectionState.CONNECTING) {
                    reject(err);
                }
            });
        });
    }

    /**
     * 断开连接
     */
    disconnect(): void {
        this._stopHeartbeat();
        this._reconnectCount = GameConstants.SOCKET_RECONNECT_MAX; // 阻止自动重连
        this._socket?.disconnect();
        this._socket = null;
        this._setState(ConnectionState.DISCONNECTED);
    }

    /**
     * 发送消息（无应答）
     */
    send(event: string, data: unknown): void {
        if (!this._socket?.connected) {
            Logger.warn('SocketClient', `未连接，消息丢弃: ${event}`);
            return;
        }
        this._socket.emit(event, data);
    }

    /**
     * 发送请求（带 ACK 应答，返回 Promise）
     */
    request<T = unknown>(event: string, data: unknown, timeout = GameConstants.HTTP_TIMEOUT): Promise<T> {
        return new Promise((resolve, reject) => {
            if (!this._socket?.connected) {
                reject(new Error('Socket not connected'));
                return;
            }

            const timer = setTimeout(() => {
                reject(new Error(`Request timeout: ${event}`));
            }, timeout);

            this._socket.emit(event, data, (response: unknown) => {
                clearTimeout(timer);
                const res = response as ServerResponse<T>;
                if (res.code === 0) {
                    resolve(res.data);
                } else {
                    reject(new Error(`[${res.code}] ${res.message}`));
                }
            });
        });
    }

    /**
     * 监听服务器推送
     */
    on(event: string, callback: (...args: unknown[]) => void): void {
        this._socket?.on(event, callback);
    }

    off(event: string, callback?: (...args: unknown[]) => void): void {
        this._socket?.off(event, callback);
    }

    /**
     * 注册连接状态变更回调
     */
    onStateChange(callback: StateChangeCallback): void {
        this._stateCallbacks.push(callback);
    }

    // ─── 内部方法 ─────────────────────────────────────────────

    private _setState(state: ConnectionState): void {
        if (this._state === state) return;
        this._state = state;
        for (const cb of this._stateCallbacks) {
            cb(state);
        }
    }

    private _startHeartbeat(): void {
        this._stopHeartbeat();
        this._heartbeatTimer = setInterval(() => {
            this._socket?.emit('ping', Date.now());
        }, GameConstants.HEARTBEAT_INTERVAL);
    }

    private _stopHeartbeat(): void {
        if (this._heartbeatTimer !== null) {
            clearInterval(this._heartbeatTimer);
            this._heartbeatTimer = null;
        }
    }

    private _tryReconnect(url: string, options?: Record<string, unknown>): void {
        if (this._reconnectCount >= GameConstants.SOCKET_RECONNECT_MAX) {
            Logger.error('SocketClient', '重连次数已达上限');
            return;
        }

        this._reconnectCount++;
        this._setState(ConnectionState.RECONNECTING);

        // 指数退避
        const delay = GameConstants.SOCKET_RECONNECT_DELAY_BASE * Math.pow(2, this._reconnectCount - 1);
        Logger.info('SocketClient', `${delay}ms 后尝试第 ${this._reconnectCount} 次重连`);

        setTimeout(() => {
            this.connect(url, options).catch(() => {
                // 连接失败会触发 disconnect → 再次 _tryReconnect
            });
        }, delay);
    }
}
