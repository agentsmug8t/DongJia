import { Socket } from 'socket.io';
import { playerService } from '../services/PlayerService';
import { success, fail, ErrorCode } from '../utils/response';
import { logger } from '../utils/logger';

/**
 * 系统 + 玩家事件处理器
 * 对应客户端 SocketEvent: PLAYER_INFO, PLAYER_UPDATE, SERVER_TIME
 */
export function registerSystemHandler(socket: Socket): void {
    // 心跳
    socket.on('ping', (_data, ack) => {
        if (typeof ack === 'function') ack(success({ time: Date.now() }));
    });

    // 服务器时间
    socket.on('system:time', (_data, ack) => {
        if (typeof ack === 'function') ack(success({ serverTime: Date.now() }));
    });

    // 玩家信息
    socket.on('player:info', async (_data, ack) => {
        try {
            const playerId = socket.data.playerId as string;
            const info = await playerService.getPlayerInfo(playerId);
            if (!info) {
                if (typeof ack === 'function') ack(fail(ErrorCode.NotFound, '玩家不存在'));
                return;
            }
            if (typeof ack === 'function') ack(success(info));
        } catch (err) {
            logger.error('[SystemHandler] player:info 失败', err);
            if (typeof ack === 'function') ack(fail(ErrorCode.Unknown, '获取玩家信息失败'));
        }
    });

    // 更新玩家信息
    socket.on('player:update', async (data: { nickname?: string; avatar?: string }, ack) => {
        try {
            const playerId = socket.data.playerId as string;
            const ok = await playerService.updatePlayer(playerId, data);
            if (typeof ack === 'function') ack(success({ success: ok }));
        } catch (err) {
            logger.error('[SystemHandler] player:update 失败', err);
            if (typeof ack === 'function') ack(fail(ErrorCode.Unknown, '更新失败'));
        }
    });
}
