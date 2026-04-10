// 文件路径：assets/scripts/modules/player/view/PlayerInfoView.ts

import {
    _decorator, Component, Node, Label, UITransform, Color, Size, Vec3,
    Graphics, Layers, HorizontalTextAlignment, VerticalTextAlignment, Overflow
} from 'cc';
import { Logger } from 'db://assets/scripts/core/utils/Logger';
import { PlayerModel } from 'db://assets/scripts/modules/player/model/PlayerModel';
import { EventManager } from 'db://assets/scripts/core/manager/EventManager';
import { PlayerEvent } from 'db://assets/scripts/core/constants/EventTypes';

const { ccclass } = _decorator;

@ccclass('PlayerInfoView')
export class PlayerInfoView extends Component {

    private _pm = PlayerModel.getInstance();
    private _em = EventManager.getInstance();
    private _currentTab = 0;
    private _contentNode: Node | null = null;
    private _pageNodes: Node[] = [];
    private _copperLbl: Label | null = null;
    private _silverLbl: Label | null = null;

    onLoad(): void {
        this._buildUI();
        this._showTab(0);
        this._em.on(PlayerEvent.CopperChanged, this._refreshHeader, this);
        this._em.on(PlayerEvent.SilverChanged, this._refreshHeader, this);
    }

    onDestroy(): void {
        this._em.offAll(this);
    }

    private _refreshHeader(): void {
        if (this._copperLbl) this._copperLbl.string = `💰 ${this._pm.copper}`;
        if (this._silverLbl) this._silverLbl.string = `🥈 ${this._pm.silver}`;
    }

    private _buildUI(): void {
        // ━━━ 头部：玩家信息 ━━━
        const header = this._makeNode('Header', this.node);
        header.setPosition(new Vec3(0, 240, 0));
        header.addComponent(UITransform).setContentSize(new Size(920, 80));
        const hGfx = header.addComponent(Graphics);
        hGfx.fillColor = new Color(25, 25, 55, 200);
        hGfx.roundRect(-460, -40, 920, 80, 8);
        hGfx.fill();

        // 头像
        const avatar = this._makeNode('Avatar', header);
        avatar.setPosition(new Vec3(-380, 0, 0));
        avatar.addComponent(UITransform).setContentSize(new Size(56, 56));
        const avGfx = avatar.addComponent(Graphics);
        avGfx.fillColor = new Color(255, 152, 0);
        avGfx.circle(0, 0, 26);
        avGfx.fill();
        const nick = this._pm.nickname || '掌柜';
        this._makeLabel(avatar, 'AChar', nick[0], 22, Color.WHITE, Vec3.ZERO);

        // 名字 + 等级
        this._makeLabel(header, 'Nick', nick, 18,
            new Color(255, 240, 200), new Vec3(-280, 10, 0));
        this._makeLabel(header, 'Lv', `Lv.${this._pm.level}  |  声望 ${this._pm.prestige}`, 12,
            new Color(150, 150, 170), new Vec3(-280, -12, 0));

        // 资产
        this._copperLbl = this._makeLabel(header, 'Copper', `💰 ${this._pm.copper}`, 14,
            new Color(255, 200, 50), new Vec3(200, 10, 0));
        this._silverLbl = this._makeLabel(header, 'Silver', `🥈 ${this._pm.silver}`, 14,
            new Color(200, 200, 230), new Vec3(200, -12, 0));

        // ━━━ 页签 ━━━
        const tabBar = this._makeNode('Tabs', this.node);
        tabBar.setPosition(new Vec3(0, 185, 0));
        tabBar.addComponent(UITransform).setContentSize(new Size(600, 32));

        const tabs = ['📦 背包', '🏆 成就', '📊 统计'];
        for (let i = 0; i < tabs.length; i++) {
            const tab = this._makeNode(`Tab_${i}`, tabBar);
            tab.setPosition(new Vec3(-200 + i * 200, 0, 0));
            tab.addComponent(UITransform).setContentSize(new Size(180, 32));
            const tGfx = tab.addComponent(Graphics);
            tGfx.fillColor = i === 0 ? new Color(255, 215, 0, 25) : new Color(0, 0, 0, 0);
            tGfx.roundRect(-90, -16, 180, 32, 4);
            tGfx.fill();
            this._makeLabel(tab, 'Lbl', tabs[i], 13,
                i === 0 ? new Color(255, 215, 0) : new Color(150, 150, 170), Vec3.ZERO);
            const idx = i;
            tab.on(Node.EventType.TOUCH_END, () => this._showTab(idx), this);
        }

        // ━━━ 内容区 ━━━
        this._contentNode = this._makeNode('Content', this.node);
        this._contentNode.setPosition(new Vec3(0, -40, 0));
        this._contentNode.addComponent(UITransform).setContentSize(new Size(920, 380));
    }

    private _showTab(idx: number): void {
        this._currentTab = idx;
        for (const p of this._pageNodes) {
            p.removeFromParent();
            p.destroy();
        }
        this._pageNodes = [];
        if (!this._contentNode) return;

        if (idx === 0) this._buildBagPage();
        else if (idx === 1) this._buildAchievePage();
        else this._buildStatsPage();
    }

    // ─── 背包页：10个格子 ─────────────────────────────────

    private _buildBagPage(): void {
        if (!this._contentNode) return;

        const items = [
            { name: '白菜', qty: 12, color: new Color(76, 175, 80) },
            { name: '鲈鱼', qty: 5, color: new Color(33, 150, 243) },
            { name: '五花肉', qty: 8, color: new Color(233, 30, 99) },
            { name: '米粒', qty: 30, color: new Color(255, 235, 59) },
            { name: '酱油', qty: 3, color: new Color(121, 85, 72) },
            { name: '盐巴', qty: 10, color: new Color(200, 200, 200) },
            { name: '辣椒', qty: 7, color: new Color(244, 67, 54) },
            { name: '空', qty: 0, color: new Color(50, 50, 70) },
            { name: '空', qty: 0, color: new Color(50, 50, 70) },
            { name: '空', qty: 0, color: new Color(50, 50, 70) },
        ];

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const col = i % 5;
            const row = Math.floor(i / 5);
            const x = -340 + col * 170;
            const y = 110 - row * 160;

            const cell = this._makeNode(`Bag_${i}`, this._contentNode);
            cell.setPosition(new Vec3(x, y, 0));
            cell.addComponent(UITransform).setContentSize(new Size(130, 130));
            const cGfx = cell.addComponent(Graphics);

            if (item.name === '空') {
                cGfx.lineWidth = 1;
                cGfx.strokeColor = new Color(60, 60, 90);
                cGfx.fillColor = new Color(20, 20, 45, 100);
                cGfx.roundRect(-65, -65, 130, 130, 8);
                cGfx.fill();
                cGfx.stroke();
                this._makeLabel(cell, 'Empty', '空', 14,
                    new Color(60, 60, 80), Vec3.ZERO);
            } else {
                cGfx.fillColor = new Color(35, 35, 65, 200);
                cGfx.lineWidth = 2;
                cGfx.strokeColor = new Color(item.color.r, item.color.g, item.color.b, 80);
                cGfx.roundRect(-65, -65, 130, 130, 8);
                cGfx.fill();
                cGfx.stroke();

                // 图标区（用颜色块代替）
                const icon = this._makeNode('Icon', cell);
                icon.setPosition(new Vec3(0, 15, 0));
                icon.addComponent(UITransform).setContentSize(new Size(50, 50));
                const iGfx = icon.addComponent(Graphics);
                iGfx.fillColor = item.color;
                iGfx.roundRect(-25, -25, 50, 50, 10);
                iGfx.fill();
                this._makeLabel(icon, 'Char', item.name[0], 20, Color.WHITE, Vec3.ZERO);

                this._makeLabel(cell, 'Name', item.name, 12,
                    new Color(200, 200, 220), new Vec3(0, -30, 0));
                this._makeLabel(cell, 'Qty', `×${item.qty}`, 11,
                    new Color(255, 215, 0), new Vec3(0, -48, 0));

                cell.on(Node.EventType.TOUCH_END, () => {
                    Logger.info('PlayerInfo', `查看物品: ${item.name} ×${item.qty}`);
                }, this);
            }
            this._pageNodes.push(cell);
        }
    }

    // ─── 成就页：3个成就 ──────────────────────────────────

    private _buildAchievePage(): void {
        if (!this._contentNode) return;

        const achievements = [
            { title: '🎉 初出茅庐', desc: '完成第一笔订单', progress: 1, max: 1, reward: '铜钱 ×100', done: true },
            { title: '🔥 厨神之路', desc: '完成100笔订单', progress: 37, max: 100, reward: '银两 ×10', done: false },
            { title: '👑 声名远扬', desc: '声望达到1000', progress: 150, max: 1000, reward: '特殊称号', done: false },
        ];

        for (let i = 0; i < achievements.length; i++) {
            const a = achievements[i];
            const card = this._makeNode(`Ach_${i}`, this._contentNode);
            card.setPosition(new Vec3(0, 110 - i * 120, 0));
            card.addComponent(UITransform).setContentSize(new Size(800, 90));
            const cGfx = card.addComponent(Graphics);
            cGfx.fillColor = a.done ? new Color(40, 60, 40, 180) : new Color(35, 35, 65, 180);
            cGfx.lineWidth = 1;
            cGfx.strokeColor = a.done ? new Color(76, 175, 80, 100) : new Color(60, 60, 90);
            cGfx.roundRect(-400, -45, 800, 90, 8);
            cGfx.fill();
            cGfx.stroke();

            this._makeLabel(card, 'Title', a.title, 16,
                a.done ? new Color(76, 255, 80) : new Color(255, 240, 200),
                new Vec3(-240, 18, 0));
            this._makeLabel(card, 'Desc', a.desc, 12,
                new Color(150, 150, 170), new Vec3(-240, -4, 0));

            // 进度条
            const barBg = this._makeNode('BarBg', card);
            barBg.setPosition(new Vec3(-150, -26, 0));
            barBg.addComponent(UITransform).setContentSize(new Size(300, 10));
            const bbGfx = barBg.addComponent(Graphics);
            bbGfx.fillColor = new Color(50, 50, 70);
            bbGfx.roundRect(-150, -5, 300, 10, 5);
            bbGfx.fill();

            const pct = a.progress / a.max;
            const barFill = this._makeNode('BarFill', card);
            barFill.setPosition(new Vec3(-150, -26, 0));
            barFill.addComponent(UITransform).setContentSize(new Size(300, 10));
            const bfGfx = barFill.addComponent(Graphics);
            bfGfx.fillColor = a.done ? new Color(76, 175, 80) : new Color(33, 150, 243);
            bfGfx.roundRect(-150, -5, Math.floor(300 * pct), 10, 5);
            bfGfx.fill();

            this._makeLabel(card, 'Prog', `${a.progress}/${a.max}`, 10,
                new Color(180, 180, 200), new Vec3(50, -26, 0));

            // 奖励 & 状态
            this._makeLabel(card, 'Reward', `奖励: ${a.reward}`, 11,
                new Color(255, 215, 0), new Vec3(280, 10, 0));
            this._makeLabel(card, 'Status', a.done ? '✅ 已完成' : '⏳ 进行中', 12,
                a.done ? new Color(76, 255, 80) : new Color(200, 200, 220),
                new Vec3(280, -12, 0));

            this._pageNodes.push(card);
        }
    }

    // ─── 统计页 ──────────────────────────────────────────────

    private _buildStatsPage(): void {
        if (!this._contentNode) return;

        const stats = [
            { label: '累计订单', value: '37', icon: '📋' },
            { label: '累计收入', value: '12,500 铜', icon: '💰' },
            { label: '游戏时长', value: '8小时23分', icon: '⏱' },
            { label: '最高连续登录', value: '7天', icon: '📅' },
            { label: 'NPC好感最高', value: '王大厨 (72)', icon: '❤️' },
            { label: '联盟贡献', value: '1,200', icon: '🏯' },
        ];

        for (let i = 0; i < stats.length; i++) {
            const s = stats[i];
            const col = i % 2;
            const row = Math.floor(i / 2);
            const x = -200 + col * 400;
            const y = 120 - row * 100;

            const card = this._makeNode(`Stat_${i}`, this._contentNode);
            card.setPosition(new Vec3(x, y, 0));
            card.addComponent(UITransform).setContentSize(new Size(350, 75));
            const cGfx = card.addComponent(Graphics);
            cGfx.fillColor = new Color(30, 30, 60, 180);
            cGfx.roundRect(-175, -37, 350, 75, 8);
            cGfx.fill();

            this._makeLabel(card, 'Icon', s.icon, 24,
                Color.WHITE, new Vec3(-130, 0, 0));
            this._makeLabel(card, 'Lbl', s.label, 13,
                new Color(150, 150, 170), new Vec3(-20, 12, 0));
            this._makeLabel(card, 'Val', s.value, 16,
                new Color(255, 240, 200), new Vec3(-20, -12, 0));

            this._pageNodes.push(card);
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
