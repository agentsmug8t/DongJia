// 文件路径：server/src/services/orderService.ts
// 依赖：server/src/services/PlayerService.ts, server/src/config/order.json

import * as path from 'path';
import * as fs from 'fs';
import { playerService } from './PlayerService';
import { logger } from '../utils/logger';

/** 订单配置（对应 order.json） */
interface OrderConfig {
    orderId: number;
    name: string;
    duration: number;       // 生产耗时（秒）
    rewardCopper: number;   // 铜钱奖励
}

/** 玩家当前进行中订单 */
interface ActiveOrder {
    orderId: number;
    name: string;
    duration: number;
    rewardCopper: number;
    startAt: number;        // 开始时间戳（秒）
}

/** 接单结果 */
interface TakeOrderResult {
    success: boolean;
    message?: string;
    order?: {
        orderId: number;
        name: string;
        duration: number;
        rewardCopper: number;
        startAt: number;
    };
}

/** 交付结果 */
interface DeliverOrderResult {
    success: boolean;
    message?: string;
    reward?: { copper: number };
}

/**
 * 订单服务
 * 管理"接单-生产-交付"完整流程，每个玩家同时只能有一个进行中订单
 */
class OrderService {
    /** 订单配置列表（从 order.json 加载） */
    private _configs: OrderConfig[] = [];

    /** 玩家进行中订单（内存存储，playerId → ActiveOrder） */
    private _activeOrders: Map<string, ActiveOrder> = new Map();

    constructor() {
        this._loadConfigs();
    }

    /**
     * 加载订单配置
     */
    private _loadConfigs(): void {
        try {
            const configPath = path.resolve(__dirname, '../config/order.json');
            const raw = fs.readFileSync(configPath, 'utf-8');
            this._configs = JSON.parse(raw) as OrderConfig[];
            logger.info(`[OrderService] 已加载 ${this._configs.length} 个订单配置`);
        } catch (err) {
            logger.error('[OrderService] 加载订单配置失败', err);
            this._configs = [];
        }
    }

    /**
     * 获取所有订单配置
     * @returns 订单配置数组的拷贝
     */
    getOrderConfigs(): OrderConfig[] {
        return [...this._configs];
    }

    /**
     * 接取订单
     * 校验玩家无进行中订单后，记录开始时间并返回订单信息
     *
     * @param playerId - 玩家ID
     * @param orderId - 要接取的订单配置ID
     * @returns 接单结果
     */
    async takeOrder(playerId: string, orderId: number): Promise<TakeOrderResult> {
        // 校验：玩家不能有进行中订单
        if (this._activeOrders.has(playerId)) {
            logger.warn(`[OrderService] 玩家 ${playerId} 已有进行中订单，拒绝接单`);
            return { success: false, message: '已有进行中的订单，请先完成交付' };
        }

        // 校验：订单配置是否存在
        const config = this._configs.find(c => c.orderId === orderId);
        if (!config) {
            logger.warn(`[OrderService] 订单 ${orderId} 不存在`);
            return { success: false, message: '订单不存在' };
        }

        // 记录开始时间
        const startAt = Math.floor(Date.now() / 1000);
        const activeOrder: ActiveOrder = {
            orderId: config.orderId,
            name: config.name,
            duration: config.duration,
            rewardCopper: config.rewardCopper,
            startAt,
        };
        this._activeOrders.set(playerId, activeOrder);

        logger.info(`[OrderService] 玩家 ${playerId} 接单成功: ${config.name} (耗时 ${config.duration}s, 奖励 ${config.rewardCopper} 铜钱)`);

        return {
            success: true,
            order: { ...activeOrder },
        };
    }

    /**
     * 交付订单
     * 校验生产是否完成（后端时间校验防作弊），发放铜钱奖励并清空当前订单
     *
     * @param playerId - 玩家ID
     * @returns 交付结果
     */
    async deliverOrder(playerId: string): Promise<DeliverOrderResult> {
        // 校验：是否有进行中订单
        const active = this._activeOrders.get(playerId);
        if (!active) {
            logger.warn(`[OrderService] 玩家 ${playerId} 没有进行中的订单`);
            return { success: false, message: '没有进行中的订单' };
        }

        // 后端时间校验：防止前端伪造完成
        const now = Math.floor(Date.now() / 1000);
        const elapsed = now - active.startAt;
        if (elapsed < active.duration) {
            const remaining = active.duration - elapsed;
            logger.warn(`[OrderService] 玩家 ${playerId} 交付过早，还需 ${remaining}s`);
            return {
                success: false,
                message: `生产未完成，还需 ${remaining} 秒`,
            };
        }

        // 清除进行中订单
        this._activeOrders.delete(playerId);

        // 发放铜钱奖励
        await playerService.addCopper(playerId, active.rewardCopper);

        logger.info(`[OrderService] 玩家 ${playerId} 交付成功: ${active.name}, 获得 ${active.rewardCopper} 铜钱`);

        return {
            success: true,
            reward: { copper: active.rewardCopper },
        };
    }

    /**
     * 获取玩家当前进行中订单
     *
     * @param playerId - 玩家ID
     * @returns 当前订单，无则返回 null
     */
    getActiveOrder(playerId: string): ActiveOrder | null {
        return this._activeOrders.get(playerId) ?? null;
    }
}

export const orderService = new OrderService();
