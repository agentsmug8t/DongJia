// 文件路径：assets/scripts/modules/shop/view/ShopView.ts

import {
    _decorator, Component, Node, Label, UITransform, Color, Size, Vec3,
    Graphics, Layers, HorizontalTextAlignment, VerticalTextAlignment,
    Overflow, tween
} from 'cc';
import { Logger } from 'db://assets/scripts/core/utils/Logger';
import { EventManager } from 'db://assets/scripts/core/manager/EventManager';
import { PlayerModel } from 'db://assets/scripts/modules/player/model/PlayerModel';
import { ShopModel } from 'db://assets/scripts/modules/shop/model/ShopModel';
import { PlayerEvent, ShopEvent } from 'db://assets/scripts/core/constants/EventTypes';
import { OrderCard, OrderCardConfig, OrderState } from 'db://assets/scripts/modules/shop/view/OrderCard';

const { ccclass } = _decorator;

/** 演示订单数据 */
const DEMO_ORDERS: OrderCardConfig[] = [
    { orderId: 1, name: '白菜豆腐汤', stars: 1, duration: 10, rewardCopper: 80, desc: '清淡可口' },
    { orderId: 2, name: '红烧肉', stars: 3, duration: 20, rewardCopper: 200, desc: '肥而不腻' },
    { orderId: 3, name: '清蒸鲈鱼', stars: 4, duration: 30, rewardCopper: 350, desc: '鲜嫩多汁' },
    { orderId: 4, name: '宫保鸡丁', stars: 2, duration: 15, rewardCopper: 120, desc: '辣而不燥' },
    { orderId: 5, name: '佛跳墙', stars: 5, duration: 60, rewardCopper: 800, desc: '极品御膳' },
];

/** 演示伙夫数据 */
const DEMO_WORKERS = [
    { name: '王大厨', role: '主厨', level: 5, status: '工作中' },
    { name: '李帮工', role: '帮厨', level: 2, status: '空闲' },
    { name: '张采买', role: '采购', level: 3, status: '外出' },
];

@ccclass('ShopView')
export class ShopView extends Component {

    private _pm = PlayerModel.getInstance();
    private _em = EventManager.getInstance();
    private _sm = ShopModel.getInstance();

    private _currentPage: number = 0; // 0=订单, 1=伙夫, 2=升级
    private _contentNode: Node | null = null;
    private _pageNodes: Node[] = [];
    private _tabLabels: Label[] = [];
    private _tabGfxList: Graphics[] = [];
    private _orderCards: OrderCard[] = [];

    // 右侧面板
    private _shopLevelLabel: Label | null = null;
    private _copperLabel: Label | null = null;
    private _activeOrderLabel: Label | null = null;

    onLoad(): void {
        this._buildUI();
        this._showPage(0);
    }

    onDestroy(): void {
        this.unscheduleAllCallbacks();
        this._em.offAll(this);
    }

    // ─── UI 构建 ──────────────────────────────────────────────

    private _buildUI(): void {
        const root = this.node;

        // ── 顶部页签 ──
        const pageTabs = ['📋 订单', '👨‍🍳 伙夫', '⬆ 升级'];
        const tabBar = this._makeNode('ShopTabs', root);
        tabBar.setPosition(new Vec3(0, 240, 0));
        tabBar.addComponent(UITransform).setContentSize(new Size(600, 36));

        for (let i = 0; i < pageTabs.length; i++) {
            const tw = 200;
            const tx = -200 + i * tw;
            const tab = this._makeNode(`PT_${i}`, tabBar);
            tab.setPosition(new Vec3(tx, 0, 0));
            tab.addComponent(UITransform).setContentSize(new Size(tw, 36));
            const tGfx = tab.addComponent(Graphics);
            this._tabGfxList.push(tGfx);
            const tLbl = this._makeLabel(tab, 'Lbl', pageTabs[i], 14,
                new Color(150, 150, 170), Vec3.ZERO);
            this._tabLabels.push(tLbl);

            const idx = i;
            tab.on(Node.EventType.TOUCH_END, () => this._showPage(idx), this);
        }

        // ── 左侧内容区 ──
        this._contentNode = this._makeNode('Content', root);
        this._contentNode.setPosition(new Vec3(-140, -20, 0));
        this._contentNode.addComponent(UITransform).setContentSize(new Size(600, 440));

        // ── 右侧状态面板 ──
        const panel = this._makeNode('StatusPanel', root);
        panel.setPosition(new Vec3(340, -20, 0));
        panel.addComponent(UITransform).setContentSize(new Size(240, 440));
        const pGfx = panel.addComponent(Graphics);
        pGfx.fillColor = new Color(35, 35, 60, 180);
        pGfx.roundRect(-120, -220, 240, 440, 10);
        pGfx.fill();

        this._makeLabel(panel, 'PTitle', '🏪 食铺状态', 16,
            new Color(255, 220, 100), new Vec3(0, 190, 0));

        this._shopLevelLabel = this._makeLabel(panel, 'ShopLv', 'Lv.1', 28,
            new Color(255, 215, 0), new Vec3(0, 140, 0));

        this._makeLabel(panel, 'CopperIcon', '💰 铜钱', 13,
            new Color(150, 150, 170), new Vec3(0, 90, 0));
        this._copperLabel = this._makeLabel(panel, 'CopperVal',
            String(this._pm.copper), 22,
            new Color(255, 215, 0), new Vec3(0, 65, 0));

        this._makeLabel(panel, 'OrdIcon', '📦 进行中', 13,
            new Color(150, 150, 170), new Vec3(0, 20, 0));
        this._activeOrderLabel = this._makeLabel(panel, 'ActiveOrd',
            '0 / 3', 18,
            Color.WHITE, new Vec3(0, -5, 0));

        // 快捷操作按钮
        this._createPanelBtn(panel, '🔄 刷新订单', new Vec3(0, -80, 0), () => {
            Logger.info('ShopView', '刷新订单 (演示)');
        });
        this._createPanelBtn(panel, '📊 收益报表', new Vec3(0, -130, 0), () => {
            Logger.info('ShopView', '查看收益报表 (开发中)');
        });

        // 事件
        this._em.on(PlayerEvent.CopperChanged, () => {
            if (this._copperLabel) this._copperLabel.string = String(this._pm.copper);
        }, this);
    }

    // ─── 页面切换 ─────────────────────────────────────────────

    private _showPage(idx: number): void {
        this._currentPage = idx;

        // 清理旧内容
        for (const p of this._pageNodes) {
            p.removeFromParent();
            p.destroy();
        }
        this._pageNodes = [];
        this._orderCards = [];

        // 更新 tab 样式
        for (let i = 0; i < this._tabGfxList.length; i++) {
            const active = i === idx;
            this._tabGfxList[i].clear();
            if (active) {
                this._tabGfxList[i].fillColor = new Color(255, 215, 0, 25);
                this._tabGfxList[i].roundRect(-100, -18, 200, 36, 4);
                this._tabGfxList[i].fill();
            }
            this._tabLabels[i].color = active
                ? new Color(255, 215, 0) : new Color(150, 150, 170);
        }

        if (!this._contentNode) return;
        switch (idx) {
            case 0: this._buildOrderPage(); break;
            case 1: this._buildWorkerPage(); break;
            case 2: this._buildUpgradePage(); break;
        }
    }

    // ─── 订单页 ──────────────────────────────────────────────

    private _buildOrderPage(): void {
        if (!this._contentNode) return;

        for (let i = 0; i < DEMO_ORDERS.length; i++) {
            const cfg = DEMO_ORDERS[i];
            const cardNode = this._makeNode(`Order_${i}`, this._contentNode);
            cardNode.setPosition(new Vec3(0, 170 - i * 85, 0));
            cardNode.addComponent(UITransform).setContentSize(new Size(540, 80));

            const card = cardNode.addComponent(OrderCard);
            card.init(cfg,
                (id) => {
                    Logger.info('ShopView', `接单: #${id}`);
                    this._updateActiveCount();
                },
                (id) => {
                    Logger.info('ShopView', `交付: #${id}, +${cfg.rewardCopper}铜钱`);
                    this._pm.addCopper(cfg.rewardCopper);
                    this._updateActiveCount();
                }
            );
            this._orderCards.push(card);
            this._pageNodes.push(cardNode);
        }
    }

    private _updateActiveCount(): void {
        const active = this._orderCards.filter(
            c => c['_state'] === OrderState.PRODUCING
        ).length;
        if (this._activeOrderLabel) {
            this._activeOrderLabel.string = `${active} / 3`;
        }
    }

    // ─── 伙夫页 ──────────────────────────────────────────────

    private _buildWorkerPage(): void {
        if (!this._contentNode) return;

        this._makeLabel(this._contentNode, 'WTitle', '👨‍🍳 我的伙夫', 18,
            new Color(255, 220, 100), new Vec3(0, 190, 0));

        for (let i = 0; i < DEMO_WORKERS.length; i++) {
            const w = DEMO_WORKERS[i];
            const card = this._makeNode(`Worker_${i}`, this._contentNode);
            card.setPosition(new Vec3(0, 120 - i * 100, 0));
            card.addComponent(UITransform).setContentSize(new Size(520, 80));
            const cGfx = card.addComponent(Graphics);
            cGfx.fillColor = new Color(40, 40, 70, 160);
            cGfx.roundRect(-260, -40, 520, 80, 8);
            cGfx.fill();

            // 头像
            const av = this._makeNode('Av', card);
            av.setPosition(new Vec3(-210, 0, 0));
            av.addComponent(UITransform).setContentSize(new Size(50, 50));
            const avGfx = av.addComponent(Graphics);
            avGfx.fillColor = new Color(70, 70, 120);
            avGfx.circle(0, 0, 22);
            avGfx.fill();
            this._makeLabel(av, 'AvE', '👨‍🍳', 20, Color.WHITE, Vec3.ZERO);

            this._makeLabel(card, 'Name', w.name, 16,
                new Color(255, 240, 200), new Vec3(-100, 12, 0));
            this._makeLabel(card, 'Role', `${w.role} Lv.${w.level}`, 12,
                new Color(150, 150, 170), new Vec3(-100, -12, 0));

            const sc = w.status === '工作中' ? new Color(255, 152, 0) :
                       w.status === '空闲' ? new Color(76, 175, 80) :
                       new Color(120, 120, 140);
            this._makeLabel(card, 'Status', w.status, 13, sc, new Vec3(160, 0, 0));

            this._pageNodes.push(card);
        }

        // 招聘按钮
        const hireBtn = this._makeNode('HireBtn', this._contentNode);
        hireBtn.setPosition(new Vec3(0, -180, 0));
        hireBtn.addComponent(UITransform).setContentSize(new Size(200, 40));
        const hGfx = hireBtn.addComponent(Graphics);
        hGfx.fillColor = new Color(33, 150, 243);
        hGfx.roundRect(-100, -20, 200, 40, 6);
        hGfx.fill();
        this._makeLabel(hireBtn, 'HLbl', '+ 招聘伙夫', 15, Color.WHITE, Vec3.ZERO);
        hireBtn.on(Node.EventType.TOUCH_END, () => {
            Logger.info('ShopView', '招聘伙夫 (开发中)');
        }, this);
        this._pageNodes.push(hireBtn);

        const titleNode = this._contentNode.getChildByName('WTitle');
        if (titleNode) this._pageNodes.push(titleNode);
    }

    // ─── 升级页 ──────────────────────────────────────────────

    private _buildUpgradePage(): void {
        if (!this._contentNode) return;

        this._makeLabel(this._contentNode, 'UTitle', '⬆ 食铺升级', 18,
            new Color(255, 220, 100), new Vec3(0, 190, 0));

        // 当前信息
        const infoCard = this._makeNode('UpInfo', this._contentNode);
        infoCard.setPosition(new Vec3(0, 110, 0));
        infoCard.addComponent(UITransform).setContentSize(new Size(500, 120));
        const icGfx = infoCard.addComponent(Graphics);
        icGfx.fillColor = new Color(40, 40, 70, 160);
        icGfx.roundRect(-250, -60, 500, 120, 10);
        icGfx.fill();

        this._makeLabel(infoCard, 'CurLv', '当前等级: Lv.1', 16,
            Color.WHITE, new Vec3(0, 30, 0));
        this._makeLabel(infoCard, 'NextLv', '下一级: Lv.2', 14,
            new Color(150, 150, 170), new Vec3(0, 5, 0));
        this._makeLabel(infoCard, 'Bonus', '解锁: 订单容量 +1, 新菜品 +2', 13,
            new Color(76, 175, 80), new Vec3(0, -20, 0));
        this._makeLabel(infoCard, 'Cost', '升级费用: 💰500 铜钱', 14,
            new Color(255, 215, 0), new Vec3(0, -45, 0));

        // 升级按钮
        const upBtn = this._makeNode('UpBtn', this._contentNode);
        upBtn.setPosition(new Vec3(0, 10, 0));
        upBtn.addComponent(UITransform).setContentSize(new Size(220, 48));
        const ubGfx = upBtn.addComponent(Graphics);
        ubGfx.fillColor = new Color(255, 152, 0);
        ubGfx.roundRect(-110, -24, 220, 48, 8);
        ubGfx.fill();
        this._makeLabel(upBtn, 'UBLbl', '⬆ 升级食铺 (-500💰)', 15,
            Color.WHITE, Vec3.ZERO);
        upBtn.on(Node.EventType.TOUCH_END, () => {
            if (this._pm.copper >= 500) {
                this._pm.spendCopper(500);
                Logger.info('ShopView', '食铺升级成功！扣除 500 铜钱');
                if (this._shopLevelLabel) this._shopLevelLabel.string = 'Lv.2';
            } else {
                Logger.info('ShopView', '铜钱不足，无法升级');
            }
        }, this);

        const tNode = this._contentNode.getChildByName('UTitle');
        if (tNode) this._pageNodes.push(tNode);
        this._pageNodes.push(infoCard, upBtn);
    }

    // ─── 辅助 ─────────────────────────────────────────────────

    private _createPanelBtn(parent: Node, text: string, pos: Vec3,
        onClick: () => void): void {
        const btn = this._makeNode('PBtn', parent);
        btn.setPosition(pos);
        btn.addComponent(UITransform).setContentSize(new Size(200, 34));
        const gfx = btn.addComponent(Graphics);
        gfx.fillColor = new Color(50, 50, 80);
        gfx.roundRect(-100, -17, 200, 34, 6);
        gfx.fill();
        this._makeLabel(btn, 'Lbl', text, 13, new Color(200, 200, 220), Vec3.ZERO);
        btn.on(Node.EventType.TOUCH_END, onClick, this);
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
        n.addComponent(UITransform).setContentSize(new Size(400, fontSize + 10));
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
