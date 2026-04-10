import { Socket } from 'socket.io';
import { authService } from '../services/AuthService';
import { redisUtil } from '../utils/redis';
import { logger } from '../utils/logger';

/**
 * Socket.IO 认证中间件
 * 客户端连接时通过 auth.token 传递 JWT
 */
export async function authMiddleware(socket: Socket, next: (err?: Error) => void): Promise<void> {
    const token = socket.handshake.auth?.token as string | undefined;

    if (!token) {
        logger.warn(`[Socket] 未提供 token: ${socket.id}`);
        next(new Error('Authentication required'));
        return;
    }

    const playerId = await authService.verifyToken(token);
    if (!playerId) {
        logger.warn(`[Socket] token 无效: ${socket.id}`);
        next(new Error('Invalid token'));
        return;
    }

    // 将 playerId 挂载到 socket.data 上
    socket.data.playerId = playerId;
    socket.data.token = token;

    await redisUtil.setOnline(playerId);
    logger.debug(`[Socket] 认证通过: ${playerId} (${socket.id})`);
    next();
}
