// 文件路径：assets/scripts/modules/activity/controller/ActivityController.ts
// 依赖：core/base/BaseController.ts, activity/model/ActivityModel.ts, activity/service/ActivityService.ts

import { BaseController } from 'db://assets/scripts/core/base/BaseController';
import { ActivityModel } from 'db://assets/scripts/modules/activity/model/ActivityModel';
import { ActivityService } from 'db://assets/scripts/modules/activity/service/ActivityService';
import { Toast } from 'db://assets/scripts/core/ui/Toast';
import { PlayerModel } from 'db://assets/scripts/modules/player/model/PlayerModel';
import { Logger } from 'db://assets/scripts/core/utils/Logger';

/**
 * 活动控制器
 */
export class ActivityController extends BaseController {
    private _model: ActivityModel = new ActivityModel();
    private _service: ActivityService = new ActivityService();

    get model(): ActivityModel { return this._model; }

    protected onInit(): void {
        this.loadActivities();
    }

    async loadActivities(): Promise<void> {
        try {
            const activities = await this._service.getActivityList();
            this._model.initFromServer(activities);
        } catch (err) {
            Logger.error(this.TAG, '加载活动列表失败', err);
        }
    }

    async claimReward(activityId: number): Promise<boolean> {
        try {
            const res = await this._service.claimActivityReward(activityId);
            if (res.success) {
                if (res.reward.copper) PlayerModel.getInstance().addCopper(res.reward.copper);
                if (res.reward.silver) PlayerModel.getInstance().addSilver(res.reward.silver);
                Toast.success('活动奖励已领取！');
                return true;
            }
        } catch (err) {
            Logger.error(this.TAG, '领取活动奖励失败', err);
            Toast.error('领取失败');
        }
        return false;
    }

    protected override onDestroy(): void {
        this._model.reset();
    }
}
