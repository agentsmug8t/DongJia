// 文件路径：assets/scripts/modules/npc/view/NPCDialogView.ts

import {
    _decorator, Component, Node, Label, UITransform, Color, Size, Vec3,
    Graphics, Layers, HorizontalTextAlignment, VerticalTextAlignment, Overflow, tween, Vec2
} from 'cc';
import { Logger } from 'db://assets/scripts/core/utils/Logger';
import { NPCData } from 'db://assets/scripts/modules/npc/view/NPCCard';

const { ccclass } = _decorator;

@ccclass('NPCDialogView')
export class NPCDialogView extends Component {

    private _npcData: NPCData | null = null;
    private _chatArea: Node | null = null;
    private _chatLabels: Label[] = [];
    private _maxChatLines = 6;
    private _affLbl: Label | null = null;

    /** 显示 NPC 对话弹窗 */
    show(data: NPCData): void {
        this._npcData = data;
        this.node.removeAllChildren();
        this.node.active = true;
        this._build();
        // 入场动画
        this.node.setScale(new Vec3(0.8, 0.8, 1));
        tween(this.node).to(0.2, { scale: new Vec3(1, 1, 1) }).start();
    }

    hide(): void {
        tween(this.node).to(0.15, { scale: new Vec3(0.8, 0.8, 1) }).call(() => {
            this.node.active = false;
            this.node.removeAllChildren();
        }).start();
    }

    private _build(): void {
        const data = this._npcData;
        if (!data) return;

        // 半透明遮罩
        const mask = this._makeNode('Mask', this.node);
        mask.setPosition(Vec3.ZERO);
        mask.addComponent(UITransform).setContentSize(new Size(960, 640));
        const mGfx = mask.addComponent(Graphics);
        mGfx.fillColor = new Color(0, 0, 0, 150);
        mGfx.rect(-480, -320, 960, 640);
        mGfx.fill();
        mask.on(Node.EventType.TOUCH_END, () => { /* 拦截点击 */ }, this);

        // 对话框面板
        const panel = this._makeNode('Panel', this.node);
        panel.setPosition(new Vec3(0, 0, 0));
        panel.addComponent(UITransform).setContentSize(new Size(600, 440));
        const pGfx = panel.addComponent(Graphics);
        pGfx.fillColor = new Color(30, 30, 60, 240);
        pGfx.lineWidth = 2;
        pGfx.strokeColor = new Color(255, 215, 0, 100);
        pGfx.roundRect(-300, -220, 600, 440, 12);
        pGfx.fill();
        pGfx.stroke();

        // ─── 顶部 NPC 信息 ─────────────────────────────────
        // 头像
        const avatar = this._makeNode('Avatar', panel);
        avatar.setPosition(new Vec3(-230, 170, 0));
        avatar.addComponent(UITransform).setContentSize(new Size(60, 60));
        const aGfx = avatar.addComponent(Graphics);
        aGfx.fillColor = data.avatarColor;
        aGfx.circle(0, 0, 28);
        aGfx.fill();
        const aLbl = this._makeLabel(avatar, 'Char', data.name[0], 22,
            Color.WHITE, Vec3.ZERO);

        // 名字 + 角色 + 等级
        this._makeLabel(panel, 'Name', data.name, 18,
            new Color(255, 240, 200), new Vec3(-140, 185, 0));
        this._makeLabel(panel, 'Role', `${data.role} · Lv.${data.level}`, 12,
            new Color(150, 150, 170), new Vec3(-140, 162, 0));

        // 好感度
        this._makeLabel(panel, 'AffLbl', '好感度', 11,
            new Color(130, 130, 150), new Vec3(140, 185, 0));
        // 好感度进度条背景
        const affBg = this._makeNode('AffBg', panel);
        affBg.setPosition(new Vec3(180, 165, 0));
        affBg.addComponent(UITransform).setContentSize(new Size(120, 10));
        const abGfx = affBg.addComponent(Graphics);
        abGfx.fillColor = new Color(60, 60, 80);
        abGfx.roundRect(-60, -5, 120, 10, 5);
        abGfx.fill();
        // 好感度进度条
        const affFill = this._makeNode('AffFill', panel);
        affFill.setPosition(new Vec3(180, 165, 0));
        affFill.addComponent(UITransform).setContentSize(new Size(120, 10));
        const afGfx = affFill.addComponent(Graphics);
        const fillW = Math.floor(120 * data.affection / 100);
        afGfx.fillColor = new Color(255, 105, 180);
        afGfx.roundRect(-60, -5, fillW, 10, 5);
        afGfx.fill();
        this._affLbl = this._makeLabel(panel, 'AffVal', `${data.affection}/100`, 11,
            new Color(255, 180, 220), new Vec3(260, 165, 0));

        // 描述
        this._makeLabel(panel, 'Desc', `"${data.desc}"`, 12,
            new Color(170, 170, 190), new Vec3(0, 135, 0));

        // 分隔线
        const sep = this._makeNode('Sep', panel);
        sep.setPosition(new Vec3(0, 118, 0));
        sep.addComponent(UITransform).setContentSize(new Size(540, 2));
        const sGfx = sep.addComponent(Graphics);
        sGfx.fillColor = new Color(255, 215, 0, 40);
        sGfx.rect(-270, -1, 540, 2);
        sGfx.fill();

        // ─── 聊天区域 ──────────────────────────────────────
        this._chatArea = this._makeNode('ChatArea', panel);
        this._chatArea.setPosition(new Vec3(0, -10, 0));
        this._chatArea.addComponent(UITransform).setContentSize(new Size(540, 220));
        const caBg = this._chatArea.addComponent(Graphics);
        caBg.fillColor = new Color(20, 20, 45, 120);
        caBg.roundRect(-270, -110, 540, 220, 6);
        caBg.fill();
        this._chatLabels = [];

        // 初始对话
        this._addChat('系统', `你来到了${data.name}面前。`, new Color(255, 215, 0, 180));
        if (data.dialogues.length > 0) {
            this._addChat(data.name, data.dialogues[0], new Color(200, 230, 255));
        }

        // ─── 底部按钮栏 ─────────────────────────────────────
        const btnY = -185;
        // 闲聊
        this._makeButton(panel, '💬 闲聊', new Vec3(-200, btnY, 0), new Color(33, 150, 243),
            () => this._doChat());
        // 送礼
        this._makeButton(panel, '🎁 送礼', new Vec3(-60, btnY, 0), new Color(233, 30, 99),
            () => this._doGift());
        // 接单
        this._makeButton(panel, '📋 接单', new Vec3(80, btnY, 0), new Color(76, 175, 80),
            () => this._doOrder());
        // 关闭
        this._makeButton(panel, '✖ 关闭', new Vec3(200, btnY, 0), new Color(100, 100, 120),
            () => this.hide());
    }

    /** 闲聊：随机对话 + 好感度 +1 */
    private _doChat(): void {
        const data = this._npcData;
        if (!data) return;
        const dlg = data.dialogues;
        const randomLine = dlg[Math.floor(Math.random() * dlg.length)];
        this._addChat(data.name, randomLine, new Color(200, 230, 255));
        // 好感度 +1
        data.affection = Math.min(100, data.affection + 1);
        if (this._affLbl) this._affLbl.string = `${data.affection}/100`;
        this._addChat('系统', `好感度 +1 (${data.affection}/100)`, new Color(255, 215, 0, 180));
        Logger.info('NPCDialog', `闲聊 ${data.name}, 好感度 ${data.affection}`);
    }

    /** 送礼演示 */
    private _doGift(): void {
        const data = this._npcData;
        if (!data) return;
        data.affection = Math.min(100, data.affection + 5);
        if (this._affLbl) this._affLbl.string = `${data.affection}/100`;
        this._addChat('你', '送出了一份礼物', new Color(180, 255, 180));
        this._addChat(data.name, '谢谢掌柜，太贴心了！', new Color(200, 230, 255));
        this._addChat('系统', `好感度 +5 (${data.affection}/100)`, new Color(255, 215, 0, 180));
        Logger.info('NPCDialog', `送礼 ${data.name}, 好感度 ${data.affection}`);
    }

    /** 接单演示 */
    private _doOrder(): void {
        const data = this._npcData;
        if (!data) return;
        this._addChat(data.name, '好的，我这就去准备！', new Color(200, 230, 255));
        this._addChat('系统', `${data.name} 已接受任务`, new Color(100, 255, 100));
        Logger.info('NPCDialog', `接单 ${data.name}`);
    }

    /** 添加一行聊天记录 */
    private _addChat(speaker: string, text: string, color: Color): void {
        if (!this._chatArea) return;
        // 超过上限移除最早的
        if (this._chatLabels.length >= this._maxChatLines) {
            const old = this._chatLabels.shift();
            if (old && old.node) {
                old.node.removeFromParent();
                old.node.destroy();
            }
        }
        // 重新排列位置
        for (let i = 0; i < this._chatLabels.length; i++) {
            this._chatLabels[i].node.setPosition(new Vec3(-250, 90 - i * 32, 0));
        }
        const y = 90 - this._chatLabels.length * 32;
        const lbl = this._makeLabel(this._chatArea, `Chat_${Date.now()}`,
            `[${speaker}] ${text}`, 12, color, new Vec3(-250, y, 0));
        lbl.horizontalAlign = HorizontalTextAlignment.LEFT;
        const ut = lbl.node.getComponent(UITransform);
        if (ut) ut.setContentSize(new Size(500, 26));
        this._chatLabels.push(lbl);
    }

    // ─── 工具 ─────────────────────────────────────────────────

    private _makeButton(parent: Node, text: string, pos: Vec3,
        bgColor: Color, onClick: () => void): void {
        const btn = this._makeNode('Btn', parent);
        btn.setPosition(pos);
        btn.addComponent(UITransform).setContentSize(new Size(110, 36));
        const bg = btn.addComponent(Graphics);
        bg.fillColor = bgColor;
        bg.roundRect(-55, -18, 110, 36, 8);
        bg.fill();
        this._makeLabel(btn, 'BLbl', text, 13, Color.WHITE, Vec3.ZERO);
        btn.on(Node.EventType.TOUCH_END, () => {
            // 按钮点击反馈
            tween(btn).to(0.05, { scale: new Vec3(0.92, 0.92, 1) })
                .to(0.1, { scale: new Vec3(1, 1, 1) })
                .call(onClick).start();
        }, this);
    }

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
