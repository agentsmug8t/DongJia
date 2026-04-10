// 文件路径：assets/scripts/modules/activity/model/ActivityModel.ts
// 依赖：core/base/BaseModel.ts

import { BaseModel } from 'db://assets/scripts/core/base/BaseModel';

/** 活动状态 */
export enum ActivityStatus {
    NOT_STARTED = 0,
    ACTIVE = 1,
    ENDED = 2,
}

/** 活动信息 */
export interface ActivityInfo {
    activityId: number;
    name: string;
    desc: string;
    type: string;
    status: ActivityStatus;
    startAt: number;
    endAt: number;
    rewards: RewardInfo[];
}

/**
 * 活动数据模型
 */
export class ActivityModel extends BaseModel {
    private _activities: ActivityInfo[] = [];

    get activities(): ReadonlyArray<ActivityInfo> { return this._activities; }

    initFromServer(activities: ActivityInfo[]): void {
        this._activities = activities;
    }

    getActive(): ActivityInfo[] {
        return this._activities.filter((a) => a.status === ActivityStatus.ACTIVE);
    }

    getById(activityId: number): ActivityInfo | null {
        return this._activities.find((a) => a.activityId === activityId) ?? null;
    }

    override reset(): void {
        this._activities = [];
    }
}
