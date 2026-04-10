// 文件路径：assets/scripts/modules/player/view/PlayerInfoView.ts
// 依赖：core/base/BaseView.ts, modules/player/model/PlayerModel.ts

import { BaseView } from 'db://assets/scripts/core/base/BaseView';
import { PlayerModel } from 'db://assets/scripts/modules/player/model/PlayerModel';
import { PlayerEvent } from 'db://assets/scripts/core/constants/EventTypes';
import { Utils } from 'db://assets/scripts/core/utils/Utils';
import { Logger } from 'db://assets/scripts/core/utils/Logger';

/**
 * 玩家信息界面
 * TODO: FairyGUI 集成后绑定实际 UI
 */
export class PlayerInfoView extends BaseView {
    constructor() {
        super('ui/player/PlayerInfoView');
    }

    protected override onCreate(): void {
        this.listenEvent(PlayerEvent.DataUpdated, this._refresh.bind(this));
        this.listenEvent(PlayerEvent.CopperChanged, this._refreshCurrency.bind(this));
        this.listenEvent(PlayerEvent.SilverChanged, this._refreshCurrency.bind(this));
        this.listenEvent(PlayerEvent.LevelUp, this._onLevelUp.bind(this));
    }

    protected override onShow(): void {
        this._refresh();
    }

    private _refresh(): void {
        const player = PlayerModel.getInstance();
        Logger.debug('PlayerInfoView', `${player.nickname} Lv.${player.level} 铜钱:${Utils.formatNumber(player.copper)} 银两:${Utils.formatNumber(player.silver)}`);
        // TODO: 更新 FairyGUI 组件
    }

    private _refreshCurrency(): void {
        const player = PlayerModel.getInstance();
        Logger.debug('PlayerInfoView', `铜钱:${Utils.formatNumber(player.copper)} 银两:${Utils.formatNumber(player.silver)}`);
        // TODO: 更新货币显示
    }

    private _onLevelUp(newLevel: unknown): void {
        Logger.debug('PlayerInfoView', `升级到 Lv.${newLevel}`);
        // TODO: 播放升级特效
    }
}
