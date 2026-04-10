// 文件路径：assets/scripts/modules/shop/model/ShopModel.ts
// 依赖：core/utils/Singleton.ts, core/manager/EventManager.ts, core/constants/EventTypes.ts, core/utils/Logger.ts

import { Singleton } from 'db://assets/scripts/core/utils/Singleton';
import { EventManager } from 'db://assets/scripts/core/manager/EventManager';
import { ShopEvent } from 'db://assets/scripts/core/constants/EventTypes';
import { Logger } from 'db://assets/scripts/core/utils/Logger';

/** 当前进行中订单 */
export interface CurrentOrder {
    orderId: number;
    name: string;
    duration: number;       // 生产总耗时（秒）
    rewardCopper: number;   // 铜钱奖励
    startAt: number;        // 开始时间戳（秒）
}

/**
 * 商铺数据模型（全局单例）
 * 存储当前订单状态，提供进度计算方法
 *
 * @example
 * const shop = ShopModel.getInstance();
 * shop.setCurrentOrder({ orderId: 1, name: '红烧肉', duration: 60, rewardCopper: 150, startAt: 1700000000 });
 * console.log(shop.getProgress());      // 0.0 ~ 1.0
 * console.log(shop.getRemainingTime()); // 剩余秒数
 */
export class ShopModel extends Singleton<ShopModel>() {
    private _currentOrder: CurrentOrder | null = null;
    private _eventManager: EventManager = EventManager.getInstance();

    protected init(): void {
        Logger.info('ShopModel', '初始化完成');
    }

    /** 获取当前订单（只读） */
    get currentOrder(): CurrentOrder | null {
        return this._currentOrder;
    }

    /** 是否有进行中订单 */
    get hasActiveOrder(): boolean {
        return this._currentOrder !== null;
    }

    /**
     * 设置当前订单（接单成功后调用）
     * @param order - 服务器返回的订单信息
     */
    setCurrentOrder(order: CurrentOrder): void {
        this._currentOrder = { ...order };
        Logger.info('ShopModel', `设置当前订单: ${order.name} (${order.duration}s)`);
        this._eventManager.emit(ShopEvent.OrderTaken, order);
    }

    /**
     * 清除当前订单（交付成功后调用）
     */
    clearCurrentOrder(): void {
        const old = this._currentOrder;
        this._currentOrder = null;
        if (old) {
            Logger.info('ShopModel', `清除当前订单: ${old.name}`);
            this._eventManager.emit(ShopEvent.OrderCompleted, old);
        }
    }

    /**
     * 获取当前订单
     * @returns 当前订单信息，无则返回 null
     */
    getCurrentOrder(): CurrentOrder | null {
        return this._currentOrder;
    }

    /**
     * 获取剩余生产时间（秒）
     * @returns 剩余秒数，无订单返回 0
     */
    getRemainingTime(): number {
        if (!this._currentOrder) return 0;
        const now = Math.floor(Date.now() / 1000);
        const elapsed = now - this._currentOrder.startAt;
        return Math.max(0, this._currentOrder.duration - elapsed);
    }

    /**
     * 获取生产进度 (0.0 ~ 1.0)
     * @returns 进度比例，无订单返回 0
     */
    getProgress(): number {
        if (!this._currentOrder) return 0;
        const now = Math.floor(Date.now() / 1000);
        const elapsed = now - this._currentOrder.startAt;
        return Math.min(1, elapsed / this._currentOrder.duration);
    }

    /**
     * 判断生产是否完成
     * @returns true 表示可以交付
     */
    isProductionComplete(): boolean {
        return this._currentOrder !== null && this.getRemainingTime() <= 0;
    }
}
