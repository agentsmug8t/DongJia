// 文件路径：assets/scripts/modules/shop/view/OrderItemView.ts
// 依赖：core/utils/Logger.ts, core/utils/Utils.ts

import { Logger } from 'db://assets/scripts/core/utils/Logger';
import { Utils } from 'db://assets/scripts/core/utils/Utils';

/** 订单项显示状态 */
export enum OrderItemState {
    /** 可接单（显示名称 + 接单按钮） */
    AVAILABLE = 0,
    /** 生产中（显示进度条 + 剩余时间） */
    PRODUCING = 1,
    /** 生产完成（显示交付按钮） */
    READY = 2,
    /** 已禁用（其他订单正在生产中） */
    DISABLED = 3,
}

/** 订单配置数据 */
export interface OrderConfigData {
    orderId: number;
    name: string;
    duration: number;       // 生产耗时（秒）
    rewardCopper: number;   // 铜钱奖励
}

/**
 * 订单子项组件
 * 根据状态切换显示：接单按钮 / 进度条 / 交付按钮
 * 进度条每秒由父级调用 updateProgress() 更新
 *
 * @example
 * const item = new OrderItemView();
 * item.setData(config);
 * item.setState(OrderItemState.AVAILABLE);
 * item.onTakeClick = (orderId) => { ... };
 * item.onDeliverClick = () => { ... };
 */
export class OrderItemView {
    private _config: OrderConfigData | null = null;
    private _state: OrderItemState = OrderItemState.AVAILABLE;
    private _progress: number = 0;
    private _remainingTime: number = 0;

    // TODO: FairyGUI 组件引用
    // private _nameLabel: GLabel;
    // private _durationLabel: GLabel;
    // private _rewardLabel: GLabel;
    // private _takeBtn: GButton;
    // private _deliverBtn: GButton;
    // private _progressBar: GProgressBar;
    // private _remainingLabel: GLabel;
    // private _disabledMask: GComponent;

    /** 接单按钮回调（由父级 ShopMainView 设置） */
    onTakeClick: ((orderId: number) => void) | null = null;

    /** 交付按钮回调（由父级 ShopMainView 设置） */
    onDeliverClick: (() => void) | null = null;

    /**
     * 绑定订单配置数据
     * @param config - 订单配置
     */
    setData(config: OrderConfigData): void {
        this._config = config;
        this._refreshBaseInfo();
    }

    /**
     * 获取当前绑定的订单ID
     */
    get orderId(): number {
        return this._config?.orderId ?? -1;
    }

    /**
     * 获取当前状态
     */
    get state(): OrderItemState {
        return this._state;
    }

    /**
     * 切换显示状态
     * @param state - 目标状态
     */
    setState(state: OrderItemState): void {
        this._state = state;
        this._refreshStateDisplay();
    }

    /**
     * 更新生产进度（由父级每秒调用）
     * @param progress - 进度 0.0 ~ 1.0
     * @param remainingSeconds - 剩余秒数
     */
    updateProgress(progress: number, remainingSeconds: number): void {
        this._progress = progress;
        this._remainingTime = remainingSeconds;

        if (this._state !== OrderItemState.PRODUCING) return;

        // TODO: 更新 FairyGUI 进度条
        // this._progressBar.value = Math.floor(progress * 100);
        // this._remainingLabel.text = Utils.formatTime(remainingSeconds);

        Logger.debug('OrderItemView', `[${this._config?.name}] 进度: ${Math.floor(progress * 100)}% 剩余: ${Utils.formatTime(remainingSeconds)}`);
    }

    /**
     * 接单按钮点击处理
     */
    onTakeBtnClick(): void {
        if (this._config && this.onTakeClick) {
            Logger.info('OrderItemView', `点击接单: ${this._config.name}`);
            this.onTakeClick(this._config.orderId);
        }
    }

    /**
     * 交付按钮点击处理
     */
    onDeliverBtnClick(): void {
        if (this.onDeliverClick) {
            Logger.info('OrderItemView', `点击交付: ${this._config?.name}`);
            this.onDeliverClick();
        }
    }

    /**
     * 刷新基础信息（名称、耗时、奖励）
     */
    private _refreshBaseInfo(): void {
        if (!this._config) return;

        // TODO: 更新 FairyGUI 组件
        // this._nameLabel.text = this._config.name;
        // this._durationLabel.text = Utils.formatTime(this._config.duration);
        // this._rewardLabel.text = `铜钱 +${this._config.rewardCopper}`;

        Logger.debug('OrderItemView', `设置数据: ${this._config.name} | ${this._config.duration}s | +${this._config.rewardCopper}铜钱`);
    }

    /**
     * 根据状态切换 UI 可见性
     */
    private _refreshStateDisplay(): void {
        // TODO: FairyGUI 切换逻辑（以下用 Logger 模拟）
        switch (this._state) {
            case OrderItemState.AVAILABLE:
                // this._takeBtn.visible = true;
                // this._deliverBtn.visible = false;
                // this._progressBar.visible = false;
                // this._disabledMask.visible = false;
                Logger.debug('OrderItemView', `[${this._config?.name}] 状态: 可接单`);
                break;

            case OrderItemState.PRODUCING:
                // this._takeBtn.visible = false;
                // this._deliverBtn.visible = false;
                // this._progressBar.visible = true;
                // this._disabledMask.visible = false;
                Logger.debug('OrderItemView', `[${this._config?.name}] 状态: 生产中`);
                break;

            case OrderItemState.READY:
                // this._takeBtn.visible = false;
                // this._deliverBtn.visible = true;
                // this._progressBar.visible = false;
                // this._disabledMask.visible = false;
                Logger.debug('OrderItemView', `[${this._config?.name}] 状态: 可交付`);
                break;

            case OrderItemState.DISABLED:
                // this._takeBtn.visible = false;
                // this._deliverBtn.visible = false;
                // this._progressBar.visible = false;
                // this._disabledMask.visible = true;
                Logger.debug('OrderItemView', `[${this._config?.name}] 状态: 已禁用`);
                break;
        }
    }
}
