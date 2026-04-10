// 文件路径：assets/scripts/modules/shop/model/OrderModel.ts
// 依赖：core/base/BaseModel.ts

import { BaseModel } from 'db://assets/scripts/core/base/BaseModel';

/** 可接订单列表（来自服务器推送） */
export interface AvailableOrder {
    orderId: number;
    configId: number;
    name: string;
    difficulty: number;
    reward: RewardInfo;
    expireAt: number;
}

/**
 * 订单数据模型
 * 管理可接订单列表
 */
export class OrderModel extends BaseModel {
    private _availableOrders: AvailableOrder[] = [];

    get availableOrders(): ReadonlyArray<AvailableOrder> {
        return this._availableOrders;
    }

    /** 刷新可接订单列表 */
    refreshOrders(orders: AvailableOrder[]): void {
        this._availableOrders = orders;
        this.notify('shop:available:orders:updated', orders);
    }

    /** 移除已接取的订单 */
    removeAvailable(orderId: number): void {
        this._availableOrders = this._availableOrders.filter((o) => o.orderId !== orderId);
    }

    /** 清理过期订单 */
    purgeExpired(nowTimestamp: number): number {
        const before = this._availableOrders.length;
        this._availableOrders = this._availableOrders.filter((o) => o.expireAt > nowTimestamp);
        return before - this._availableOrders.length;
    }

    /** 按难度筛选 */
    getByDifficulty(difficulty: number): AvailableOrder[] {
        return this._availableOrders.filter((o) => o.difficulty === difficulty);
    }

    override reset(): void {
        this._availableOrders = [];
    }
}
