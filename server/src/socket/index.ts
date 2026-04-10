import { Server, Socket } from 'socket.io';
import { authMiddleware } from './middleware';
import { registerAuthHandler } from './AuthHandler';
import { registerShopHandler } from './ShopHandler';
import { registerOrderHandler } from './OrderHandler';
import { registerGuildHandler } from './GuildHandler';
import { registerTaskHandler } from './TaskHandler';
import { registerSystemHandler } from './SystemHandler';
import { redisUtil } from '../utils/redis';
import { logger } from '../utils/logger';

/**
 * 初始化 Socket.IO 事件系统
 * 注册所有事件处理器，对接客户端 Protocol.ts 中定义的全部事件
 */
export function initSocketHandlers(io: Server): void {
    // 登录命名空间（不需要认证）
    io.on('connection', (socket: Socket) => {
        logger.info(`[Socket] 新连接: ${socket.id}`);

        // 登录处理器（无需认证）
        registerAuthHandler(socket);

        // 认证后的处理器
        // 客户端登录成功后，后续请求都带 playerId
        registerSystemHandler(socket);
        registerShopHandler(socket);
        registerOrderHandler(socket);
        registerGuildHandler(socket);
        registerTaskHandler(socket);

        // 断开连接
        socket.on('disconnect', async (reason) => {
            const playerId = socket.data.playerId as string | undefined;
            if (playerId) {
                await redisUtil.setOffline(playerId);
                logger.info(`[Socket] 断开: ${playerId} (${reason})`);
            } else {
                logger.debug(`[Socket] 未认证连接断开: ${socket.id}`);
            }
        });
    });

    logger.info('[Socket] 事件处理器注册完成');
}
