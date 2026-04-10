// 文件路径：assets/scripts/modules/shop/view/OrderCard.ts

import {
    _decorator, Component, Node, Label, UITransform, Color, Size, Vec3,
    Graphics, Layers, HorizontalTextAlignment, VerticalTextAlignment, Overflow
} from 'cc';
import { Logger } from 'db://assets/scripts/core/utils/Logger';

const { ccclass } = _decorator;

/** 订单状态 */
export enum OrderState { IDLE, PRODUCING, READY, DISABLED }

/** 订单卡片配置 */
export interface OrderCardConfig {
    orderId: number;
    name: string;
    stars: number;        // 1-5 难度
    duration: number;     // 秒
    rewardCopper: number;
    desc?: string;
}

@ccclass('OrderCard')
export class OrderCard extends Component {

    private _config: OrderCardConfig | null = null;
    private _state: OrderState = OrderState.IDLE;
    private _startTime: number = 0;

    // UI refs
    private _nameLabel: Label | null = null;
    private _infoLabel: Label | null = null;
    private _starsLabel: Label | null = null;
    private _btnLabel: Label | null = null;
    private _btnGfx: Graphics | null = null;
    private _progressGfx: Graphics | null = null;
    private _progressLabel: Label | null = null;
    private _statusLabel: Label | null = null;
    private _btnNode: Node | null = null;

    private _onTake: ((orderId: number) => void) | null = null;
    private _onDeliver: ((orderId: number) => void) | null = null;

    private readonly CARD_W = 540;
    private readonly CARD_H = 120;

    // ─── 公开方法 ──────────────────────────────────────────────

    /** 初始化订单卡片 */
    init(config: OrderCardConfig,
         onTake: (orderId: number) => void,
         onDeliver: (orderId: number) => void): void {
        this._config = config;
        this._onTake = onTake;
        this._onDeliver = onDeliver;
        this._buildUI();
        this.setState(OrderState.IDLE);
    }

    /** 设置状态 */
    setState(state: OrderState): void {
        this._state = state;

        switch (state) {
            case OrderState.IDLE:
                this._showIdle();
                break;
            case OrderState.PRODUCING:
                this._startTime = Date.now() / 1000;
                this._showProducing();
                this.schedule(this._tickProgress, 1);
                break;
            case OrderState.READY:
                this.unschedule(this._tickProgress);
                this._showReady();
                break;
            case OrderState.DISABLED:
                this.unschedule(this._tickProgress);
                this._showDisabled();
                break;
        }
    }

    onDestroy(): void {
        this.unscheduleAllCallbacks();
    }

    // ─── UI 构建 ──────────────────────────────────────────────

    private _buildUI(): void {
        if (!this._config) return;
        const c = this._config;

        // 卡片背景
        const bg = this._makeNode('CardBg', this.node);
        bg.addComponent(UITransform).setContentSize(new Size(this.CARD_W, this.CARD_H));
        const bgGfx = bg.addComponent(Graphics);
        bgGfx.fillColor = new Color(40, 40, 70, 180);
        bgGfx.roundRect(-this.CARD_W / 2, -this.CARD_H / 2, this.CARD_W, this.CARD_H, 10);
        bgGfx.fill();

        // 左侧难度指示条
        const diffBar = this._makeNode('DiffBar', bg);
        diffBar.setPosition(new Vec3(-this.CARD_W / 2 + 6, 0, 0));
        diffBar.addComponent(UITransform).setContentSize(new Size(6, this.CARD_H - 16));
        const dbGfx = diffBar.addComponent(Graphics);
        const diffColor = c.stars <= 2 ? new Color(76, 175, 80) :
                          c.stars <= 3 ? new Color(255, 193, 7) :
                                         new Color(244, 67, 54);
        dbGfx.fillColor = diffColor;
        dbGfx.roundRect(-3, -(this.CARD_H - 16) / 2, 6, this.CARD_H - 16, 3);
        dbGfx.fill();

        // 菜名
        this._nameLabel = this._makeLabel(bg, 'Name', c.name, 18,
            new Color(255, 240, 200), new Vec3(-140, 30, 0));

        // 星级
        this._starsLabel = this._makeLabel(bg, 'Stars', '⭐'.repeat(c.stars), 12,
            new Color(255, 200, 50), new Vec3(-140, 8, 0));

        // 信息 (时长 + 奖励)
        this._infoLabel = this._makeLabel(bg, 'Info',
            `⏱${c.duration}s  💰${c.rewardCopper}铜钱`, 13,
            new Color(150, 150, 170), new Vec3(-140, -14, 0));

        // 进度条背景
        const progBg = this._makeNode('ProgressBg', bg);
        progBg.setPosition(new Vec3(-60, -40, 0));
        progBg.addComponent(UITransform).setContentSize(new Size(280, 12));
        const progBgGfx = progBg.addComponent(Graphics);
        progBgGfx.fillColor = new Color(30, 30, 50);
        progBgGfx.roundRect(-140, -6, 280, 12, 3);
        progBgGfx.fill();

        // 进度条填充
        const progFill = this._makeNode('ProgressFill', bg);
        progFill.setPosition(new Vec3(-60, -40, 0));
        progFill.addComponent(UITransform).setContentSize(new Size(280, 12));
        this._progressGfx = progFill.addComponent(Graphics);

        // 进度文字
        this._progressLabel = this._makeLabel(bg, 'ProgText', '', 11,
            new Color(120, 120, 140), new Vec3(100, -40, 0));

        // 状态文字
        this._statusLabel = this._makeLabel(bg, 'Status', '', 12,
            new Color(150, 150, 170), new Vec3(60, 30, 0));

        // 操作按钮
        this._btnNode = this._makeNode('ActionBtn', bg);
        this._btnNode.setPosition(new Vec3(200, 0, 0));
        this._btnNode.addComponent(UITransform).setContentSize(new Size(100, 40));
        this._btnGfx = this._btnNode.addComponent(Graphics);
        this._btnLabel = this._makeLabel(this._btnNode, 'BtnLbl', '接单', 15,
            Color.WHITE, Vec3.ZERO);

        this._btnNode.on(Node.EventType.TOUCH_END, this._onBtnClick, this);
    }

    // ─── 状态显示 ─────────────────────────────────────────────

    private _showIdle(): void {
        this._drawBtn(new Color(76, 175, 80), '接单');
        if (this._statusLabel) this._statusLabel.string = '空闲';
        this._drawProgress(0);
        if (this._progressLabel) this._progressLabel.string = '';
        if (this._btnNode) this._btnNode.active = true;
    }

    private _showProducing(): void {
        this._drawBtn(new Color(100, 100, 120), '制作中');
        if (this._statusLabel) {
            this._statusLabel.string = '🔥 制作中';
            this._statusLabel.color = new Color(255, 152, 0);
        }
        if (this._btnNode) this._btnNode.active = false;
    }

    private _showReady(): void {
        this._drawBtn(new Color(33, 150, 243), '交付');
        if (this._statusLabel) {
            this._statusLabel.string = '✅ 可交付';
            this._statusLabel.color = new Color(76, 175, 80);
        }
        this._drawProgress(1);
        if (this._progressLabel) this._progressLabel.string = '完成！';
        if (this._btnNode) this._btnNode.active = true;
    }

    private _showDisabled(): void {
        this._drawBtn(new Color(60, 60, 80), '已完成');
        if (this._statusLabel) {
            this._statusLabel.string = '已完成';
            this._statusLabel.color = new Color(100, 100, 120);
        }
        if (this._btnNode) this._btnNode.active = false;
    }

    // ─── 进度 ─────────────────────────────────────────────────

    private _tickProgress(): void {
        if (!this._config || this._state !== OrderState.PRODUCING) return;
        const elapsed = Date.now() / 1000 - this._startTime;
        const progress = Math.min(1, elapsed / this._config.duration);

        this._drawProgress(progress);

        const remaining = Math.max(0, this._config.duration - elapsed);
        if (this._progressLabel) {
            this._progressLabel.string = remaining > 0
                ? `${Math.ceil(remaining)}s` : '完成！';
        }

        if (progress >= 1) {
            this.setState(OrderState.READY);
        }
    }

    private _drawProgress(progress: number): void {
        if (!this._progressGfx) return;
        this._progressGfx.clear();
        const w = Math.floor(280 * progress);
        if (w > 0) {
            this._progressGfx.fillColor = progress >= 1
                ? new Color(76, 175, 80) : new Color(255, 193, 7);
            this._progressGfx.roundRect(-140, -6, w, 12, 3);
            this._progressGfx.fill();
        }
    }

    // ─── 按钮 ─────────────────────────────────────────────────

    private _drawBtn(color: Color, text: string): void {
        if (this._btnGfx) {
            this._btnGfx.clear();
            this._btnGfx.fillColor = color;
            this._btnGfx.roundRect(-50, -20, 100, 40, 6);
            this._btnGfx.fill();
        }
        if (this._btnLabel) this._btnLabel.string = text;
    }

    private _onBtnClick(): void {
        if (!this._config) return;
        if (this._state === OrderState.IDLE) {
            Logger.info('OrderCard', `接单: ${this._config.name}`);
            this._onTake?.(this._config.orderId);
            this.setState(OrderState.PRODUCING);
        } else if (this._state === OrderState.READY) {
            Logger.info('OrderCard', `交付: ${this._config.name}`);
            this._onDeliver?.(this._config.orderId);
            this.setState(OrderState.DISABLED);
        }
    }

    // ─── 工具 ─────────────────────────────────────────────────

    private _makeNode(name: string, parent: Node): Node {
        const n = new Node(name);
        n.layer = Layers.Enum.UI_2D;
        parent.addChild(n);
        return n;
    }

    private _makeLabel(parent: Node, name: string, text: string,
        fontSize: number, color: Color, pos: Vec3): Label {
        const n = this._makeNode(name, parent);
        n.setPosition(pos);
        n.addComponent(UITransform).setContentSize(new Size(280, fontSize + 10));
        const lbl = n.addComponent(Label);
        lbl.string = text;
        lbl.fontSize = fontSize;
        lbl.color = color;
        lbl.horizontalAlign = HorizontalTextAlignment.CENTER;
        lbl.verticalAlign = VerticalTextAlignment.CENTER;
        lbl.overflow = Overflow.CLAMP;
        return lbl;
    }
}
