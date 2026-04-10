// 文件路径：assets/scripts/modules/shop/ShopUIComponent.ts
// 依赖：cc, core/utils/Logger.ts, modules/player/model/PlayerModel.ts,
//        modules/shop/model/ShopModel.ts, core/manager/NetworkManager.ts,
//        core/network/Protocol.ts, core/constants/EventTypes.ts

import {
    _decorator, Component, Node, Label, UITransform, Color, Size, Vec3,
    Graphics, HorizontalTextAlignment, VerticalTextAlignment, Overflow, Layers
} from 'cc';
import { Logger } from 'db://assets/scripts/core/utils/Logger';
import { PlayerModel } from 'db://assets/scripts/modules/player/model/PlayerModel';
import { ShopModel, CurrentOrder } from 'db://assets/scripts/modules/shop/model/ShopModel';
import { NetworkManager } from 'db://assets/scripts/core/manager/NetworkManager';
import { EventManager } from 'db://assets/scripts/core/manager/EventManager';
import { SocketEvent, TakeOrderResponse, DeliverOrderResponse } from 'db://assets/scripts/core/network/Protocol';
import { PlayerEvent, ShopEvent } from 'db://assets/scripts/core/constants/EventTypes';

const { ccclass } = _decorator;

/** 订单配置 */
interface OrderConfig {
    orderId: number;
    name: string;
    duration: number;
    rewardCopper: number;
}

/** 本地订单配置（与 server/src/config/order.json 保持一致） */
const ORDER_CONFIGS: OrderConfig[] = [
    { orderId: 1, name: '白菜豆腐汤', duration: 30, rewardCopper: 50 },
    { orderId: 2, name: '红烧肉', duration: 60, rewardCopper: 150 },
    { orderId: 3, name: '清蒸鲈鱼', duration: 120, rewardCopper: 300 },
];

/** 订单卡片 UI 引用 */
interface OrderCardUI {
    config: OrderConfig;
    cardNode: Node;
    nameLabel: Label;
    infoLabel: Label;
    btnNode: Node;
    btnLabel: Label;
    btnGraphics: Graphics;
}

/**
 * 商铺 UI 组件（挂载在 Canvas 下的节点上）
 * 纯代码创建完整的"接单-生产-交付"界面
 *
 * 功能：
 * - 顶部显示铜钱数量
 * - 3 个订单卡片（名称、耗时、奖励 + 接单按钮）
 * - 底部生产状态区（进度条 + 状态文字）
 * - 接单/交付按钮交互
 */
@ccclass('ShopUIComponent')
export class ShopUIComponent extends Component {
    private _network: NetworkManager = NetworkManager.getInstance();
    private _shopModel: ShopModel = ShopModel.getInstance();
    private _playerModel: PlayerModel = PlayerModel.getInstance();
    private _eventManager: EventManager = EventManager.getInstance();

    /** 铜钱标签 */
    private _copperLabel: Label | null = null;

    /** 订单卡片列表 */
    private _orderCards: OrderCardUI[] = [];

    /** 生产状态标签 */
    private _statusLabel: Label | null = null;

    /** 进度条背景 Graphics */
    private _progressBgGraphics: Graphics | null = null;

    /** 进度条填充 Graphics */
    private _progressFillGraphics: Graphics | null = null;

    /** 进度文字标签 */
    private _progressLabel: Label | null = null;

    /** 标题标签 */
    private _titleLabel: Label | null = null;

    onLoad(): void {
        this._buildUI();
        this._setLayerRecursive(this.node);
        this._bindEvents();
        Logger.info('ShopUIComponent', 'UI 创建完成');
    }

    start(): void {
        this._refreshCopper();
        this._refreshAllCards();
        // 每秒更新进度
        this.schedule(this._updateProgress, 1);
    }

    onDestroy(): void {
        this._eventManager.offAll(this);
        this.unscheduleAllCallbacks();
    }

    // ─── UI 构建 ──────────────────────────────────────────────

    /**
     * 程序化构建完整 UI
     */
    private _buildUI(): void {
        // 确保主节点有 UITransform
        if (!this.node.getComponent(UITransform)) {
            const ut = this.node.addComponent(UITransform);
            ut.setContentSize(new Size(960, 640));
        }

        // 半透明背景
        this._drawBackground();

        // 标题
        this._titleLabel = this._createLabel(
            this.node, 'Title',
            '🏪 东家食铺',
            32, new Color(255, 220, 100),
            new Vec3(0, 270, 0)
        );

        // 铜钱显示
        this._copperLabel = this._createLabel(
            this.node, 'CopperLabel',
            '铜钱: 0',
            24, new Color(255, 200, 50),
            new Vec3(0, 230, 0)
        );

        // 3 个订单卡片
        const startY = 150;
        const cardGap = 130;
        for (let i = 0; i < ORDER_CONFIGS.length; i++) {
            const config = ORDER_CONFIGS[i];
            const y = startY - i * cardGap;
            const card = this._createOrderCard(config, new Vec3(0, y, 0));
            this._orderCards.push(card);
        }

        // 分隔线标签
        this._createLabel(
            this.node, 'Separator',
            '── 生产状态 ──',
            18, new Color(180, 180, 180),
            new Vec3(0, -230, 0)
        );

        // 状态标签
        this._statusLabel = this._createLabel(
            this.node, 'StatusLabel',
            '当前无订单',
            20, Color.WHITE,
            new Vec3(0, -260, 0)
        );

        // 进度条
        this._createProgressBar(new Vec3(0, -295, 0));
    }

    /**
     * 绘制半透明背景面板
     */
    private _drawBackground(): void {
        const bgNode = new Node('Background');
        this.node.addChild(bgNode);
        bgNode.setSiblingIndex(0);

        const ut = bgNode.addComponent(UITransform);
        ut.setContentSize(new Size(500, 620));

        const g = bgNode.addComponent(Graphics);
        g.fillColor = new Color(30, 30, 50, 200);
        g.roundRect(-250, -310, 500, 620, 16);
        g.fill();

        g.strokeColor = new Color(100, 100, 140, 180);
        g.lineWidth = 2;
        g.roundRect(-250, -310, 500, 620, 16);
        g.stroke();
    }

    /**
     * 创建订单卡片
     */
    private _createOrderCard(config: OrderConfig, pos: Vec3): OrderCardUI {
        // 卡片容器
        const cardNode = new Node(`Card_${config.orderId}`);
        this.node.addChild(cardNode);
        cardNode.setPosition(pos);

        const cardUt = cardNode.addComponent(UITransform);
        cardUt.setContentSize(new Size(440, 110));

        // 卡片背景
        const cardBg = cardNode.addComponent(Graphics);
        cardBg.fillColor = new Color(50, 50, 80, 180);
        cardBg.roundRect(-220, -55, 440, 110, 10);
        cardBg.fill();

        // 订单名称
        const nameLabel = this._createLabel(
            cardNode, 'Name',
            config.name,
            22, new Color(255, 240, 200),
            new Vec3(-80, 25, 0)
        );

        // 信息（耗时 + 奖励）
        const minutes = Math.floor(config.duration / 60);
        const seconds = config.duration % 60;
        const timeStr = minutes > 0 ? `${minutes}分${seconds > 0 ? seconds + '秒' : ''}` : `${seconds}秒`;
        const infoLabel = this._createLabel(
            cardNode, 'Info',
            `耗时: ${timeStr}  |  奖励: ${config.rewardCopper} 铜钱`,
            16, new Color(180, 180, 200),
            new Vec3(-80, -10, 0)
        );

        // 按钮
        const btnNode = new Node('Btn');
        cardNode.addChild(btnNode);
        btnNode.setPosition(new Vec3(160, 0, 0));

        const btnUt = btnNode.addComponent(UITransform);
        btnUt.setContentSize(new Size(100, 44));

        const btnGraphics = btnNode.addComponent(Graphics);
        this._drawButton(btnGraphics, 100, 44, new Color(60, 140, 60));

        const btnLabelNode = new Node('BtnLabel');
        btnNode.addChild(btnLabelNode);
        const btnLabelUt = btnLabelNode.addComponent(UITransform);
        btnLabelUt.setContentSize(new Size(100, 44));
        const btnLabel = btnLabelNode.addComponent(Label);
        btnLabel.string = '接 单';
        btnLabel.fontSize = 18;
        btnLabel.color = Color.WHITE;
        btnLabel.horizontalAlign = HorizontalTextAlignment.CENTER;
        btnLabel.verticalAlign = VerticalTextAlignment.CENTER;
        btnLabel.overflow = Overflow.CLAMP;

        // 按钮点击事件
        btnNode.on(Node.EventType.TOUCH_END, () => {
            this._onCardButtonClick(config.orderId);
        }, this);

        return { config, cardNode, nameLabel, infoLabel, btnNode, btnLabel, btnGraphics };
    }

    /**
     * 绘制按钮背景
     */
    private _drawButton(g: Graphics, w: number, h: number, color: Color): void {
        g.clear();
        g.fillColor = color;
        g.roundRect(-w / 2, -h / 2, w, h, 8);
        g.fill();
    }

    /**
     * 创建进度条
     */
    private _createProgressBar(pos: Vec3): void {
        const barWidth = 360;
        const barHeight = 24;

        // 进度条背景
        const bgNode = new Node('ProgressBg');
        this.node.addChild(bgNode);
        bgNode.setPosition(pos);
        bgNode.addComponent(UITransform).setContentSize(new Size(barWidth, barHeight));

        this._progressBgGraphics = bgNode.addComponent(Graphics);
        this._progressBgGraphics.fillColor = new Color(40, 40, 60);
        this._progressBgGraphics.roundRect(-barWidth / 2, -barHeight / 2, barWidth, barHeight, 6);
        this._progressBgGraphics.fill();

        // 进度条填充
        const fillNode = new Node('ProgressFill');
        this.node.addChild(fillNode);
        fillNode.setPosition(pos);
        fillNode.addComponent(UITransform).setContentSize(new Size(barWidth, barHeight));

        this._progressFillGraphics = fillNode.addComponent(Graphics);

        // 进度文字
        this._progressLabel = this._createLabel(
            this.node, 'ProgressLabel',
            '',
            14, Color.WHITE,
            new Vec3(pos.x, pos.y, 0)
        );
    }

    /**
     * 更新进度条填充
     */
    private _drawProgressFill(progress: number): void {
        if (!this._progressFillGraphics) return;

        const barWidth = 360;
        const barHeight = 24;
        const fillWidth = Math.max(0, barWidth * progress);

        this._progressFillGraphics.clear();
        if (fillWidth > 0) {
            const color = progress >= 1 ? new Color(60, 180, 60) : new Color(60, 120, 200);
            this._progressFillGraphics.fillColor = color;
            this._progressFillGraphics.roundRect(-barWidth / 2, -barHeight / 2, fillWidth, barHeight, 6);
            this._progressFillGraphics.fill();
        }
    }

    /**
     * 创建文本标签
     */
    private _createLabel(parent: Node, name: string, text: string, fontSize: number, color: Color, pos: Vec3): Label {
        const node = new Node(name);
        parent.addChild(node);
        node.setPosition(pos);

        const ut = node.addComponent(UITransform);
        ut.setContentSize(new Size(400, fontSize + 10));

        const label = node.addComponent(Label);
        label.string = text;
        label.fontSize = fontSize;
        label.color = color;
        label.horizontalAlign = HorizontalTextAlignment.CENTER;
        label.verticalAlign = VerticalTextAlignment.CENTER;
        label.overflow = Overflow.CLAMP;

        return label;
    }

    /** 递归设置所有节点的渲染层为 UI_2D */
    private _setLayerRecursive(node: Node): void {
        node.layer = Layers.Enum.UI_2D;
        for (const child of node.children) {
            this._setLayerRecursive(child);
        }
    }

    // ─── 事件绑定 ──────────────────────────────────────────────

    /**
     * 绑定全局事件
     */
    private _bindEvents(): void {
        this._eventManager.on(PlayerEvent.CopperChanged, this._refreshCopper, this);
        this._eventManager.on(ShopEvent.OrderTaken, this._onOrderTakenEvent, this);
        this._eventManager.on(ShopEvent.OrderCompleted, this._onOrderCompletedEvent, this);
    }

    // ─── 用户交互 ──────────────────────────────────────────────

    /**
     * 卡片按钮点击（根据状态执行接单或交付）
     */
    private async _onCardButtonClick(orderId: number): Promise<void> {
        const shopModel = this._shopModel;

        // 如果当前有订单且已完成 → 交付
        if (shopModel.hasActiveOrder && shopModel.currentOrder!.orderId === orderId && shopModel.isProductionComplete()) {
            await this._doDeliver();
            return;
        }

        // 如果没有进行中订单 → 接单
        if (!shopModel.hasActiveOrder) {
            await this._doTakeOrder(orderId);
            return;
        }

        Logger.debug('ShopUIComponent', '当前有订单进行中，无法操作');
    }

    /**
     * 发送接单请求
     */
    private async _doTakeOrder(orderId: number): Promise<void> {
        Logger.info('ShopUIComponent', `发送接单请求: orderId=${orderId}`);

        try {
            const res = await this._network.request<TakeOrderResponse>(
                SocketEvent.TAKE_ORDER,
                { orderId }
            );

            if (res.success && res.order) {
                this._shopModel.setCurrentOrder({
                    orderId: res.order.orderId,
                    name: res.order.name,
                    duration: res.order.duration,
                    rewardCopper: res.order.rewardCopper,
                    startAt: res.order.startAt,
                });
                this._refreshAllCards();
                Logger.info('ShopUIComponent', `接单成功: ${res.order.name}`);
            } else {
                Logger.warn('ShopUIComponent', `接单失败: ${res.message}`);
            }
        } catch (err) {
            Logger.error('ShopUIComponent', '接单请求异常', err);
        }
    }

    /**
     * 发送交付请求
     */
    private async _doDeliver(): Promise<void> {
        Logger.info('ShopUIComponent', '发送交付请求');

        try {
            const res = await this._network.request<DeliverOrderResponse>(
                SocketEvent.DELIVER_ORDER,
                {}
            );

            if (res.success && res.reward) {
                this._playerModel.addCopper(res.reward.copper);
                this._shopModel.clearCurrentOrder();
                this._refreshCopper();
                this._refreshAllCards();
                Logger.info('ShopUIComponent', `交付成功: +${res.reward.copper} 铜钱`);
            } else {
                Logger.warn('ShopUIComponent', `交付失败: ${res.message}`);
            }
        } catch (err) {
            Logger.error('ShopUIComponent', '交付请求异常', err);
        }
    }

    // ─── 事件回调 ──────────────────────────────────────────────

    private _onOrderTakenEvent(): void {
        this._refreshAllCards();
    }

    private _onOrderCompletedEvent(): void {
        this._refreshAllCards();
        this._drawProgressFill(0);
        if (this._progressLabel) this._progressLabel.string = '';
        if (this._statusLabel) this._statusLabel.string = '当前无订单';
    }

    // ─── 定时更新 ──────────────────────────────────────────────

    /**
     * 每秒更新生产进度（由 schedule 驱动）
     */
    private _updateProgress(): void {
        if (!this._shopModel.hasActiveOrder) return;

        const progress = this._shopModel.getProgress();
        const remaining = this._shopModel.getRemainingTime();
        const order = this._shopModel.currentOrder!;

        // 更新进度条
        this._drawProgressFill(progress);

        // 更新进度文字
        if (this._progressLabel) {
            this._progressLabel.string = `${Math.floor(progress * 100)}%`;
        }

        // 更新状态文字
        if (this._statusLabel) {
            if (remaining > 0) {
                const min = Math.floor(remaining / 60);
                const sec = remaining % 60;
                const timeStr = min > 0 ? `${min}分${sec}秒` : `${sec}秒`;
                this._statusLabel.string = `正在制作: ${order.name} | 剩余: ${timeStr}`;
                this._statusLabel.color = new Color(100, 200, 255);
            } else {
                this._statusLabel.string = `✅ ${order.name} 制作完成！点击交付领取奖励`;
                this._statusLabel.color = new Color(100, 255, 100);
            }
        }

        // 生产完成 → 更新对应的按钮
        if (remaining <= 0) {
            for (const card of this._orderCards) {
                if (card.config.orderId === order.orderId) {
                    card.btnLabel.string = '交 付';
                    this._drawButton(card.btnGraphics, 100, 44, new Color(200, 160, 30));
                }
            }
        }
    }

    // ─── UI 刷新 ──────────────────────────────────────────────

    /**
     * 刷新铜钱显示
     */
    private _refreshCopper(): void {
        if (this._copperLabel) {
            this._copperLabel.string = `💰 铜钱: ${this._playerModel.copper}`;
        }
    }

    /**
     * 刷新所有订单卡片状态
     */
    private _refreshAllCards(): void {
        const activeOrder = this._shopModel.currentOrder;

        for (const card of this._orderCards) {
            if (!activeOrder) {
                // 无进行中订单 → 全部可接
                card.btnLabel.string = '接 单';
                this._drawButton(card.btnGraphics, 100, 44, new Color(60, 140, 60));
                card.nameLabel.color = new Color(255, 240, 200);
                card.infoLabel.color = new Color(180, 180, 200);
            } else if (card.config.orderId === activeOrder.orderId) {
                // 当前生产中的订单
                if (this._shopModel.isProductionComplete()) {
                    card.btnLabel.string = '交 付';
                    this._drawButton(card.btnGraphics, 100, 44, new Color(200, 160, 30));
                } else {
                    card.btnLabel.string = '生产中';
                    this._drawButton(card.btnGraphics, 100, 44, new Color(60, 120, 200));
                }
                card.nameLabel.color = new Color(255, 255, 150);
                card.infoLabel.color = new Color(200, 200, 220);
            } else {
                // 其他订单 → 禁用
                card.btnLabel.string = '- -';
                this._drawButton(card.btnGraphics, 100, 44, new Color(80, 80, 80));
                card.nameLabel.color = new Color(120, 120, 140);
                card.infoLabel.color = new Color(100, 100, 120);
            }
        }
    }
}
