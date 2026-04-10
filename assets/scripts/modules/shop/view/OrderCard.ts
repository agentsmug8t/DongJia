// 文件路径：assets/scripts/modules/shop/view/OrderCard.ts

import { _decorator, Component, Node, Sprite, Label, Button, ProgressBar, tween, Vec3, UIOpacity } from 'cc';
import { Logger } from 'db://assets/scripts/core/utils/Logger';

const { ccclass, property } = _decorator;

/**
 * 订单卡片预制体
 *
 * 节点层级：
 * OrderCard (Node)
 * ├── Background (Sprite)          — 卡片背景
 * ├── NameLabel (Label)            — 订单名称
 * ├── RequesterLabel (Label)       — 委托人
 * ├── DurationLabel (Label)        — 所需时间
 * ├── RewardContainer (Node)
 * │   ├── CopperIcon (Sprite)
 * │   └── CopperLabel (Label)      — 奖励铜钱
 * ├── ExtraRewardIcon (Sprite)     — 额外奖励图标
 * ├── TakeBtn (Button)             — 接单按钮
 * ├── ProgressBar (ProgressBar)    — 进度条，默认隐藏
 * └── DeliverBtn (Button)          — 交付按钮，默认隐藏
 */
@ccclass('OrderCard')
export class OrderCard extends Component {

    // ─── UI 节点 ──────────────────────────────────────────────

    @property(Sprite)
    background: Sprite = null!;

    @property(Label)
    nameLabel: Label = null!;

    @property(Label)
    requesterLabel: Label = null!;

    @property(Label)
    durationLabel: Label = null!;

    @property(Node)
    rewardContainer: Node = null!;

    @property(Sprite)
    copperIcon: Sprite = null!;

    @property(Label)
    copperLabel: Label = null!;

    @property(Sprite)
    extraRewardIcon: Sprite = null!;

    @property(Button)
    takeBtn: Button = null!;

    @property(ProgressBar)
    progressBar: ProgressBar = null!;

    @property(Button)
    deliverBtn: Button = null!;

    // ─── 内部数据 ─────────────────────────────────────────────

    private _orderId: number = 0;
    private _onTakeCallback: ((orderId: number) => void) | null = null;
    private _onDeliverCallback: ((orderId: number) => void) | null = null;

    // ─── 生命周期 ─────────────────────────────────────────────

    onLoad(): void {
        // 默认隐藏进度条和交付按钮
        if (this.progressBar) {
            this.progressBar.node.active = false;
        }
        if (this.deliverBtn) {
            this.deliverBtn.node.active = false;
        }

        // 绑定按钮事件
        this.takeBtn?.node.on('click', this._onTakeClick, this);
        this.deliverBtn?.node.on('click', this._onDeliverClick, this);
    }

    // ─── 外部调用 ─────────────────────────────────────────────

    /**
     * 初始化卡片数据
     */
    setup(data: {
        orderId: number;
        name: string;
        requester?: string;
        duration: number;
        rewardCopper: number;
        hasExtraReward?: boolean;
        onTake?: (orderId: number) => void;
        onDeliver?: (orderId: number) => void;
    }): void {
        this._orderId = data.orderId;
        this._onTakeCallback = data.onTake ?? null;
        this._onDeliverCallback = data.onDeliver ?? null;

        if (this.nameLabel) this.nameLabel.string = data.name;
        if (this.requesterLabel) this.requesterLabel.string = data.requester ?? '';

        // 格式化耗时
        const min = Math.floor(data.duration / 60);
        const sec = data.duration % 60;
        const timeStr = min > 0 ? `${min}分${sec > 0 ? sec + '秒' : ''}` : `${sec}秒`;
        if (this.durationLabel) this.durationLabel.string = timeStr;

        if (this.copperLabel) this.copperLabel.string = String(data.rewardCopper);
        if (this.extraRewardIcon) this.extraRewardIcon.node.active = !!data.hasExtraReward;
    }

    /**
     * 切换到"生产中"状态
     */
    setProducing(progress: number = 0): void {
        if (this.takeBtn) this.takeBtn.node.active = false;
        if (this.progressBar) {
            this.progressBar.node.active = true;
            this.progressBar.progress = progress;
        }
        if (this.deliverBtn) this.deliverBtn.node.active = false;
    }

    /**
     * 切换到"可交付"状态
     */
    setDeliverable(): void {
        if (this.takeBtn) this.takeBtn.node.active = false;
        if (this.progressBar) this.progressBar.node.active = false;
        if (this.deliverBtn) this.deliverBtn.node.active = true;
    }

    /**
     * 重置到"可接单"状态
     */
    setIdle(): void {
        if (this.takeBtn) this.takeBtn.node.active = true;
        if (this.progressBar) this.progressBar.node.active = false;
        if (this.deliverBtn) this.deliverBtn.node.active = false;
    }

    /**
     * 设为禁用（其他订单正在进行中）
     */
    setDisabled(): void {
        if (this.takeBtn) {
            this.takeBtn.node.active = true;
            this.takeBtn.interactable = false;
        }
        if (this.progressBar) this.progressBar.node.active = false;
        if (this.deliverBtn) this.deliverBtn.node.active = false;
    }

    // ─── 按钮回调 ─────────────────────────────────────────────

    private _onTakeClick(): void {
        Logger.info('OrderCard', `接单: orderId=${this._orderId}`);
        if (this._onTakeCallback) {
            this._onTakeCallback(this._orderId);
        }
    }

    private _onDeliverClick(): void {
        Logger.info('OrderCard', `交付: orderId=${this._orderId}`);
        if (this._onDeliverCallback) {
            this._onDeliverCallback(this._orderId);
        }
    }

    // ─── 动画方法 ─────────────────────────────────────────────

    /** 卡片飞入进行中区域 */
    playTakeOrderAnim(): void {
        tween(this.node)
            .to(0.15, { scale: new Vec3(0.9, 0.9, 1) })
            .to(0.25, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' })
            .start();
    }

    /** 进度条填充 */
    playProgressFill(percent: number): void {
        if (!this.progressBar) return;
        tween(this.progressBar).to(0.3, { progress: percent }).start();
    }

    /** 交付成功铜钱雨 */
    playCoinRain(): void {
        // 卡片闪亮 + 弹跳
        tween(this.node)
            .to(0.1, { scale: new Vec3(1.1, 1.1, 1) })
            .to(0.2, { scale: new Vec3(1, 1, 1) }, { easing: 'bounceOut' })
            .start();
    }
}
