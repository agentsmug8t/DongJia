import { Socket } from 'socket.io';
import { guildService } from '../services/GuildService';
import { success, fail, ErrorCode } from '../utils/response';
import { logger } from '../utils/logger';

/**
 * 联盟事件处理器
 * 对应客户端 SocketEvent: GUILD_INFO, GUILD_JOIN, GUILD_LEAVE, GUILD_TRADE, GUILD_CHAT
 */
export function registerGuildHandler(socket: Socket): void {
    socket.on('guild:info', async (_data, ack) => {
        try {
            const playerId = socket.data.playerId as string;
            // 通过 playerId 查找所属联盟
            const { Player } = await import('../models/Player');
            const player = await Player.findOne({ playerId }).lean();
            if (!player?.guildId) {
                if (typeof ack === 'function') ack(success({ guild: null, members: [] }));
                return;
            }
            const result = await guildService.getGuildInfo(player.guildId);
            if (typeof ack === 'function') ack(success(result));
        } catch (err) {
            logger.error('[GuildHandler] guild:info 失败', err);
            if (typeof ack === 'function') ack(fail(ErrorCode.Unknown, '获取联盟信息失败'));
        }
    });

    socket.on('guild:join', async (data: { guildId: string }, ack) => {
        try {
            const playerId = socket.data.playerId as string;
            const ok = await guildService.joinGuild(playerId, data.guildId);
            if (!ok) {
                if (typeof ack === 'function') ack(fail(ErrorCode.GuildFull, '加入联盟失败'));
                return;
            }
            // 加入联盟房间
            socket.join(`guild:${data.guildId}`);
            if (typeof ack === 'function') ack(success({ success: true }));
        } catch (err) {
            logger.error('[GuildHandler] guild:join 失败', err);
            if (typeof ack === 'function') ack(fail(ErrorCode.Unknown, '加入失败'));
        }
    });

    socket.on('guild:leave', async (_data, ack) => {
        try {
            const playerId = socket.data.playerId as string;
            const ok = await guildService.leaveGuild(playerId);
            if (typeof ack === 'function') ack(success({ success: ok }));
        } catch (err) {
            logger.error('[GuildHandler] guild:leave 失败', err);
            if (typeof ack === 'function') ack(fail(ErrorCode.Unknown, '退出失败'));
        }
    });

    socket.on('guild:trade', async (data: { targetPlayerId: string; itemId: number; count: number; price: number }, ack) => {
        // TODO: 实现联盟交易逻辑
        logger.debug('[GuildHandler] guild:trade (TODO)', data);
        if (typeof ack === 'function') ack(success({ success: true, tradeId: `trade_${Date.now()}` }));
    });

    socket.on('guild:chat', (data: { message: string }) => {
        const playerId = socket.data.playerId as string;
        // 广播到联盟房间
        socket.rooms.forEach((room) => {
            if (room.startsWith('guild:')) {
                socket.to(room).emit('guild:chat', {
                    playerId,
                    message: data.message,
                    timestamp: Date.now(),
                });
            }
        });
    });
}
