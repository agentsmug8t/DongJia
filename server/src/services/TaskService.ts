import { Task, ITask } from '../models/Task';
import { playerService } from './PlayerService';

export class TaskService {
    /** 获取玩家任务列表 */
    async getTaskList(playerId: string): Promise<Record<string, unknown>[]> {
        return Task.find({ playerId, status: { $ne: 3 } }).lean(); // 排除已领取的
    }

    /** 领取任务奖励 */
    async claimReward(playerId: string, taskId: number): Promise<{
        success: boolean;
        reward?: { copper?: number; silver?: number; prestige?: number; exp?: number };
    }> {
        const task = await Task.findOne({ taskId, playerId, status: 2 }); // claimable
        if (!task) return { success: false };

        task.status = 3; // claimed
        await task.save();

        // 发放奖励
        if (task.reward.copper) await playerService.addCopper(playerId, task.reward.copper);
        if (task.reward.exp) await playerService.addExp(playerId, task.reward.exp);

        return { success: true, reward: task.reward };
    }

    /** 更新任务进度 */
    async updateProgress(playerId: string, taskId: number, progress: number): Promise<boolean> {
        const task = await Task.findOne({ taskId, playerId, status: 1 });
        if (!task) return false;

        task.progress = progress;
        if (progress >= task.target) {
            task.status = 2; // claimable
        }
        await task.save();
        return true;
    }

    /** 初始化每日任务（每日重置时调用） */
    async initDailyTasks(playerId: string): Promise<void> {
        // 清除旧的每日任务
        await Task.deleteMany({ playerId, type: 'daily' });

        // 创建新的每日任务
        const dailyTasks = [
            { configId: 1, name: '完成3笔订单', desc: '今日完成3笔订单', target: 3, reward: { copper: 200, exp: 50 } },
            { configId: 2, name: '赚取500铜钱', desc: '今日累计赚取500铜钱', target: 500, reward: { copper: 100, exp: 30 } },
            { configId: 3, name: '登录游戏', desc: '今日登录游戏', target: 1, reward: { copper: 50, exp: 10 } },
        ];

        let taskId = Date.now();
        for (const t of dailyTasks) {
            await Task.create({
                taskId: taskId++,
                playerId,
                configId: t.configId,
                name: t.name,
                desc: t.desc,
                type: 'daily',
                status: 1,
                progress: 0,
                target: t.target,
                reward: t.reward,
            });
        }
    }
}

export const taskService = new TaskService();
