// 文件路径：assets/scripts/modules/task/controller/TaskController.ts
// 依赖：core/base/BaseController.ts, task/model/TaskModel.ts, task/service/TaskService.ts

import { BaseController } from 'db://assets/scripts/core/base/BaseController';
import { TaskModel } from 'db://assets/scripts/modules/task/model/TaskModel';
import { TaskService } from 'db://assets/scripts/modules/task/service/TaskService';
import { Toast } from 'db://assets/scripts/core/ui/Toast';
import { PlayerModel } from 'db://assets/scripts/modules/player/model/PlayerModel';
import { Logger } from 'db://assets/scripts/core/utils/Logger';

/**
 * 任务控制器
 */
export class TaskController extends BaseController {
    private _model: TaskModel = new TaskModel();
    private _service: TaskService = new TaskService();

    get model(): TaskModel { return this._model; }

    protected onInit(): void {
        this.loadTasks();
    }

    async loadTasks(): Promise<void> {
        try {
            const tasks = await this._service.getTaskList();
            this._model.initFromServer(tasks);
        } catch (err) {
            Logger.error(this.TAG, '加载任务列表失败', err);
        }
    }

    async claimReward(taskId: number): Promise<boolean> {
        try {
            const res = await this._service.claimReward(taskId);
            if (res.success) {
                this._model.claimTask(taskId);
                // 发放奖励
                if (res.reward.copper) PlayerModel.getInstance().addCopper(res.reward.copper);
                if (res.reward.silver) PlayerModel.getInstance().addSilver(res.reward.silver);
                if (res.reward.prestige) PlayerModel.getInstance().addPrestige(res.reward.prestige);
                Toast.success('奖励已领取！');
                return true;
            }
        } catch (err) {
            Logger.error(this.TAG, '领取奖励失败', err);
            Toast.error('领取失败');
        }
        return false;
    }

    protected override onDestroy(): void {
        this._model.reset();
    }
}
