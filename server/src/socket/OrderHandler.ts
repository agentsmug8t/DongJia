// 文件路径：server/src/socket/orderHandler.ts
// 依赖：server/src/services/orderService.ts, server/src/utils/response.ts, server/src/utils/logger.ts

import { Socket } from 'socket.io';
import { orderService } from '../services/orderService';
import { success, fail, ErrorCode } from '../utils/response';
import { logger } from '../utils/logger';

/**
 * 订单事件处理器
 * 注册 'order:take' 和 'order:deliver' Socket 事件
 * 实现"接单-生产-交付"单订单流程
 */
export function registerOrderHandler(socket: Socket): void {

    /**
     * 接单事件
     * 客户端发送 orderId，服务器校验后开始生产
     */
    socket.on('order:take', async (data: { orderId: number }, ack) => {
        try {
            const playerId = socket.data.playerId as string;
            if (!playerId) {
                if (typeof ack === 'function') ack(fail(ErrorCode.NotLoggedIn, '请先登录'));
                return;
            }

            const { orderId } = data;
            if (typeof orderId !== 'number') {
                if (typeof ack === 'function') ack(fail(ErrorCode.InvalidParams, '参数错误：缺少 orderId'));
                return;
            }

            logger.info(`[OrderHandler] 玩家 ${playerId} 请求接单: orderId=${orderId}`);
            const result = await orderService.takeOrder(playerId, orderId);

            if (!result.success) {
                if (typeof ack === 'function') ack(fail(ErrorCode.OrderAlreadyTaken, result.message ?? '接单失败'));
                return;
            }

            if (typeof ack === 'function') {
                ack(success({
                    success: true,
                    order: result.order,
                }));
            }

            logger.info(`[OrderHandler] 接单成功: ${playerId} → ${result.order!.name}`);
        } catch (err) {
            logger.error('[OrderHandler] order:take 异常', err);
            if (typeof ack === 'function') ack(fail(ErrorCode.Unknown, '服务器错误'));
        }
    });

    /**
     * 交付事件
     * 客户端发送交付请求，服务器校验生产时间后发放奖励
     */
    socket.on('order:deliver', async (_data: unknown, ack) => {
        try {
            const playerId = socket.data.playerId as string;
            if (!playerId) {
                if (typeof ack === 'function') ack(fail(ErrorCode.NotLoggedIn, '请先登录'));
                return;
            }

            logger.info(`[OrderHandler] 玩家 ${playerId} 请求交付`);
            const result = await orderService.deliverOrder(playerId);

            if (!result.success) {
                if (typeof ack === 'function') ack(fail(ErrorCode.OrderNotFound, result.message ?? '交付失败'));
                return;
            }

            if (typeof ack === 'function') {
                ack(success({
                    success: true,
                    reward: result.reward,
                }));
            }

            logger.info(`[OrderHandler] 交付成功: ${playerId}, 奖励 ${result.reward!.copper} 铜钱`);
        } catch (err) {
            logger.error('[OrderHandler] order:deliver 异常', err);
            if (typeof ack === 'function') ack(fail(ErrorCode.Unknown, '服务器错误'));
        }
    });
}
