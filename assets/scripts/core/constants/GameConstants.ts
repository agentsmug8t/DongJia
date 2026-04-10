// 文件路径：assets/scripts/core/constants/GameConstants.ts
// 依赖：无

/**
 * 游戏核心常量
 */
export const GameConstants = {
    // 版本
    VERSION: '1.0.0',
    BUILD_NUMBER: 1,

    // 网络
    SOCKET_RECONNECT_MAX: 5,
    SOCKET_RECONNECT_DELAY_BASE: 1000, // ms，指数退避基数
    HTTP_TIMEOUT: 10_000, // ms
    HEARTBEAT_INTERVAL: 30_000, // ms

    // 游戏逻辑
    MAX_WORKER_COUNT: 10,
    MAX_ORDER_QUEUE: 20,
    ORDER_EXPIRE_SECONDS: 3600,
    DAILY_RESET_HOUR: 5, // 每天 05:00 重置

    // 货币上限
    MAX_COPPER: 999_999_999,
    MAX_SILVER: 9_999_999,

    // 等级
    MAX_PLAYER_LEVEL: 100,
    MAX_SHOP_LEVEL: 50,

    // 本地存储 key 前缀
    STORAGE_PREFIX: 'dj_',

    // 对象池预创建数量
    POOL_INIT_ORDER_ITEM: 10,
    POOL_INIT_WORKER_ITEM: 5,
} as const;

/**
 * 商品类型
 */
export enum ItemType {
    Food = 1,       // 食材
    Spice = 2,      // 香料
    Tool = 3,       // 器具
    Special = 4,    // 特产
}

/**
 * 订单难度
 */
export enum OrderDifficulty {
    Easy = 1,
    Normal = 2,
    Hard = 3,
    Legendary = 4,
}

/**
 * 玩家称号
 */
export enum PlayerTitle {
    Novice = 'novice',
    Merchant = 'merchant',
    Master = 'master',
    Legend = 'legend',
}
