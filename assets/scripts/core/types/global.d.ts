// 文件路径：assets/scripts/core/types/global.d.ts
// 依赖：无

/**
 * 全局类型声明
 */

/** 通用服务器响应包装 */
interface ServerResponse<T = unknown> {
    code: number;
    message: string;
    data: T;
    timestamp: number;
}

/** 分页数据 */
interface PageData<T> {
    list: T[];
    total: number;
    page: number;
    pageSize: number;
}

/** 奖励信息 */
interface RewardInfo {
    copper?: number;
    silver?: number;
    prestige?: number;
    items?: Array<{ itemId: number; count: number }>;
    exp?: number;
}

/** 玩家基础信息 */
interface PlayerBaseInfo {
    id: string;
    nickname: string;
    level: number;
    avatar: string;
    copper: number;
    silver: number;
    prestige: number;
    title: string;
}

/** 道具信息 */
interface ItemInfo {
    itemId: number;
    count: number;
    expireAt?: number; // 过期时间戳（秒），0 表示永久
}

/** 订单信息 */
interface OrderInfo {
    orderId: number;
    configId: number;
    name: string;
    difficulty: number;
    reward: RewardInfo;
    startAt: number;
    endAt: number;
    status: OrderStatus;
}

/** 订单状态 */
declare const enum OrderStatus {
    PENDING = 0,
    IN_PROGRESS = 1,
    COMPLETED = 2,
    FAILED = 3,
    EXPIRED = 4,
}

/** 伙夫信息 */
interface WorkerInfo {
    workerId: string;
    name: string;
    level: number;
    skill: number;
    status: WorkerStatus;
}

/** 伙夫状态 */
declare const enum WorkerStatus {
    IDLE = 0,
    WORKING = 1,
    RESTING = 2,
}

/** 联盟成员信息 */
interface GuildMemberInfo {
    playerId: string;
    nickname: string;
    level: number;
    contribution: number;
    isOnline: boolean;
    lastOnlineAt: number;
}

/** 可选回调类型 */
type Callback<T = void> = (result: T) => void;
type ErrorCallback = (error: Error) => void;
type VoidCallback = () => void;

/** 深度只读 */
type DeepReadonly<T> = {
    readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K];
};

/** 深度可选 */
type DeepPartial<T> = {
    [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};
