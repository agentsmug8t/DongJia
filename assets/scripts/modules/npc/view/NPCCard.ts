// 文件路径：assets/scripts/modules/npc/view/NPCCard.ts

import {
    _decorator, Component, Node, Label, UITransform, Color, Size, Vec3,
    Graphics, Layers, HorizontalTextAlignment, VerticalTextAlignment, Overflow
} from 'cc';
import { Logger } from 'db://assets/scripts/core/utils/Logger';

const { ccclass } = _decorator;

/** NPC 数据 */
export interface NPCData {
    id: string;
    name: string;
    role: string;
    level: number;
    desc: string;
    affection: number;    // 0-100
    avatarColor: Color;
    hasNewMsg: boolean;
    dialogues: string[];
}

@ccclass('NPCCard')
export class NPCCard extends Component {

    private _data: NPCData | null = null;
    private _nameLabel: Label | null = null;
    private _roleLabel: Label | null = null;
    private _affBar: Graphics | null = null;
    private _affLabel: Label | null = null;
    private _redDot: Node | null = null;
    private _onClick: ((data: NPCData) => void) | null = null;

    /** 初始化 NPC 卡片 */
    init(data: NPCData, onClick: (data: NPCData) => void): void {
        this._data = data;
        this._onClick = onClick;
        this._buildUI();
    }

    /** 设置红点 */
    setNewMsg(has: boolean): void {
        if (this._data) this._data.hasNewMsg = has;
        if (this._redDot) this._redDot.active = has;
    }

    /** 更新好感度 */
    updateAffection(value: number): void {
        if (this._data) this._data.affection = Math.min(100, value);
        this._drawAffBar();
    }

    private _buildUI(): void {
        if (!this._data) return;
        const d = this._data;

        const W = 380, H = 140;
        this.node.addComponent(UITransform).setContentSize(new Size(W, H));

        // 背景
        const bg = this._makeNode('Bg', this.node);
        bg.addComponent(UITransform).setContentSize(new Size(W, H));
        const bgGfx = bg.addComponent(Graphics);
        bgGfx.fillColor = new Color(40, 40, 70, 180);
        bgGfx.roundRect(-W / 2, -H / 2, W, H, 10);
        bgGfx.fill();
        bgGfx.strokeColor = new Color(80, 80, 120, 60);
        bgGfx.lineWidth = 1;
        bgGfx.roundRect(-W / 2, -H / 2, W, H, 10);
        bgGfx.stroke();

        // 头像
        const av = this._makeNode('Avatar', this.node);
        av.setPosition(new Vec3(-130, 10, 0));
        av.addComponent(UITransform).setContentSize(new Size(60, 60));
        const avGfx = av.addComponent(Graphics);
        avGfx.fillColor = d.avatarColor;
        avGfx.circle(0, 0, 26);
        avGfx.fill();
        this._makeLabel(av, 'AvText', d.name.charAt(0), 24, Color.WHITE, Vec3.ZERO);

        // 红点
        this._redDot = this._makeNode('RedDot', av);
        this._redDot.setPosition(new Vec3(20, 22, 0));
        this._redDot.addComponent(UITransform).setContentSize(new Size(14, 14));
        const rdGfx = this._redDot.addComponent(Graphics);
        rdGfx.fillColor = new Color(244, 67, 54);
        rdGfx.circle(0, 0, 6);
        rdGfx.fill();
        this._redDot.active = d.hasNewMsg;

        // 名称
        this._nameLabel = this._makeLabel(this.node, 'Name', d.name, 17,
            new Color(255, 240, 200), new Vec3(20, 40, 0));

        // 角色 + 等级
        this._roleLabel = this._makeLabel(this.node, 'Role',
            `${d.role} Lv.${d.level}`, 12,
            new Color(150, 150, 170), new Vec3(20, 18, 0));

        // 描述
        this._makeLabel(this.node, 'Desc', d.desc, 11,
            new Color(120, 120, 140), new Vec3(20, -4, 0));

        // 好感度进度条
        this._makeLabel(this.node, 'AffLbl', '❤ 好感', 11,
            new Color(180, 100, 120), new Vec3(-40, -30, 0));

        const barBg = this._makeNode('AffBarBg', this.node);
        barBg.setPosition(new Vec3(60, -30, 0));
        barBg.addComponent(UITransform).setContentSize(new Size(120, 10));
        const bbGfx = barBg.addComponent(Graphics);
        bbGfx.fillColor = new Color(30, 30, 50);
        bbGfx.roundRect(-60, -5, 120, 10, 3);
        bbGfx.fill();

        const barFill = this._makeNode('AffBarFill', this.node);
        barFill.setPosition(new Vec3(60, -30, 0));
        barFill.addComponent(UITransform).setContentSize(new Size(120, 10));
        this._affBar = barFill.addComponent(Graphics);
        this._drawAffBar();

        this._affLabel = this._makeLabel(this.node, 'AffVal',
            `${d.affection}%`, 10,
            new Color(150, 100, 120), new Vec3(140, -30, 0));

        // 在线状态
        const online = this._makeNode('Online', this.node);
        online.setPosition(new Vec3(160, 40, 0));
        online.addComponent(UITransform).setContentSize(new Size(10, 10));
        const olGfx = online.addComponent(Graphics);
        olGfx.fillColor = new Color(76, 175, 80);
        olGfx.circle(0, 0, 4);
        olGfx.fill();

        // 点击事件
        this.node.on(Node.EventType.TOUCH_END, () => {
            if (this._data && this._onClick) {
                Logger.info('NPCCard', `点击: ${this._data.name}`);
                this._onClick(this._data);
            }
        }, this);
    }

    private _drawAffBar(): void {
        if (!this._affBar || !this._data) return;
        this._affBar.clear();
        const w = Math.floor(120 * (this._data.affection / 100));
        if (w > 0) {
            this._affBar.fillColor = new Color(233, 30, 99);
            this._affBar.roundRect(-60, -5, w, 10, 3);
            this._affBar.fill();
        }
        if (this._affLabel) this._affLabel.string = `${this._data.affection}%`;
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
        n.addComponent(UITransform).setContentSize(new Size(200, fontSize + 10));
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
