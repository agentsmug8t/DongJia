// 文件路径：assets/scripts/modules/task/service/TaskService.ts
// 依赖：core/manager/NetworkManager.ts, core/network/Protocol.ts

import { NetworkManager } from 'db://assets/scripts/core/manager/NetworkManager';
import { SocketEvent, TaskClaimRequest, TaskClaimResponse } from 'db://assets/scripts/core/network/Protocol';
import { TaskInfo } from 'db://assets/scripts/modules/task/model/TaskModel';

/**
 * 任务业务服务层
 */
export class TaskService {
    private _network: NetworkManager = NetworkManager.getInstance();

    async getTaskList(): Promise<TaskInfo[]> {
        return this._network.request(SocketEvent.TASK_LIST, {});
    }

    async claimReward(taskId: number): Promise<TaskClaimResponse> {
        const request: TaskClaimRequest = { taskId };
        return this._network.request<TaskClaimResponse>(SocketEvent.TASK_CLAIM, request);
    }
}
