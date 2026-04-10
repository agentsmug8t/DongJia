// 文件路径：assets/scripts/modules/shop/service/ShopService.ts
// 依赖：core/manager/NetworkManager.ts, core/network/Protocol.ts, core/utils/Logger.ts

import { NetworkManager } from 'db://assets/scripts/core/manager/NetworkManager';
import {
    SocketEvent,
    TakeOrderRequest,
    TakeOrderResponse,
    ShopUpgradeRequest,
    ShopUpgradeResponse,
    HireWorkerRequest,
    HireWorkerResponse,
} from 'db://assets/scripts/core/network/Protocol';
import { Logger } from 'db://assets/scripts/core/utils/Logger';

/**
 * 商铺业务服务层
 * 封装商铺相关的网络请求，供 Controller 调用
 */
export class ShopService {
    private _network: NetworkManager = NetworkManager.getInstance();

    /**
     * 接取订单
     */
    async takeOrder(orderId: number, shopId: string): Promise<TakeOrderResponse> {
        const request: TakeOrderRequest = { orderId, shopId };
        Logger.debug('ShopService', `接取订单: ${orderId}`);
        return this._network.request<TakeOrderResponse>(SocketEvent.TAKE_ORDER, request);
    }

    /**
     * 取消订单
     */
    async cancelOrder(orderId: number): Promise<{ success: boolean }> {
        return this._network.request(SocketEvent.CANCEL_ORDER, { orderId });
    }

    /**
     * 获取商铺信息
     */
    async getShopInfo(shopId: string): Promise<unknown> {
        return this._network.request(SocketEvent.SHOP_INFO, { shopId });
    }

    /**
     * 升级商铺
     */
    async upgradeShop(shopId: string): Promise<ShopUpgradeResponse> {
        const request: ShopUpgradeRequest = { shopId };
        return this._network.request<ShopUpgradeResponse>(SocketEvent.SHOP_UPGRADE, request);
    }

    /**
     * 雇佣伙夫
     */
    async hireWorker(workerId: string): Promise<HireWorkerResponse> {
        const request: HireWorkerRequest = { workerId };
        return this._network.request<HireWorkerResponse>(SocketEvent.HIRE_WORKER, request);
    }

    /**
     * 监听订单完成推送
     */
    onOrderCompleted(callback: (...args: unknown[]) => void): void {
        this._network.on(SocketEvent.ORDER_COMPLETED, callback);
    }

    /**
     * 监听订单过期推送
     */
    onOrderExpired(callback: (...args: unknown[]) => void): void {
        this._network.on(SocketEvent.ORDER_EXPIRED, callback);
    }
}
