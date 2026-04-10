/**
 * 统一响应格式
 * 匹配客户端 ServerResponse<T> 接口：{ code, message, data, timestamp }
 */
export interface ServerResponse<T = unknown> {
    code: number;
    message: string;
    data: T;
    timestamp: number;
}

/** 成功响应 */
export function success<T>(data: T, message = 'ok'): ServerResponse<T> {
    return { code: 0, message, data, timestamp: Date.now() };
}

/** 失败响应 */
export function fail(code: number, message: string): ServerResponse<null> {
    return { code, message, data: null, timestamp: Date.now() };
}

/** 错误码（与客户端 ErrorCodes.ts 对应） */
export const ErrorCode = {
    Success: 0,
    Unknown: 1000,
    InvalidParams: 1001,
    Timeout: 1002,
    NotFound: 1003,
    PermissionDenied: 1004,
    RateLimited: 1005,
    NotLoggedIn: 3000,
    TokenExpired: 3001,
    AccountBanned: 3002,
    LevelNotEnough: 3003,
    CopperNotEnough: 3004,
    SilverNotEnough: 3005,
    OrderNotFound: 4000,
    OrderAlreadyTaken: 4001,
    OrderQueueFull: 4002,
    WorkerSlotFull: 4003,
    ShopLevelNotEnough: 4004,
    GoodsNotEnough: 4005,
    GuildNotFound: 5000,
    GuildFull: 5001,
    AlreadyInGuild: 5002,
    NotInGuild: 5003,
    TradeFailed: 5004,
} as const;
