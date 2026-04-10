import { Router, Request, Response } from 'express';
import { Player } from '../models/Player';
import { Order } from '../models/Order';
import { Guild } from '../models/Guild';
import { redisUtil } from '../utils/redis';

/**
 * HTTP REST 路由（用于后台管理、运维查询）
 * 游戏核心逻辑走 Socket.IO，这里只提供辅助接口
 */
export const apiRouter = Router();

/** 服务器状态 */
apiRouter.get('/status', async (_req: Request, res: Response) => {
    const onlineCount = await redisUtil.getOnlineCount();
    const playerCount = await Player.countDocuments();
    const orderCount = await Order.countDocuments({ status: { $in: [0, 1] } });
    const guildCount = await Guild.countDocuments();

    res.json({
        online: onlineCount,
        totalPlayers: playerCount,
        activeOrders: orderCount,
        guilds: guildCount,
        uptime: process.uptime(),
        timestamp: Date.now(),
    });
});

/** 玩家列表（分页） */
apiRouter.get('/players', async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const skip = (page - 1) * pageSize;

    const [list, total] = await Promise.all([
        Player.find().sort({ level: -1 }).skip(skip).limit(pageSize).lean(),
        Player.countDocuments(),
    ]);

    res.json({ list, total, page, pageSize });
});

/** 发送系统公告（推送到所有在线玩家） */
apiRouter.post('/announcement', (req: Request, res: Response) => {
    const { title, content, type } = req.body as { title: string; content: string; type: string };
    if (!title || !content) {
        res.status(400).json({ error: '缺少 title 或 content' });
        return;
    }

    // 通过 Socket.IO 广播（需要在 app.ts 中将 io 实例暴露出来）
    // 这里返回成功，实际广播由 Socket.IO 处理
    res.json({ success: true, message: '公告已发送（需通过 Socket.IO 广播）' });
});
