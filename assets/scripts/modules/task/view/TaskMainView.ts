// 文件路径：assets/scripts/modules/task/view/TaskMainView.ts
// 依赖：core/base/BaseView.ts, task/controller/TaskController.ts

import { BaseView } from 'db://assets/scripts/core/base/BaseView';
import { TaskController } from 'db://assets/scripts/modules/task/controller/TaskController';
import { TaskEvent } from 'db://assets/scripts/core/constants/EventTypes';
import { Logger } from 'db://assets/scripts/core/utils/Logger';
import { TaskType } from 'db://assets/scripts/modules/task/model/TaskModel';

/**
 * 任务主界面
 * TODO: FairyGUI 集成后绑定实际 UI
 */
export class TaskMainView extends BaseView {
    private _controller: TaskController;

    constructor() {
        super('ui/task/TaskMainView');
        this._controller = new TaskController();
    }

    protected override onCreate(): void {
        this._controller.init();
        this.listenEvent(TaskEvent.ProgressUpdated, this._refresh.bind(this));
        this.listenEvent(TaskEvent.RewardClaimed, this._refresh.bind(this));
    }

    protected override onShow(): void {
        this._refresh();
    }

    protected override onDestroy(): void {
        this._controller.destroy();
    }

    async onClaimClick(taskId: number): Promise<void> {
        await this._controller.claimReward(taskId);
    }

    private _refresh(): void {
        const daily = this._controller.model.getByType(TaskType.DAILY);
        const claimable = this._controller.model.getClaimable();
        Logger.debug('TaskMainView', `每日任务: ${daily.length}, 可领取: ${claimable.length}`);
        // TODO: 更新 FairyGUI 组件
    }
}
