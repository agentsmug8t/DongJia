// 文件路径：assets/scripts/modules/guild/view/GuildMainView.ts
// 依赖：core/base/BaseView.ts, guild/controller/GuildController.ts

import { BaseView } from 'db://assets/scripts/core/base/BaseView';
import { GuildController } from 'db://assets/scripts/modules/guild/controller/GuildController';
import { GuildEvent } from 'db://assets/scripts/core/constants/EventTypes';
import { Logger } from 'db://assets/scripts/core/utils/Logger';

/**
 * 联盟主界面
 * TODO: FairyGUI 集成后绑定实际 UI
 */
export class GuildMainView extends BaseView {
    private _controller: GuildController;

    constructor() {
        super('ui/guild/GuildMainView');
        this._controller = new GuildController();
    }

    protected override onCreate(): void {
        this._controller.init();
        this.listenEvent(GuildEvent.Joined, this._refresh.bind(this));
        this.listenEvent(GuildEvent.Left, this._refresh.bind(this));
        this.listenEvent(GuildEvent.MemberOnline, this._refreshMembers.bind(this));
        this.listenEvent(GuildEvent.MemberOffline, this._refreshMembers.bind(this));

        this._controller.loadGuildData();
    }

    protected override onShow(): void {
        this._refresh();
    }

    protected override onDestroy(): void {
        this._controller.destroy();
    }

    private _refresh(): void {
        const guild = this._controller.model.guildInfo;
        if (guild) {
            Logger.debug('GuildMainView', `联盟: ${guild.name} Lv.${guild.level} (${guild.memberCount}/${guild.maxMembers})`);
        } else {
            Logger.debug('GuildMainView', '未加入联盟');
        }
        // TODO: 更新 FairyGUI 组件
    }

    private _refreshMembers(): void {
        const members = this._controller.model.members;
        Logger.debug('GuildMainView', `成员数: ${members.length}`);
        // TODO: 更新成员列表 UI
    }
}
