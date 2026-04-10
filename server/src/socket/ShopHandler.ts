import { Socket } from 'socket.io';
import { shopService } from '../services/ShopService';
import { success, fail, ErrorCode } from '../utils/response';
import { logger } from '../utils/logger';

/**
 * 商铺事件处理器
 * 对应客户端 SocketEvent: SHOP_INFO, SHOP_UPGRADE, HIRE_WORKER, FIRE_WORKER
 */
export function registerShopHandler(socket: Socket): void {
    socket.on('shop:info', async (data: { shopId: string }, ack) => {
        try {
            const result = await shopService.getShopInfo(data.shopId);
            if (!result) {
                if (typeof ack === 'function') ack(fail(ErrorCode.NotFound, '商铺不存在'));
                return;
            }
            // 同时获取进行中的订单
            const { orderService } = await import('../services/OrderService');
            const orders = await orderService.getActiveOrders(data.shopId);
            if (typeof ack === 'function') {
                ack(success({ ...result, orders }));
            }
        } catch (err) {
            logger.error('[ShopHandler] shop:info 失败', err);
            if (typeof ack === 'function') ack(fail(ErrorCode.Unknown, '获取商铺信息失败'));
        }
    });

    socket.on('shop:upgrade', async (data: { shopId: string }, ack) => {
        try {
            const result = await shopService.upgradeShop(data.shopId);
            if (typeof ack === 'function') ack(success(result));
        } catch (err) {
            logger.error('[ShopHandler] shop:upgrade 失败', err);
            if (typeof ack === 'function') ack(fail(ErrorCode.Unknown, '升级失败'));
        }
    });

    socket.on('worker:hire', async (data: { workerId: string }, ack) => {
        try {
            const playerId = socket.data.playerId as string;
            // 通过 playerId 查找 shopId（简化：假设 shopId = shop_{playerId}）
            const shopId = `shop_${playerId}`;
            const result = await shopService.hireWorker(shopId, data.workerId);
            if (!result.success) {
                if (typeof ack === 'function') ack(fail(ErrorCode.WorkerSlotFull, '伙夫名额已满'));
                return;
            }
            if (typeof ack === 'function') ack(success(result));
        } catch (err) {
            logger.error('[ShopHandler] worker:hire 失败', err);
            if (typeof ack === 'function') ack(fail(ErrorCode.Unknown, '雇佣失败'));
        }
    });

    socket.on('worker:fire', async (data: { workerId: string }, ack) => {
        try {
            const playerId = socket.data.playerId as string;
            const shopId = `shop_${playerId}`;
            const ok = await shopService.fireWorker(shopId, data.workerId);
            if (typeof ack === 'function') ack(success({ success: ok }));
        } catch (err) {
            logger.error('[ShopHandler] worker:fire 失败', err);
            if (typeof ack === 'function') ack(fail(ErrorCode.Unknown, '解雇失败'));
        }
    });
}
