// 文件路径：assets/scripts/modules/guild/service/GuildService.ts
// 依赖：core/manager/NetworkManager.ts, core/network/Protocol.ts

import { NetworkManager } from 'db://assets/scripts/core/manager/NetworkManager';
import { SocketEvent, GuildTradeRequest, GuildTradeResponse } from 'db://assets/scripts/core/network/Protocol';
import { GuildInfo } from 'db://assets/scripts/modules/guild/model/GuildModel';

/**
 * 联盟业务服务层
 */
export class GuildService {
    private _network: NetworkManager = NetworkManager.getInstance();

    async getGuildInfo(): Promise<{ guild: GuildInfo; members: GuildMemberInfo[] }> {
        return this._network.request(SocketEvent.GUILD_INFO, {});
    }

    async joinGuild(guildId: string): Promise<{ success: boolean }> {
        return this._network.request(SocketEvent.GUILD_JOIN, { guildId });
    }

    async leaveGuild(): Promise<{ success: boolean }> {
        return this._network.request(SocketEvent.GUILD_LEAVE, {});
    }

    async trade(request: GuildTradeRequest): Promise<GuildTradeResponse> {
        return this._network.request<GuildTradeResponse>(SocketEvent.GUILD_TRADE, request);
    }

    onChat(callback: (...args: unknown[]) => void): void {
        this._network.on(SocketEvent.GUILD_CHAT, callback);
    }
}
