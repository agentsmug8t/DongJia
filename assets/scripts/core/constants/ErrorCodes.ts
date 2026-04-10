// 文件路径：assets/scripts/core/constants/ErrorCodes.ts
// 依赖：无

/**
 * 错误码定义
 * 规则：
 *   1xxx - 通用错误
 *   2xxx - 网络/服务器错误
 *   3xxx - 玩家/账号错误
 *   4xxx - 商铺/订单错误
 *   5xxx - 联盟错误
 */
export enum ErrorCode {
    // 通用
    Success = 0,
    Unknown = 1000,
    InvalidParams = 1001,
    Timeout = 1002,
    NotFound = 1003,
    PermissionDenied = 1004,
    RateLimited = 1005,

    // 网络
    NetworkDisconnected = 2000,
    NetworkReconnectFailed = 2001,
    ServerError = 2002,
    ServerMaintenance = 2003,
    VersionMismatch = 2004,

    // 玩家/账号
    NotLoggedIn = 3000,
    TokenExpired = 3001,
    AccountBanned = 3002,
    LevelNotEnough = 3003,
    CopperNotEnough = 3004,
    SilverNotEnough = 3005,

    // 商铺/订单
    OrderNotFound = 4000,
    OrderAlreadyTaken = 4001,
    OrderQueueFull = 4002,
    WorkerSlotFull = 4003,
    ShopLevelNotEnough = 4004,
    GoodsNotEnough = 4005,

    // 联盟
    GuildNotFound = 5000,
    GuildFull = 5001,
    AlreadyInGuild = 5002,
    NotInGuild = 5003,
    TradeFailed = 5004,
}

/**
 * 获取错误码对应的中文描述
 * @param code - 错误码枚举值
 * @returns 中文描述字符串
 */
export function getErrorMessage(code: ErrorCode): string {
    const messages: Partial<Record<ErrorCode, string>> = {
        [ErrorCode.Success]: '成功',
        [ErrorCode.Unknown]: '未知错误',
        [ErrorCode.InvalidParams]: '参数错误',
        [ErrorCode.Timeout]: '请求超时',
        [ErrorCode.NotFound]: '资源不存在',
        [ErrorCode.PermissionDenied]: '权限不足',
        [ErrorCode.RateLimited]: '操作过于频繁',
        [ErrorCode.NetworkDisconnected]: '网络已断开',
        [ErrorCode.NetworkReconnectFailed]: '重连失败',
        [ErrorCode.ServerError]: '服务器错误',
        [ErrorCode.ServerMaintenance]: '服务器维护中',
        [ErrorCode.VersionMismatch]: '版本不匹配，请更新',
        [ErrorCode.NotLoggedIn]: '请先登录',
        [ErrorCode.TokenExpired]: '登录已过期',
        [ErrorCode.AccountBanned]: '账号已被封禁',
        [ErrorCode.LevelNotEnough]: '等级不足',
        [ErrorCode.CopperNotEnough]: '铜钱不足',
        [ErrorCode.SilverNotEnough]: '银两不足',
        [ErrorCode.OrderNotFound]: '订单不存在',
        [ErrorCode.OrderAlreadyTaken]: '订单已被接取',
        [ErrorCode.OrderQueueFull]: '订单队列已满',
        [ErrorCode.WorkerSlotFull]: '伙夫名额已满',
        [ErrorCode.ShopLevelNotEnough]: '商铺等级不足',
        [ErrorCode.GoodsNotEnough]: '货物不足',
        [ErrorCode.GuildNotFound]: '联盟不存在',
        [ErrorCode.GuildFull]: '联盟人数已满',
        [ErrorCode.AlreadyInGuild]: '已加入联盟',
        [ErrorCode.NotInGuild]: '未加入联盟',
        [ErrorCode.TradeFailed]: '交易失败',
    };
    return messages[code] ?? `错误码 ${code}`;
}
