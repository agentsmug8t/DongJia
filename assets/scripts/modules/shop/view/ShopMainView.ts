// 文件路径：assets/scripts/modules/shop/view/ShopMainView.ts
// 依赖：core/base/BaseView.ts, core/manager/NetworkManager.ts, core/manager/TimerManager.ts,
//        core/utils/Logger.ts, modules/player/model/PlayerModel.ts,
//        modules/shop/model/ShopModel.ts, modules/shop/view/OrderItemView.ts,
//        core/network/Protocol.ts, core/constants/EventTypes.ts

import { BaseView } from 'db://assets/scripts/core/base/BaseView';
import { NetworkManager } from 'db://assets/scripts/core/manager/NetworkManager';
import { TimerManager } from 'db://assets/scripts/core/manager/TimerManager';
import { Logger } from 'db://assets/scripts/core/utils/Logger';
import { Utils } from 'db://assets/scripts/core/utils/Utils';
import { PlayerModel } from 'db://assets/scripts/modules/player/model/PlayerModel';
import { ShopModel, CurrentOrder } from 'db://assets/scripts/modules/shop/model/ShopModel';
import { OrderItemView, OrderItemState, OrderConfigData } from 'db://assets/scripts/modules/shop/view/OrderItemView';
import { SocketEvent, TakeOrderResponse, DeliverOrderResponse } from 'db://assets/scripts/core/network/Protocol';
import { PlayerEvent, ShopEvent } from 'db://assets/scripts/core/constants/EventTypes';

/** 本地订单配置（与 server/src/config/order.json 保持一致） */
const ORDER_CONFIGS: OrderConfigData[] = [
    { orderId: 1, name: '白菜豆腐汤', duration: 30, rewardCopper: 50 },
    { orderId: 2, name: '红烧肉', duration: 60, rewardCopper: 150 },
    { orderId: 3, name: '清蒸鲈鱼', duration: 120, rewardCopper: 300 },
];

/**
 * 商铺主界面
 * 展示铜钱数量、3个可接订单、生产进度条、交付按钮
 *
 * 交互流程：
 *  1. 显示 3 个可接订单（名称、耗时、奖励 + 接单按钮）
 *  2. 点击接单 → 发送 order:take → 进入生产中状态
 *  3. 生产中：进度条每秒更新（本地 TimerManager 计时）
 *  4. 生产完成 → 显示交付按钮
 *  5. 点击交付 → 发送 order:deliver → 服务器校验时间 → 发放奖励
 *  6. 交付成功 → 所有订单恢复可接状态
 */
export class ShopMainView extends BaseView {
    private _network: NetworkManager = NetworkManager.getInstance();
    private _timerManager: TimerManager = TimerManager.getInstance();
    private _shopModel: ShopModel = ShopModel.getInstance();
    private _playerModel: PlayerModel = PlayerModel.getInstance();

    /** 3 个订单子项 */
    private _orderItems: OrderItemView[] = [];

    /** 每秒进度更新定时器 ID */
    private _progressTimerId: number = 0;

    // TODO: FairyGUI 组件引用
    // private _copperLabel: GLabel;
    // private _orderListContainer: GComponent;

    constructor() {
        super('ui/shop/ShopMainView');
    }

    /** @internal 界面创建 */
    protected override onCreate(_params?: unknown): void {
        // 创建 3 个订单子项
        for (const config of ORDER_CONFIGS) {
            const item = new OrderItemView();
            item.setData(config);
            item.onTakeClick = this._onTakeOrder.bind(this);
            item.onDeliverClick = this._onDeliverOrder.bind(this);
            this._orderItems.push(item);
        }

        // 监听铜钱变化
        this.bindData(PlayerEvent.CopperChanged, this._refreshCopper.bind(this));

        // 监听订单状态变化
        this.listenEvent(ShopEvent.OrderTaken, this._onOrderTaken.bind(this));
        this.listenEvent(ShopEvent.OrderCompleted, this._onOrderCompleted.bind(this));

        Logger.info('ShopMainView', '界面创建完成');
    }

    /** @internal 界面显示 */
    protected override onShow(): void {
        this._refreshCopper();
        this._refreshAllOrderItems();

        // 如果有进行中订单，启动进度定时器
        if (this._shopModel.hasActiveOrder) {
            this._startProgressTimer();
        }
    }

    /** @internal 界面隐藏 */
    protected override onHide(): void {
        this._stopProgressTimer();
    }

    /** @internal 界面销毁 */
    protected override onDestroy(): void {
        this._stopProgressTimer();
        this._orderItems = [];
    }

    // ─── 用户交互 ──────────────────────────────────────────────

    /**
     * 接单按钮点击
     * @param orderId - 要接取的订单ID
     */
    private async _onTakeOrder(orderId: number): Promise<void> {
        // 前端预校验
        if (this._shopModel.hasActiveOrder) {
            this.showToast('已有进行中的订单，请先交付');
            return;
        }

        Logger.info('ShopMainView', `发送接单请求: orderId=${orderId}`);

        try {
            const response = await this._network.request<ServerResponse<TakeOrderResponse>>(
                SocketEvent.TAKE_ORDER,
                { orderId }
            );

            const data = response.data;
            if (data.success && data.order) {
                // 更新 Model
                this._shopModel.setCurrentOrder({
                    orderId: data.order.orderId,
                    name: data.order.name,
                    duration: data.order.duration,
                    rewardCopper: data.order.rewardCopper,
                    startAt: data.order.startAt,
                });

                this.showToast(`接单成功：${data.order.name}`);
                Logger.info('ShopMainView', `接单成功: ${data.order.name}，开始生产`);
            } else {
                this.showToast(data.message ?? '接单失败');
                Logger.warn('ShopMainView', `接单失败: ${data.message}`);
            }
        } catch (err) {
            Logger.error('ShopMainView', '接单请求异常', err);
            this.showToast('网络异常，请重试');
        }
    }

    /**
     * 交付按钮点击
     */
    private async _onDeliverOrder(): Promise<void> {
        // 前端预校验
        if (!this._shopModel.isProductionComplete()) {
            this.showToast('生产尚未完成');
            return;
        }

        Logger.info('ShopMainView', '发送交付请求');

        try {
            const response = await this._network.request<ServerResponse<DeliverOrderResponse>>(
                SocketEvent.DELIVER_ORDER,
                {}
            );

            const data = response.data;
            if (data.success && data.reward) {
                // 更新铜钱（PlayerModel.addCopper 由后端确认后本地同步）
                this._playerModel.addCopper(data.reward.copper);

                // 清除当前订单
                this._shopModel.clearCurrentOrder();

                this.showToast(`交付成功！获得 ${data.reward.copper} 铜钱`);
                Logger.info('ShopMainView', `交付成功: +${data.reward.copper} 铜钱`);
            } else {
                this.showToast(data.message ?? '交付失败');
                Logger.warn('ShopMainView', `交付失败: ${data.message}`);
            }
        } catch (err) {
            Logger.error('ShopMainView', '交付请求异常', err);
            this.showToast('网络异常，请重试');
        }
    }

    // ─── 事件处理 ──────────────────────────────────────────────

    /**
     * 接单成功回调（ShopModel 派发）
     */
    private _onOrderTaken(_order: unknown): void {
        this._refreshAllOrderItems();
        this._startProgressTimer();
    }

    /**
     * 订单完成/交付回调（ShopModel 派发）
     */
    private _onOrderCompleted(_order: unknown): void {
        this._stopProgressTimer();
        this._refreshAllOrderItems();
    }

    // ─── 进度定时器 ───────────────────────────────────────────

    /**
     * 启动每秒进度更新定时器
     */
    private _startProgressTimer(): void {
        this._stopProgressTimer();
        this._progressTimerId = this._timerManager.setInterval(() => {
            this._updateProgress();
        }, 1, this);
    }

    /**
     * 停止进度定时器
     */
    private _stopProgressTimer(): void {
        if (this._progressTimerId !== 0) {
            this._timerManager.clearTimer(this._progressTimerId);
            this._progressTimerId = 0;
        }
    }

    /**
     * 每秒更新生产进度
     * 计算当前进度和剩余时间，更新 OrderItemView 显示
     * 生产完成时自动切换为交付状态
     */
    private _updateProgress(): void {
        if (!this._shopModel.hasActiveOrder) return;

        const progress = this._shopModel.getProgress();
        const remaining = this._shopModel.getRemainingTime();
        const activeOrder = this._shopModel.currentOrder!;

        // 更新对应的 OrderItemView
        for (const item of this._orderItems) {
            if (item.orderId === activeOrder.orderId) {
                item.updateProgress(progress, remaining);

                // 生产完成 → 切换为交付状态
                if (remaining <= 0 && item.state === OrderItemState.PRODUCING) {
                    item.setState(OrderItemState.READY);
                    this._stopProgressTimer();
                    this.showToast(`${activeOrder.name} 生产完成！可以交付了`);
                    Logger.info('ShopMainView', `生产完成: ${activeOrder.name}`);
                }
                break;
            }
        }

        // TODO: 更新 FairyGUI 全局进度显示
        Logger.debug('ShopMainView', `生产进度: ${Math.floor(progress * 100)}% | 剩余: ${Utils.formatTime(remaining)}`);
    }

    // ─── UI 刷新 ──────────────────────────────────────────────

    /**
     * 刷新铜钱显示
     */
    private _refreshCopper(): void {
        const copper = this._playerModel.copper;
        // TODO: 更新 FairyGUI 铜钱标签
        // this._copperLabel.text = Utils.formatNumber(copper);
        Logger.debug('ShopMainView', `铜钱: ${Utils.formatNumber(copper)}`);
    }

    /**
     * 刷新所有订单项状态
     * - 无进行中订单：全部显示为 AVAILABLE
     * - 有进行中订单：对应订单显示 PRODUCING/READY，其余显示 DISABLED
     */
    private _refreshAllOrderItems(): void {
        const activeOrder = this._shopModel.currentOrder;

        for (const item of this._orderItems) {
            if (!activeOrder) {
                // 无进行中订单，全部可接
                item.setState(OrderItemState.AVAILABLE);
            } else if (item.orderId === activeOrder.orderId) {
                // 当前生产中的订单
                if (this._shopModel.isProductionComplete()) {
                    item.setState(OrderItemState.READY);
                } else {
                    item.setState(OrderItemState.PRODUCING);
                }
            } else {
                // 其他订单禁用
                item.setState(OrderItemState.DISABLED);
            }
        }
    }
}
