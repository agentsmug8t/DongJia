import { Player, IPlayer } from '../models/Player';

export class PlayerService {
    /** 获取玩家信息（匹配客户端 PlayerBaseInfo） */
    async getPlayerInfo(playerId: string): Promise<{
        id: string;
        nickname: string;
        level: number;
        avatar: string;
        copper: number;
        silver: number;
        prestige: number;
        title: string;
    } | null> {
        const player = await Player.findOne({ playerId }).lean();
        if (!player) return null;
        return {
            id: player.playerId,
            nickname: player.nickname,
            level: player.level,
            avatar: player.avatar,
            copper: player.copper,
            silver: player.silver,
            prestige: player.prestige,
            title: player.title,
        };
    }

    /** 更新玩家信息 */
    async updatePlayer(playerId: string, updates: Partial<Pick<IPlayer, 'nickname' | 'avatar'>>): Promise<boolean> {
        const result = await Player.updateOne({ playerId }, { $set: updates });
        return result.modifiedCount > 0;
    }

    /** 增加铜钱 */
    async addCopper(playerId: string, amount: number): Promise<number> {
        const player = await Player.findOneAndUpdate(
            { playerId },
            { $inc: { copper: amount } },
            { new: true }
        );
        return player?.copper ?? 0;
    }

    /** 消耗铜钱 */
    async spendCopper(playerId: string, amount: number): Promise<boolean> {
        const result = await Player.updateOne(
            { playerId, copper: { $gte: amount } },
            { $inc: { copper: -amount } }
        );
        return result.modifiedCount > 0;
    }

    /** 增加经验 */
    async addExp(playerId: string, amount: number): Promise<{ level: number; exp: number }> {
        const player = await Player.findOne({ playerId });
        if (!player) return { level: 1, exp: 0 };

        player.exp += amount;
        // 简单升级逻辑：每 100 经验升一级
        const newLevel = Math.floor(player.exp / 100) + 1;
        if (newLevel > player.level) {
            player.level = Math.min(newLevel, 100);
        }
        await player.save();
        return { level: player.level, exp: player.exp };
    }
}

export const playerService = new PlayerService();
