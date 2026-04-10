// 文件路径：assets/scripts/modules/task/model/TaskModel.ts
// 依赖：core/base/BaseModel.ts, core/constants/EventTypes.ts

import { BaseModel } from 'db://assets/scripts/core/base/BaseModel';
import { TaskEvent } from 'db://assets/scripts/core/constants/EventTypes';

/** 任务状态 */
export enum TaskStatus {
    LOCKED = 0,       // 未解锁
    IN_PROGRESS = 1,  // 进行中
    CLAIMABLE = 2,    // 可领取
    CLAIMED = 3,      // 已领取
}

/** 任务类型 */
export enum TaskType {
    DAILY = 'daily',
    WEEKLY = 'weekly',
    MAIN = 'main',
    ACHIEVEMENT = 'achievement',
}

/** 任务信息 */
export interface TaskInfo {
    taskId: number;
    configId: number;
    name: string;
    desc: string;
    type: TaskType;
    status: TaskStatus;
    progress: number;
    target: number;
    reward: RewardInfo;
}

/**
 * 任务数据模型
 */
export class TaskModel extends BaseModel {
    private _tasks: TaskInfo[] = [];

    get tasks(): ReadonlyArray<TaskInfo> { return this._tasks; }

    initFromServer(tasks: TaskInfo[]): void {
        this._tasks = tasks;
    }

    getByType(type: TaskType): TaskInfo[] {
        return this._tasks.filter((t) => t.type === type);
    }

    getClaimable(): TaskInfo[] {
        return this._tasks.filter((t) => t.status === TaskStatus.CLAIMABLE);
    }

    updateProgress(taskId: number, progress: number): void {
        const task = this._tasks.find((t) => t.taskId === taskId);
        if (!task) return;
        task.progress = progress;
        if (progress >= task.target && task.status === TaskStatus.IN_PROGRESS) {
            task.status = TaskStatus.CLAIMABLE;
        }
        this.notify(TaskEvent.ProgressUpdated, task);
    }

    claimTask(taskId: number): void {
        const task = this._tasks.find((t) => t.taskId === taskId);
        if (task) {
            task.status = TaskStatus.CLAIMED;
            this.notify(TaskEvent.RewardClaimed, task);
        }
    }

    override reset(): void {
        this._tasks = [];
    }
}
