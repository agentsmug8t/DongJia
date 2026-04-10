// 文件路径：assets/scripts/modules/activity/view/ActivityMainView.ts
// 依赖：core/base/BaseView.ts, activity/controller/ActivityController.ts

import { BaseView } from 'db://assets/scripts/core/base/BaseView';
import { ActivityController } from 'db://assets/scripts/modules/activity/controller/ActivityController';
import { Logger } from 'db://assets/scripts/core/utils/Logger';

/**
 * 活动主界面
 * TODO: FairyGUI 集成后绑定实际 UI
 */
export class ActivityMainView extends BaseView {
    private _controller: ActivityController;

    constructor() {
        super('ui/activity/ActivityMainView');
        this._controller = new ActivityController();
    }

    protected override onCreate(): void {
        this._controller.init();
    }

    protected override onShow(): void {
        const active = this._controller.model.getActive();
        Logger.debug('ActivityMainView', `进行中的活动: ${active.length}`);
        // TODO: 更新 FairyGUI 组件
    }

    protected override onDestroy(): void {
        this._controller.destroy();
    }

    async onClaimClick(activityId: number): Promise<void> {
        await this._controller.claimReward(activityId);
    }
}
