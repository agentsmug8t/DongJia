import { getRedis } from '../config/database';

const ONLINE_KEY = 'dongjia:online';
const SESSION_PREFIX = 'dongjia:session:';

export const redisUtil = {
    /** 存储会话 token → playerId */
    async setSession(token: string, playerId: string, ttlSeconds = 604800): Promise<void> {
        await getRedis().set(`${SESSION_PREFIX}${token}`, playerId, 'EX', ttlSeconds);
    },

    /** 通过 token 获取 playerId */
    async getSession(token: string): Promise<string | null> {
        return getRedis().get(`${SESSION_PREFIX}${token}`);
    },

    /** 删除会话 */
    async removeSession(token: string): Promise<void> {
        await getRedis().del(`${SESSION_PREFIX}${token}`);
    },

    /** 标记玩家上线 */
    async setOnline(playerId: string): Promise<void> {
        await getRedis().sadd(ONLINE_KEY, playerId);
    },

    /** 标记玩家下线 */
    async setOffline(playerId: string): Promise<void> {
        await getRedis().srem(ONLINE_KEY, playerId);
    },

    /** 检查玩家是否在线 */
    async isOnline(playerId: string): Promise<boolean> {
        return (await getRedis().sismember(ONLINE_KEY, playerId)) === 1;
    },

    /** 获取在线玩家数 */
    async getOnlineCount(): Promise<number> {
        return getRedis().scard(ONLINE_KEY);
    },

    /** 通用缓存 set */
    async cacheSet(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
        const data = JSON.stringify(value);
        if (ttlSeconds) {
            await getRedis().set(key, data, 'EX', ttlSeconds);
        } else {
            await getRedis().set(key, data);
        }
    },

    /** 通用缓存 get */
    async cacheGet<T>(key: string): Promise<T | null> {
        const data = await getRedis().get(key);
        if (!data) return null;
        return JSON.parse(data) as T;
    },

    /** 通用缓存 del */
    async cacheDel(key: string): Promise<void> {
        await getRedis().del(key);
    },
};
