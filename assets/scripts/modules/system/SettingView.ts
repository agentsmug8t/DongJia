// 文件路径：assets/scripts/modules/system/SettingView.ts

import {
    _decorator, Component, Node, Label, UITransform, Color, Size, Vec3,
    Graphics, Layers, HorizontalTextAlignment, VerticalTextAlignment, Overflow, tween, director
} from 'cc';
import { Logger } from 'db://assets/scripts/core/utils/Logger';

const { ccclass } = _decorator;

@ccclass('SettingView')
export class SettingView extends Component {

    private _toggleStates: Map<string, boolean> = new Map();
    private _confirmNode: Node | null = null;

    onLoad(): void {
        this._toggleStates.set('bgm', true);
        this._toggleStates.set('sfx', true);
        this._toggleStates.set('notify', true);
        this._toggleStates.set('vibrate', false);
        this._buildUI();
    }

    onDestroy(): void {
        if (this._confirmNode) {
            this._confirmNode.removeFromParent();
            this._confirmNode.destroy();
            this._confirmNode = null;
        }
    }

    private _buildUI(): void {
        // 标题
        this._makeLabel(this.node, 'Title', '⚙ 设置', 20,
            new Color(255, 240, 200), new Vec3(0, 240, 0));

        // ━━━ 声音设置 ━━━
        this._buildSection('声音设置', 170, [
            { key: 'bgm', label: '🎵 背景音乐', on: true },
            { key: 'sfx', label: '🔊 音效', on: true },
        ]);

        // ━━━ 通知设置 ━━━
        this._buildSection('通知设置', 30, [
            { key: 'notify', label: '📬 推送通知', on: true },
            { key: 'vibrate', label: '📳 震动反馈', on: false },
        ]);

        // ━━━ 其他操作 ━━━
        const opY = -120;
        this._makeLabel(this.node, 'OpTitle', '其他操作', 13,
            new Color(150, 150, 170), new Vec3(-350, opY + 30, 0));

        const ops = [
            { text: '🗑 清除缓存', color: new Color(255, 152, 0), action: () => this._showConfirm('确定要清除缓存吗？', () => Logger.info('Setting', '缓存已清除')) },
            { text: '📋 用户协议', color: new Color(100, 100, 140), action: () => Logger.info('Setting', '查看用户协议') },
            { text: '🔒 隐私政策', color: new Color(100, 100, 140), action: () => Logger.info('Setting', '查看隐私政策') },
            { text: '📧 联系客服', color: new Color(33, 150, 243), action: () => Logger.info('Setting', '联系客服') },
        ];

        for (let i = 0; i < ops.length; i++) {
            const op = ops[i];
            const btn = this._makeNode(`Op_${i}`, this.node);
            btn.setPosition(new Vec3(-200 + i * 150, opY - 20, 0));
            btn.addComponent(UITransform).setContentSize(new Size(130, 36));
            const bGfx = btn.addComponent(Graphics);
            bGfx.fillColor = op.color;
            bGfx.roundRect(-65, -18, 130, 36, 8);
            bGfx.fill();
            this._makeLabel(btn, 'BLbl', op.text, 12, Color.WHITE, Vec3.ZERO);
            btn.on(Node.EventType.TOUCH_END, () => {
                tween(btn).to(0.05, { scale: new Vec3(0.92, 0.92, 1) })
                    .to(0.1, { scale: new Vec3(1, 1, 1) })
                    .call(op.action).start();
            }, this);
        }

        // ━━━ 退出登录 ━━━
        const logoutBtn = this._makeNode('Logout', this.node);
        logoutBtn.setPosition(new Vec3(0, -210, 0));
        logoutBtn.addComponent(UITransform).setContentSize(new Size(200, 40));
        const lgGfx = logoutBtn.addComponent(Graphics);
        lgGfx.fillColor = new Color(183, 28, 28);
        lgGfx.roundRect(-100, -20, 200, 40, 8);
        lgGfx.fill();
        this._makeLabel(logoutBtn, 'LgLbl', '🚪 退出登录', 15, Color.WHITE, Vec3.ZERO);
        logoutBtn.on(Node.EventType.TOUCH_END, () => {
            this._showConfirm('确定要退出登录吗？', () => {
                Logger.info('Setting', '退出登录');
                director.loadScene('login');
            });
        }, this);

        // 版本号
        this._makeLabel(this.node, 'Ver', 'v1.0.0-demo  |  东家·食府经营', 10,
            new Color(80, 80, 100), new Vec3(0, -260, 0));
    }

    // ─── 开关分组 ────────────────────────────────────────────

    private _buildSection(title: string, startY: number,
        items: { key: string; label: string; on: boolean }[]): void {

        this._makeLabel(this.node, `Sec_${title}`, title, 13,
            new Color(150, 150, 170), new Vec3(-350, startY + 30, 0));

        const secBg = this._makeNode(`SecBg_${title}`, this.node);
        secBg.setPosition(new Vec3(0, startY - 15, 0));
        secBg.addComponent(UITransform).setContentSize(new Size(700, items.length * 50 + 10));
        const sbGfx = secBg.addComponent(Graphics);
        sbGfx.fillColor = new Color(25, 25, 55, 160);
        sbGfx.roundRect(-350, -(items.length * 50 + 10) / 2, 700, items.length * 50 + 10, 8);
        sbGfx.fill();

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const y = startY - i * 50;
            this._makeToggleRow(item.key, item.label, y, item.on);
        }
    }

    private _makeToggleRow(key: string, label: string, y: number, defaultOn: boolean): void {
        this._toggleStates.set(key, defaultOn);

        this._makeLabel(this.node, `Tog_${key}_Lbl`, label, 14,
            new Color(220, 220, 240), new Vec3(-100, y, 0));

        // 开关轨道
        const track = this._makeNode(`Track_${key}`, this.node);
        track.setPosition(new Vec3(250, y, 0));
        track.addComponent(UITransform).setContentSize(new Size(50, 26));

        // 开关圆点
        const thumb = this._makeNode(`Thumb_${key}`, track);
        thumb.addComponent(UITransform).setContentSize(new Size(20, 20));

        this._drawToggle(track, thumb, key, defaultOn);

        track.on(Node.EventType.TOUCH_END, () => {
            const current = this._toggleStates.get(key) ?? false;
            const next = !current;
            this._toggleStates.set(key, next);
            this._drawToggle(track, thumb, key, next);
            Logger.info('Setting', `${label}: ${next ? '开' : '关'}`);
        }, this);
    }

    private _drawToggle(track: Node, thumb: Node, key: string, on: boolean): void {
        // 清除旧图形
        let tGfx = track.getComponent(Graphics);
        if (tGfx) tGfx.clear();
        else tGfx = track.addComponent(Graphics);

        tGfx.fillColor = on ? new Color(76, 175, 80) : new Color(80, 80, 100);
        tGfx.roundRect(-25, -13, 50, 26, 13);
        tGfx.fill();

        // 圆点
        let thGfx = thumb.getComponent(Graphics);
        if (thGfx) thGfx.clear();
        else thGfx = thumb.addComponent(Graphics);

        const thumbX = on ? 12 : -12;
        tween(thumb).to(0.12, { position: new Vec3(thumbX, 0, 0) }).start();
        thGfx.fillColor = Color.WHITE;
        thGfx.circle(0, 0, 9);
        thGfx.fill();
    }

    // ─── 确认对话框 ──────────────────────────────────────────

    private _showConfirm(message: string, onYes: () => void): void {
        if (this._confirmNode) {
            this._confirmNode.removeFromParent();
            this._confirmNode.destroy();
        }

        const overlay = this._makeNode('Confirm', this.node);
        overlay.setPosition(Vec3.ZERO);
        overlay.addComponent(UITransform).setContentSize(new Size(960, 640));
        this._confirmNode = overlay;

        // 遮罩
        const mask = overlay.addComponent(Graphics);
        mask.fillColor = new Color(0, 0, 0, 160);
        mask.rect(-480, -320, 960, 640);
        mask.fill();
        overlay.on(Node.EventType.TOUCH_END, () => { /* 拦截 */ }, this);

        // 对话框
        const dlg = this._makeNode('Dlg', overlay);
        dlg.setPosition(Vec3.ZERO);
        dlg.addComponent(UITransform).setContentSize(new Size(360, 180));
        const dGfx = dlg.addComponent(Graphics);
        dGfx.fillColor = new Color(35, 35, 65, 240);
        dGfx.lineWidth = 2;
        dGfx.strokeColor = new Color(255, 215, 0, 80);
        dGfx.roundRect(-180, -90, 360, 180, 12);
        dGfx.fill();
        dGfx.stroke();

        this._makeLabel(dlg, 'Msg', message, 15,
            new Color(220, 220, 240), new Vec3(0, 30, 0));

        // 确认按钮
        const yesBtn = this._makeNode('Yes', dlg);
        yesBtn.setPosition(new Vec3(-70, -40, 0));
        yesBtn.addComponent(UITransform).setContentSize(new Size(100, 36));
        const yGfx = yesBtn.addComponent(Graphics);
        yGfx.fillColor = new Color(183, 28, 28);
        yGfx.roundRect(-50, -18, 100, 36, 8);
        yGfx.fill();
        this._makeLabel(yesBtn, 'YLbl', '确定', 14, Color.WHITE, Vec3.ZERO);
        yesBtn.on(Node.EventType.TOUCH_END, () => {
            onYes();
            this._hideConfirm();
        }, this);

        // 取消按钮
        const noBtn = this._makeNode('No', dlg);
        noBtn.setPosition(new Vec3(70, -40, 0));
        noBtn.addComponent(UITransform).setContentSize(new Size(100, 36));
        const nGfx = noBtn.addComponent(Graphics);
        nGfx.fillColor = new Color(80, 80, 110);
        nGfx.roundRect(-50, -18, 100, 36, 8);
        nGfx.fill();
        this._makeLabel(noBtn, 'NLbl', '取消', 14, Color.WHITE, Vec3.ZERO);
        noBtn.on(Node.EventType.TOUCH_END, () => this._hideConfirm(), this);

        // 入场动画
        dlg.setScale(new Vec3(0.8, 0.8, 1));
        tween(dlg).to(0.15, { scale: new Vec3(1, 1, 1) }).start();
    }

    private _hideConfirm(): void {
        if (this._confirmNode) {
            this._confirmNode.removeFromParent();
            this._confirmNode.destroy();
            this._confirmNode = null;
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
