// 文件路径：assets/scripts/modules/guild/controller/GuildController.ts
// 依赖：core/base/BaseController.ts, guild/model/GuildModel.ts, guild/service/GuildService.ts

import { BaseController } from 'db://assets/scripts/core/base/BaseController';
import { GuildModel } from 'db://assets/scripts/modules/guild/model/GuildModel';
import { GuildService } from 'db://assets/scripts/modules/guild/service/GuildService';
import { Toast } from 'db://assets/scripts/core/ui/Toast';
import { Logger } from 'db://assets/scripts/core/utils/Logger';

/**
 * 联盟控制器
 */
export class GuildController extends BaseController {
    private _model: GuildModel = new GuildModel();
    private _service: GuildService = new GuildService();

    get model(): GuildModel { return this._model; }

    protected onInit(): void {
        this._service.onChat(this._onChatMessage.bind(this));
    }

    async loadGuildData(): Promise<void> {
        try {
            const data = await this._service.getGuildInfo();
            this._model.initFromServer(data.guild, data.members);
        } catch (err) {
            Logger.error(this.TAG, '加载联盟数据失败', err);
        }
    }

    async joinGuild(guildId: string): Promise<boolean> {
        try {
            const res = await this._service.joinGuild(guildId);
            if (res.success) {
                Toast.success('加入联盟成功！');
                await this.loadGuildData();
                return true;
            }
        } catch (err) {
            Logger.error(this.TAG, '加入联盟失败', err);
            Toast.error('加入联盟失败');
        }
        return false;
    }

    async leaveGuild(): Promise<boolean> {
        try {
            const res = await this._service.leaveGuild();
            if (res.success) {
                this._model.clearGuild();
                Toast.show('已退出联盟');
                return true;
            }
        } catch (err) {
            Logger.error(this.TAG, '退出联盟失败', err);
        }
        return false;
    }

    private _onChatMessage(..._args: unknown[]): void {
        // TODO: 处理聊天消息
        Logger.debug(this.TAG, '收到联盟聊天消息');
    }

    protected override onDestroy(): void {
        this._model.reset();
    }
}
