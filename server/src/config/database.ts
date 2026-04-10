import mongoose from 'mongoose';
import Redis from 'ioredis';
import { config } from './index';
import { logger } from '../utils/logger';

/** MongoDB 连接 */
export async function connectMongoDB(): Promise<void> {
    try {
        await mongoose.connect(config.mongodb.uri);
        logger.info('[MongoDB] 连接成功');

        mongoose.connection.on('error', (err) => {
            logger.error('[MongoDB] 连接异常', err);
        });

        mongoose.connection.on('disconnected', () => {
            logger.warn('[MongoDB] 连接断开');
        });
    } catch (err) {
        logger.error('[MongoDB] 连接失败', err);
        process.exit(1);
    }
}

/** Redis 客户端单例 */
let redisClient: Redis | null = null;

export function getRedis(): Redis {
    if (!redisClient) {
        redisClient = new Redis({
            host: config.redis.host,
            port: config.redis.port,
            password: config.redis.password,
            retryStrategy(times: number) {
                const delay = Math.min(times * 500, 5000);
                logger.warn(`[Redis] 重连中... 第 ${times} 次，${delay}ms 后重试`);
                return delay;
            },
        });

        redisClient.on('connect', () => {
            logger.info('[Redis] 连接成功');
        });

        redisClient.on('error', (err) => {
            logger.error('[Redis] 连接异常', err);
        });
    }
    return redisClient;
}

/** 关闭所有数据库连接 */
export async function disconnectAll(): Promise<void> {
    await mongoose.disconnect();
    if (redisClient) {
        redisClient.disconnect();
        redisClient = null;
    }
    logger.info('[Database] 所有连接已关闭');
}
