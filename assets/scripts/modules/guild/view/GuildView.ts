// 文件路径：assets/scripts/modules/guild/view/GuildView.ts

import {
    _decorator, Component, Node, Label, UITransform, Color, Size, Vec3,
    Graphics, Layers, HorizontalTextAlignment, VerticalTextAlignment, Overflow
} from 'cc';
import { Logger } from 'db://assets/scripts/core/utils/Logger';
import { PlayerModel } from 'db://assets/scripts/modules/player/model/PlayerModel';

const { ccclass } = _decorator;

interface GuildMember {
    name: string;
    role: string;
    level: number;
    contribution: number;
    online: boolean;
    color: Color;
}

interface ChatMsg {
    sender: string;
    text: string;
    time: string;
    color: Color;
}

const DEMO_MEMBERS: GuildMember[] = [
    { name: '掌柜(你)', role: '盟主', level: 10, contribution: 1200, online: true, color: new Color(255, 215, 0) },
    { name: '刘掌柜', role: '副盟主', level: 8, contribution: 980, online: true, color: new Color(33, 150, 243) },
    { name: '陈大厨', role: '精英', level: 6, contribution: 650, online: true, color: new Color(76, 175, 80) },
    { name: '周商人', role: '成员', level: 5, contribution: 420, online: false, color: new Color(255, 152, 0) },
    { name: '吴小二', role: '成员', level: 3, contribution: 210, online: false, color: new Color(156, 39, 176) },
];

@ccclass('GuildView')
export class GuildView extends Component {

    private _pm = PlayerModel.getInstance();
    private _chatMessages: ChatMsg[] = [];
    private _chatArea: Node | null = null;
    private _chatLabels: Label[] = [];
    private _maxChat = 8;

    onDestroy(): void {
        this.unscheduleAllCallbacks();
    }

    onLoad(): void {
        this._chatMessages = [
            { sender: '刘掌柜', text: '今天联盟活动什么时候开始？', time: '14:20', color: new Color(33, 150, 243) },
            { sender: '陈大厨', text: '我已经准备好了50份菜品', time: '14:22', color: new Color(76, 175, 80) },
            { sender: '掌柜(你)', text: '很好，下午3点准时开始！', time: '14:25', color: new Color(255, 215, 0) },
        ];
        this._buildUI();
    }

    private _buildUI(): void {
        // ━━━ 左侧：联盟信息 + 成员列表 ━━━
        this._buildInfoPanel();
        // ━━━ 右侧：聊天区 ━━━
        this._buildChatPanel();
    }

    // ─── 联盟信息面板 ──────────────────────────────────────

    private _buildInfoPanel(): void {
        const left = this._makeNode('LeftPanel', this.node);
        left.setPosition(new Vec3(-250, 0, 0));
        left.addComponent(UITransform).setContentSize(new Size(380, 480));
        const lGfx = left.addComponent(Graphics);
        lGfx.fillColor = new Color(25, 25, 55, 180);
        lGfx.roundRect(-190, -240, 380, 480, 8);
        lGfx.fill();

        // 联盟头部
        this._makeLabel(left, 'GuildName', '🏯 天下食府联盟', 18,
            new Color(255, 215, 0), new Vec3(0, 210, 0));
        this._makeLabel(left, 'GuildLv', 'Lv.5 | 成员 5/20 | 贡献 3460', 11,
            new Color(150, 150, 170), new Vec3(0, 185, 0));

        // 分隔
        const sep1 = this._makeNode('Sep1', left);
        sep1.setPosition(new Vec3(0, 170, 0));
        sep1.addComponent(UITransform).setContentSize(new Size(340, 1));
        const s1Gfx = sep1.addComponent(Graphics);
        s1Gfx.fillColor = new Color(255, 255, 255, 30);
        s1Gfx.rect(-170, 0, 340, 1);
        s1Gfx.fill();

        // 成员列表
        this._makeLabel(left, 'MemTitle', '成员列表', 14,
            new Color(200, 200, 220), new Vec3(-120, 148, 0));

        for (let i = 0; i < DEMO_MEMBERS.length; i++) {
            const m = DEMO_MEMBERS[i];
            const row = this._makeNode(`Mem_${i}`, left);
            row.setPosition(new Vec3(0, 110 - i * 55, 0));
            row.addComponent(UITransform).setContentSize(new Size(350, 45));
            const rGfx = row.addComponent(Graphics);
            rGfx.fillColor = new Color(35, 35, 65, 140);
            rGfx.roundRect(-175, -22, 350, 45, 6);
            rGfx.fill();

            // 头像圈
            const av = this._makeNode('Av', row);
            av.setPosition(new Vec3(-145, 0, 0));
            av.addComponent(UITransform).setContentSize(new Size(32, 32));
            const avGfx = av.addComponent(Graphics);
            avGfx.fillColor = m.color;
            avGfx.circle(0, 0, 14);
            avGfx.fill();
            this._makeLabel(av, 'C', m.name[0], 13, Color.WHITE, Vec3.ZERO);

            // 在线标记
            if (m.online) {
                const dot = this._makeNode('On', av);
                dot.setPosition(new Vec3(10, 10, 0));
                dot.addComponent(UITransform).setContentSize(new Size(8, 8));
                const dGfx = dot.addComponent(Graphics);
                dGfx.fillColor = new Color(76, 255, 80);
                dGfx.circle(0, 0, 4);
                dGfx.fill();
            }

            this._makeLabel(row, 'Name', m.name, 13,
                new Color(220, 220, 240), new Vec3(-80, 6, 0));
            this._makeLabel(row, 'Role', m.role, 10,
                m.role === '盟主' ? new Color(255, 215, 0) : new Color(130, 130, 160),
                new Vec3(-80, -10, 0));
            this._makeLabel(row, 'Lv', `Lv.${m.level}`, 11,
                new Color(150, 150, 170), new Vec3(60, 0, 0));
            this._makeLabel(row, 'Contrib', `贡献:${m.contribution}`, 10,
                new Color(120, 120, 150), new Vec3(140, 0, 0));
        }

        // 功能按钮
        const btns = [
            { text: '📢 联盟公告', color: new Color(33, 150, 243) },
            { text: '🎯 联盟任务', color: new Color(76, 175, 80) },
            { text: '🏪 联盟商店', color: new Color(255, 152, 0) },
        ];
        for (let i = 0; i < btns.length; i++) {
            const b = btns[i];
            const btn = this._makeNode(`Btn_${i}`, left);
            btn.setPosition(new Vec3(-120 + i * 120, -210, 0));
            btn.addComponent(UITransform).setContentSize(new Size(110, 32));
            const bGfx = btn.addComponent(Graphics);
            bGfx.fillColor = b.color;
            bGfx.roundRect(-55, -16, 110, 32, 6);
            bGfx.fill();
            this._makeLabel(btn, 'BLbl', b.text, 11, Color.WHITE, Vec3.ZERO);
            btn.on(Node.EventType.TOUCH_END, () => {
                Logger.info('GuildView', `点击: ${b.text}`);
            }, this);
        }
    }

    // ─── 聊天面板 ────────────────────────────────────────────

    private _buildChatPanel(): void {
        const right = this._makeNode('RightPanel', this.node);
        right.setPosition(new Vec3(200, 0, 0));
        right.addComponent(UITransform).setContentSize(new Size(440, 480));
        const rGfx = right.addComponent(Graphics);
        rGfx.fillColor = new Color(20, 20, 50, 180);
        rGfx.roundRect(-220, -240, 440, 480, 8);
        rGfx.fill();

        this._makeLabel(right, 'ChatTitle', '💬 联盟聊天', 15,
            new Color(255, 240, 200), new Vec3(0, 215, 0));

        // 聊天区域
        this._chatArea = this._makeNode('ChatArea', right);
        this._chatArea.setPosition(new Vec3(0, 10, 0));
        this._chatArea.addComponent(UITransform).setContentSize(new Size(410, 360));
        const caBg = this._chatArea.addComponent(Graphics);
        caBg.fillColor = new Color(15, 15, 40, 120);
        caBg.roundRect(-205, -180, 410, 360, 6);
        caBg.fill();

        // 渲染初始消息
        for (const msg of this._chatMessages) {
            this._renderChatMsg(msg);
        }

        // 快捷回复按钮
        const replies = ['收到！', '加油！', '等我一下~', '👍'];
        for (let i = 0; i < replies.length; i++) {
            const r = replies[i];
            const btn = this._makeNode(`Reply_${i}`, right);
            btn.setPosition(new Vec3(-150 + i * 100, -210, 0));
            btn.addComponent(UITransform).setContentSize(new Size(90, 30));
            const bGfx = btn.addComponent(Graphics);
            bGfx.fillColor = new Color(60, 60, 100);
            bGfx.roundRect(-45, -15, 90, 30, 6);
            bGfx.fill();
            this._makeLabel(btn, 'RLbl', r, 12, new Color(200, 200, 230), Vec3.ZERO);
            btn.on(Node.EventType.TOUCH_END, () => {
                this._sendMessage(r);
            }, this);
        }
    }

    /** 发送聊天消息（演示） */
    private _sendMessage(text: string): void {
        const msg: ChatMsg = {
            sender: '掌柜(你)',
            text,
            time: this._getTime(),
            color: new Color(255, 215, 0),
        };
        this._chatMessages.push(msg);
        this._renderChatMsg(msg);
        Logger.info('GuildView', `发送消息: ${text}`);

        // 模拟回复
        this.scheduleOnce(() => {
            const names = ['刘掌柜', '陈大厨'];
            const replies = ['好的！', '明白了~', '哈哈', '没问题', '在路上了'];
            const autoMsg: ChatMsg = {
                sender: names[Math.floor(Math.random() * names.length)],
                text: replies[Math.floor(Math.random() * replies.length)],
                time: this._getTime(),
                color: new Color(33, 150, 243),
            };
            this._chatMessages.push(autoMsg);
            this._renderChatMsg(autoMsg);
        }, 1.5);
    }

    private _renderChatMsg(msg: ChatMsg): void {
        if (!this._chatArea) return;
        if (this._chatLabels.length >= this._maxChat) {
            const old = this._chatLabels.shift();
            if (old && old.node) {
                old.node.removeFromParent();
                old.node.destroy();
            }
        }
        // 重排
        for (let i = 0; i < this._chatLabels.length; i++) {
            this._chatLabels[i].node.setPosition(new Vec3(-190, 150 - i * 38, 0));
        }
        const y = 150 - this._chatLabels.length * 38;
        const lbl = this._makeLabel(this._chatArea, `Msg_${Date.now()}`,
            `[${msg.time}] ${msg.sender}: ${msg.text}`, 12,
            msg.color, new Vec3(-190, y, 0));
        lbl.horizontalAlign = HorizontalTextAlignment.LEFT;
        const ut = lbl.node.getComponent(UITransform);
        if (ut) ut.setContentSize(new Size(400, 30));
        this._chatLabels.push(lbl);
    }

    private _getTime(): string {
        const d = new Date();
        return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
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
