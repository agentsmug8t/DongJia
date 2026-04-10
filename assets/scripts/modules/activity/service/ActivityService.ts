// 文件路径：assets/scripts/modules/activity/service/ActivityService.ts
// 依赖：core/manager/NetworkManager.ts

import { NetworkManager } from 'db://assets/scripts/core/manager/NetworkManager';
import { ActivityInfo } from 'db://assets/scripts/modules/activity/model/ActivityModel';

/**
 * 活动业务服务层
 */
export class ActivityService {
    private _network: NetworkManager = NetworkManager.getInstance();

    async getActivityList(): Promise<ActivityInfo[]> {
        return this._network.request('activity:list', {});
    }

    async claimActivityReward(activityId: number): Promise<{ success: boolean; reward: RewardInfo }> {
        return this._network.request('activity:claim', { activityId });
    }
}
