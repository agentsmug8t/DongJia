import { Guild, IGuild } from '../models/Guild';
import { Player } from '../models/Player';

function generateId(): string {
    return `guild_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

export class GuildService {
    /** 获取联盟信息 */
    async getGuildInfo(guildId: string): Promise<{
        guild: { guildId: string; name: string; level: number; memberCount: number; maxMembers: number; notice: string; leaderId: string };
        members: IGuild['members'];
    } | null> {
        const guild = await Guild.findOne({ guildId }).lean();
        if (!guild) return null;
        return {
            guild: {
                guildId: guild.guildId,
                name: guild.name,
                level: guild.level,
                memberCount: guild.members.length,
                maxMembers: guild.maxMembers,
                notice: guild.notice,
                leaderId: guild.leaderId,
            },
            members: guild.members,
        };
    }

    /** 加入联盟 */
    async joinGuild(playerId: string, guildId: string): Promise<boolean> {
        const player = await Player.findOne({ playerId });
        if (!player) return false;
        if (player.guildId) return false; // 已在联盟中

        const guild = await Guild.findOne({ guildId });
        if (!guild) return false;
        if (guild.members.length >= guild.maxMembers) return false;

        guild.members.push({
            playerId,
            nickname: player.nickname,
            level: player.level,
            contribution: 0,
            joinedAt: new Date(),
        });
        await guild.save();

        player.guildId = guildId;
        await player.save();

        return true;
    }

    /** 退出联盟 */
    async leaveGuild(playerId: string): Promise<boolean> {
        const player = await Player.findOne({ playerId });
        if (!player || !player.guildId) return false;

        await Guild.updateOne(
            { guildId: player.guildId },
            { $pull: { members: { playerId } } }
        );

        player.guildId = '';
        await player.save();
        return true;
    }

    /** 创建联盟 */
    async createGuild(playerId: string, name: string): Promise<string | null> {
        const player = await Player.findOne({ playerId });
        if (!player || player.guildId) return null;

        const guildId = generateId();
        await Guild.create({
            guildId,
            name,
            leaderId: playerId,
            members: [{
                playerId,
                nickname: player.nickname,
                level: player.level,
                contribution: 0,
                joinedAt: new Date(),
            }],
        });

        player.guildId = guildId;
        await player.save();
        return guildId;
    }
}

export const guildService = new GuildService();
