import { Socket } from 'socket.io';
import { authService } from '../services/AuthService';
import { success, fail, ErrorCode } from '../utils/response';
import { logger } from '../utils/logger';

/**
 * 登录事件处理器
 * 对应客户端 SocketEvent.LOGIN = 'user:login'
 * 注意：登录事件不需要认证中间件，在连接后立即调用
 */
export function registerAuthHandler(socket: Socket): void {
    socket.on('user:login', async (data: { token: string; platform: string; version: string }, ack) => {
        try {
            const result = await authService.login(data.token, data.platform, data.version);

            // 将 playerId 挂载到 socket
            socket.data.playerId = result.playerId;
            socket.data.jwtToken = result.jwtToken;

            // 加入玩家专属房间（用于定向推送）
            socket.join(`player:${result.playerId}`);

            if (typeof ack === 'function') {
                ack(success({
                    playerId: result.playerId,
                    nickname: result.nickname,
                    level: result.level,
                    serverTime: result.serverTime,
                }));
            }
        } catch (err) {
            logger.error('[AuthHandler] 登录失败', err);
            if (typeof ack === 'function') {
                ack(fail(ErrorCode.Unknown, '登录失败'));
            }
        }
    });

    socket.on('user:logout', async (_data, ack) => {
        const playerId = socket.data.playerId as string;
        const token = socket.data.jwtToken as string;
        if (playerId && token) {
            await authService.logout(playerId, token);
        }
        if (typeof ack === 'function') {
            ack(success(null));
        }
    });
}
