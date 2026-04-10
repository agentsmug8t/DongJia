// 文件路径：assets/scripts/core/network/Protocol.ts
// 依赖：无

/**
 * Socket 事件常量
 */
export const SocketEvent = {
    // 连接
    CONNECT: 'connect',
    DISCONNECT: 'disconnect',
    RECONNECT: 'reconnect',
    ERROR: 'error',

    // 心跳
    PING: 'ping',
    PONG: 'pong',

    // 登录
    LOGIN: 'user:login',
    LOGOUT: 'user:logout',

    // 商铺
    TAKE_ORDER: 'order:take',
    DELIVER_ORDER: 'order:deliver',
    CANCEL_ORDER: 'order:cancel',
    ORDER_COMPLETED: 'order:completed',
    ORDER_EXPIRED: 'order:expired',
    SHOP_INFO: 'shop:info',
    SHOP_UPGRADE: 'shop:upgrade',

    // 伙夫
    HIRE_WORKER: 'worker:hire',
    FIRE_WORKER: 'worker:fire',
    WORKER_STATUS: 'worker:status',

    // 联盟
    GUILD_INFO: 'guild:info',
    GUILD_JOIN: 'guild:join',
    GUILD_LEAVE: 'guild:leave',
    GUILD_TRADE: 'guild:trade',
    GUILD_CHAT: 'guild:chat',

    // 玩家
    PLAYER_INFO: 'player:info',
    PLAYER_UPDATE: 'player:update',

    // 任务
    TASK_LIST: 'task:list',
    TASK_CLAIM: 'task:claim',

    // 系统
    SERVER_TIME: 'system:time',
    ANNOUNCEMENT: 'system:announcement',
    MAINTENANCE: 'system:maintenance',
} as const;

export type SocketEventKey = keyof typeof SocketEvent;

// ─── 请求类型 ─────────────────────────────────────────────────

export interface LoginRequest {
    token: string;
    platform: string;
    version: string;
}

export interface LoginResponse {
    playerId: string;
    nickname: string;
    level: number;
    serverTime: number;
}

/** 接单请求 */
export interface TakeOrderRequest {
    orderId: number;
}

/** 接单响应 */
export interface TakeOrderResponse {
    success: boolean;
    message?: string;
    order?: {
        orderId: number;
        name: string;
        duration: number;
        rewardCopper: number;
        startAt: number;
    };
}

/** 交付请求（无需参数，服务器通过 socket.data.playerId 识别） */
export interface DeliverOrderRequest {}

/** 交付响应 */
export interface DeliverOrderResponse {
    success: boolean;
    message?: string;
    reward?: {
        copper: number;
    };
}

export interface ShopUpgradeRequest {
    shopId: string;
}

export interface ShopUpgradeResponse {
    success: boolean;
    newLevel: number;
    cost: number;
}

export interface HireWorkerRequest {
    workerId: string;
}

export interface HireWorkerResponse {
    success: boolean;
    worker: WorkerInfo;
}

export interface GuildTradeRequest {
    targetPlayerId: string;
    itemId: number;
    count: number;
    price: number;
}

export interface GuildTradeResponse {
    success: boolean;
    tradeId: string;
}

export interface TaskClaimRequest {
    taskId: number;
}

export interface TaskClaimResponse {
    success: boolean;
    reward: RewardInfo;
}

// ─── 服务器推送类型 ───────────────────────────────────────────

export interface OrderCompletedPush {
    orderId: number;
    completedAt: number;
    reward: RewardInfo;
}

export interface OrderExpiredPush {
    orderId: number;
}

export interface AnnouncementPush {
    id: number;
    title: string;
    content: string;
    type: 'normal' | 'urgent';
}

export interface MaintenancePush {
    startAt: number;
    endAt: number;
    message: string;
}
