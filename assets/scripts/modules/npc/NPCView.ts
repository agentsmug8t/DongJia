// 文件路径：assets/scripts/modules/npc/NPCView.ts

import {
    _decorator, Component, Node, Label, UITransform, Color, Size, Vec3,
    Graphics, Layers, HorizontalTextAlignment, VerticalTextAlignment, Overflow
} from 'cc';
import { Logger } from 'db://assets/scripts/core/utils/Logger';
import { EventManager } from 'db://assets/scripts/core/manager/EventManager';
import { NPCCard, NPCData } from 'db://assets/scripts/modules/npc/view/NPCCard';
import { NPCDialogView } from 'db://assets/scripts/modules/npc/view/NPCDialogView';

const { ccclass } = _decorator;

/** 6个演示 NPC */
const DEMO_NPCS: NPCData[] = [
    { id: 'npc1', name: '王大厨', role: '主厨', level: 5, desc: '刀工精湛，厨艺高超', affection: 72, avatarColor: new Color(183, 28, 28), hasNewMsg: true, dialogues: ['今天买到了新鲜的鲈鱼！', '掌柜，灶火不够旺了。', '我新学了一道菜，想试试。'] },
    { id: 'npc2', name: '李小妹', role: '招待', level: 3, desc: '笑容可掬，客人最爱', affection: 45, avatarColor: new Color(233, 30, 99), hasNewMsg: false, dialogues: ['客人们今天心情不错~', '掌柜，桌子擦好了！', '有客人想点红烧肉。'] },
    { id: 'npc3', name: '张采买', role: '采购', level: 4, desc: '善于讲价，精打细算', affection: 60, avatarColor: new Color(33, 150, 243), hasNewMsg: true, dialogues: ['市集上有便宜的白菜。', '我找到了优质的食材供应商。', '明天的采购清单准备好了。'] },
    { id: 'npc4', name: '赵护院', role: '护卫', level: 6, desc: '武艺高强，确保安全', affection: 30, avatarColor: new Color(76, 175, 80), hasNewMsg: false, dialogues: ['今天一切平安。', '有几个可疑的人在店外转悠。', '掌柜，刀已经磨好。'] },
    { id: 'npc5', name: '孙账房', role: '账房', level: 3, desc: '打算盘一把好手', affection: 55, avatarColor: new Color(255, 152, 0), hasNewMsg: true, dialogues: ['今日收入已记账完毕。', '上个月盈利增长了15%！', '掌柜，铜钱不太够了。'] },
    { id: 'npc6', name: '钱伙计', role: '杂役', level: 1, desc: '勤快朴实，做事麻利', affection: 20, avatarColor: new Color(121, 85, 72), hasNewMsg: false, dialogues: ['掌柜，柴火已经劈好了。', '碗筷都洗干净啦！', '我会努力干活的！'] },
];

@ccclass('NPCView')
export class NPCView extends Component {

    private _em = EventManager.getInstance();
    private _dialogView: NPCDialogView | null = null;
    private _contentNode: Node | null = null;
    private _currentPage: number = 0; // 0: 街坊, 1: 消息
    private _pageNodes: Node[] = [];

    onLoad(): void {
        this._buildUI();
        this._showPage(0);
    }

    onDestroy(): void {
        this._em.offAll(this);
    }

    private _buildUI(): void {
        // 页签
        const tabBar = this._makeNode('NPCTabs', this.node);
        tabBar.setPosition(new Vec3(0, 240, 0));
        tabBar.addComponent(UITransform).setContentSize(new Size(400, 36));

        const tabs = ['🏘 街坊', '📩 消息'];
        for (let i = 0; i < tabs.length; i++) {
            const tab = this._makeNode(`Tab_${i}`, tabBar);
            tab.setPosition(new Vec3(-100 + i * 200, 0, 0));
            tab.addComponent(UITransform).setContentSize(new Size(200, 36));
            const tGfx = tab.addComponent(Graphics);
            if (i === 0) {
                tGfx.fillColor = new Color(255, 215, 0, 25);
                tGfx.roundRect(-100, -18, 200, 36, 4);
                tGfx.fill();
            }
            this._makeLabel(tab, 'Lbl', tabs[i], 14,
                i === 0 ? new Color(255, 215, 0) : new Color(150, 150, 170),
                Vec3.ZERO);
            const idx = i;
            tab.on(Node.EventType.TOUCH_END, () => this._showPage(idx), this);
        }

        // 内容区
        this._contentNode = this._makeNode('Content', this.node);
        this._contentNode.setPosition(new Vec3(0, -20, 0));
        this._contentNode.addComponent(UITransform).setContentSize(new Size(920, 460));

        // 对话弹窗（初始隐藏）
        const dlgNode = this._makeNode('NPCDialog', this.node);
        this._dialogView = dlgNode.addComponent(NPCDialogView);
        dlgNode.active = false;
    }

    private _showPage(idx: number): void {
        this._currentPage = idx;
        for (const p of this._pageNodes) {
            p.removeFromParent();
            p.destroy();
        }
        this._pageNodes = [];

        if (!this._contentNode) return;
        if (idx === 0) this._buildStreetPage();
        else this._buildNewsPage();
    }

    // ─── 街坊页（2×3 网格）──────────────────────────────────

    private _buildStreetPage(): void {
        if (!this._contentNode) return;

        for (let i = 0; i < DEMO_NPCS.length; i++) {
            const npc = DEMO_NPCS[i];
            const col = i % 2;
            const row = Math.floor(i / 2);
            const x = -210 + col * 420;
            const y = 140 - row * 160;

            const cardNode = this._makeNode(`NPC_${i}`, this._contentNode);
            cardNode.setPosition(new Vec3(x, y, 0));
            const card = cardNode.addComponent(NPCCard);
            card.init(npc, (data) => {
                this._openDialog(data);
            });
            this._pageNodes.push(cardNode);
        }
    }

    // ─── 消息页 ──────────────────────────────────────────────

    private _buildNewsPage(): void {
        if (!this._contentNode) return;

        const messages = [
            { from: '王大厨', text: '掌柜，我研发了新菜品！', time: '10分钟前' },
            { from: '孙账房', text: '本月盈利报表已出，请过目。', time: '1小时前' },
            { from: '张采买', text: '市集有一批打折食材，要不要买？', time: '3小时前' },
        ];

        for (let i = 0; i < messages.length; i++) {
            const msg = messages[i];
            const row = this._makeNode(`Msg_${i}`, this._contentNode);
            row.setPosition(new Vec3(0, 170 - i * 80, 0));
            row.addComponent(UITransform).setContentSize(new Size(800, 60));
            const rGfx = row.addComponent(Graphics);
            rGfx.fillColor = new Color(40, 40, 70, 160);
            rGfx.roundRect(-400, -30, 800, 60, 8);
            rGfx.fill();

            this._makeLabel(row, 'From', msg.from, 15,
                new Color(255, 240, 200), new Vec3(-330, 8, 0));
            this._makeLabel(row, 'Text', msg.text, 13,
                new Color(180, 180, 200), new Vec3(-100, -10, 0));
            this._makeLabel(row, 'Time', msg.time, 11,
                new Color(100, 100, 120), new Vec3(330, 0, 0));

            row.on(Node.EventType.TOUCH_END, () => {
                Logger.info('NPCView', `查看消息: ${msg.from} - ${msg.text}`);
            }, this);
            this._pageNodes.push(row);
        }
    }

    // ─── 对话弹窗 ────────────────────────────────────────────

    private _openDialog(data: NPCData): void {
        if (this._dialogView) {
            this._dialogView.show(data);
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
