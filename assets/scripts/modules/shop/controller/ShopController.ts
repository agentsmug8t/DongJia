// 文件路径：assets/scripts/modules/shop/controller/ShopController.ts
// 依赖：core/base/BaseController.ts, shop/model/ShopModel.ts, shop/model/OrderModel.ts,
//        shop/service/ShopService.ts, core/ui/Toast.ts, modules/player/model/PlayerModel.ts

import { BaseController } from 'db://assets/scripts/core/base/BaseController';
import { ShopModel } from 'db://assets/scripts/modules/shop/model/ShopModel';
import { OrderModel } from 'db://assets/scripts/modules/shop/model/OrderModel';
import { ShopService } from 'db://assets/scripts/modules/shop/service/ShopService';
import { Toast } from 'db://assets/scripts/core/ui/Toast';
import { PlayerModel } from 'db://assets/scripts/modules/player/model/PlayerModel';
import { ShopEvent } from 'db://assets/scripts/core/constants/EventTypes';
import { Logger } from 'db://assets/scripts/core/utils/Logger';
import { OrderCompletedPush, OrderExpiredPush } from 'db://assets/scripts/core/network/Protocol';

/**
 * 商铺控制器
 * 协调 ShopModel / OrderModel 和 ShopService，处理商铺业务逻辑
 */
export class ShopController extends BaseController {
    private _shopModel: ShopModel = new ShopModel();
    private _orderModel: OrderModel = new OrderModel();
    private _service: ShopService = new ShopService();

    get shopModel(): ShopModel { return this._shopModel; }
    get orderModel(): OrderModel { return this._orderModel; }

    protected onInit(): void {
        // 监听服务器推送
        this._service.onOrderCompleted(this._onOrderCompleted.bind(this));
        this._service.onOrderExpired(this._onOrderExpired.bind(this));

        // 监听 UI 事件
        this.on(ShopEvent.OrderTaken, this._onOrderTakenEvent.bind(this));
    }

    /**
     * 接取订单
     */
    async takeOrder(orderId: number): Promise<boolean> {
        if (!this._shopModel.canTakeOrder) {
            Toast.warning('订单队列已满');
            return false;
        }

        try {
            const response = await this._service.takeOrder(orderId, this._shopModel.shopId);
            if (response.success) {
                this._shopModel.addOrder(response.order);
                this._orderModel.removeAvailable(orderId);

                // 发放奖励
                if (response.reward.copper) {
                    PlayerModel.getInstance().addCopper(response.reward.copper);
                }
                if (response.reward.exp) {
                    // TODO: 经验处理
                }

                Toast.success('接单成功！');
                return true;
            }
        } catch (err) {
            Logger.error(this.TAG, '接单失败', err);
            Toast.error('接单失败，请重试');
        }
        return false;
    }

    /**
     * 升级商铺
     */
    async upgradeShop(): Promise<boolean> {
        try {
            const response = await this._service.upgradeShop(this._shopModel.shopId);
            if (response.success) {
                this._shopModel.upgrade(response.newLevel, response.newLevel + 2, response.newLevel * 5);
                Toast.success(`商铺升级到 ${response.newLevel} 级！`);
                return true;
            }
        } catch (err) {
            Logger.error(this.TAG, '升级失败', err);
            Toast.error('升级失败');
        }
        return false;
    }

    /**
     * 加载商铺数据
     */
    async loadShopData(shopId: string): Promise<void> {
        try {
            const data = await this._service.getShopInfo(shopId) as {
                shop: { shopId: string; name: string; level: number; maxWorkers: number; maxOrders: number };
                workers: WorkerInfo[];
                orders: OrderInfo[];
            };
            this._shopModel.initFromServer(data.shop, data.workers, data.orders);
        } catch (err) {
            Logger.error(this.TAG, '加载商铺数据失败', err);
        }
    }

    // ─── 服务器推送处理 ───────────────────────────────────────

    private _onOrderCompleted(data: unknown): void {
        const push = data as OrderCompletedPush;
        const order = this._shopModel.completeOrder(push.orderId);
        if (order) {
            Toast.success(`订单完成！获得铜钱 ${push.reward.copper ?? 0}`);
            if (push.reward.copper) {
                PlayerModel.getInstance().addCopper(push.reward.copper);
            }
        }
    }

    private _onOrderExpired(data: unknown): void {
        const push = data as OrderExpiredPush;
        this._shopModel.removeOrder(push.orderId);
        this._orderModel.removeAvailable(push.orderId);
        Toast.warning('订单已过期');
    }

    private _onOrderTakenEvent(..._args: unknown[]): void {
        // 其他模块通知商铺有新订单被接取时的处理
        Logger.debug(this.TAG, '收到接单事件');
    }

    protected override onDestroy(): void {
        this._shopModel.reset();
        this._orderModel.reset();
    }
}
