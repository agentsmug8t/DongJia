// 文件路径：assets/scripts/modules/player/service/PlayerService.ts
// 依赖：core/manager/NetworkManager.ts, core/network/Protocol.ts

import { NetworkManager } from 'db://assets/scripts/core/manager/NetworkManager';
import { SocketEvent } from 'db://assets/scripts/core/network/Protocol';

/**
 * 玩家业务服务层
 */
export class PlayerService {
    private _network: NetworkManager = NetworkManager.getInstance();

    async getPlayerInfo(): Promise<PlayerBaseInfo> {
        return this._network.request(SocketEvent.PLAYER_INFO, {});
    }

    async updateNickname(nickname: string): Promise<{ success: boolean }> {
        return this._network.request(SocketEvent.PLAYER_UPDATE, { nickname });
    }

    async updateAvatar(avatar: string): Promise<{ success: boolean }> {
        return this._network.request(SocketEvent.PLAYER_UPDATE, { avatar });
    }

    onPlayerUpdate(callback: (...args: unknown[]) => void): void {
        this._network.on(SocketEvent.PLAYER_UPDATE, callback);
    }
}
