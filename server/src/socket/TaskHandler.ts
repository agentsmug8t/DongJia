import { Socket } from 'socket.io';
import { taskService } from '../services/TaskService';
import { success, fail, ErrorCode } from '../utils/response';
import { logger } from '../utils/logger';

/**
 * 任务事件处理器
 * 对应客户端 SocketEvent: TASK_LIST, TASK_CLAIM
 */
export function registerTaskHandler(socket: Socket): void {
    socket.on('task:list', async (_data, ack) => {
        try {
            const playerId = socket.data.playerId as string;
            const tasks = await taskService.getTaskList(playerId);
            if (typeof ack === 'function') ack(success(tasks));
        } catch (err) {
            logger.error('[TaskHandler] task:list 失败', err);
            if (typeof ack === 'function') ack(fail(ErrorCode.Unknown, '获取任务列表失败'));
        }
    });

    socket.on('task:claim', async (data: { taskId: number }, ack) => {
        try {
            const playerId = socket.data.playerId as string;
            const result = await taskService.claimReward(playerId, data.taskId);
            if (!result.success) {
                if (typeof ack === 'function') ack(fail(ErrorCode.NotFound, '任务不可领取'));
                return;
            }
            if (typeof ack === 'function') ack(success(result));
        } catch (err) {
            logger.error('[TaskHandler] task:claim 失败', err);
            if (typeof ack === 'function') ack(fail(ErrorCode.Unknown, '领取失败'));
        }
    });
}
