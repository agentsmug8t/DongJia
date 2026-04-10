// 文件路径：assets/scripts/modules/guild/model/GuildModel.ts
// 依赖：core/base/BaseModel.ts, core/constants/EventTypes.ts

import { BaseModel } from 'db://assets/scripts/core/base/BaseModel';
import { GuildEvent } from 'db://assets/scripts/core/constants/EventTypes';

/** 联盟信息 */
export interface GuildInfo {
    guildId: string;
    name: string;
    level: number;
    memberCount: number;
    maxMembers: number;
    notice: string;
    leaderId: string;
}

/**
 * 联盟数据模型
 */
export class GuildModel extends BaseModel {
    private _guildInfo: GuildInfo | null = null;
    private _members: GuildMemberInfo[] = [];

    get guildInfo(): GuildInfo | null { return this._guildInfo; }
    get members(): ReadonlyArray<GuildMemberInfo> { return this._members; }
    get isInGuild(): boolean { return this._guildInfo !== null; }

    initFromServer(info: GuildInfo, members: GuildMemberInfo[]): void {
        this._guildInfo = info;
        this._members = members;
    }

    addMember(member: GuildMemberInfo): void {
        this._members.push(member);
        this.notify(GuildEvent.MemberOnline, member);
    }

    removeMember(playerId: string): void {
        this._members = this._members.filter((m) => m.playerId !== playerId);
    }

    updateMemberOnline(playerId: string, isOnline: boolean): void {
        const member = this._members.find((m) => m.playerId === playerId);
        if (member) {
            member.isOnline = isOnline;
            this.notify(isOnline ? GuildEvent.MemberOnline : GuildEvent.MemberOffline, member);
        }
    }

    clearGuild(): void {
        this._guildInfo = null;
        this._members = [];
        this.notify(GuildEvent.Left);
    }

    override reset(): void {
        this._guildInfo = null;
        this._members = [];
    }
}
