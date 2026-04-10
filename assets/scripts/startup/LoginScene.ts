// 文件路径：assets/scripts/startup/LoginScene.ts

import {
    _decorator, Component, Node, Label, UITransform, Color, Size, Vec3,
    Graphics, Layers, director, HorizontalTextAlignment, VerticalTextAlignment,
    Overflow, tween, Tween
} from 'cc';
import { Logger } from 'db://assets/scripts/core/utils/Logger';

const { ccclass } = _decorator;

@ccclass('LoginScene')
export class LoginScene extends Component {

    private _wechatBtn: Node | null = null;
    private _phoneBtn: Node | null = null;
    private _guestBtn: Node | null = null;
    private _protocolChecked: boolean = false;
    private _protocolBox: Node | null = null;
    private _protocolGfx: Graphics | null = null;
    private _statusLabel: Label | null = null;
    private _maskNode: Node | null = null;
    private _maskLabel: Label | null = null;
    private _cloudNode1: Node | null = null;
    private _cloudNode2: Node | null = null;
    private _logoNode: Node | null = null;
    private _btnNodes: Node[] = [];

    onLoad(): void {
        this._buildUI();
        this._startCloudDrift();
    }

    onDestroy(): void {
        this.unscheduleAllCallbacks();
        if (this._cloudNode1) Tween.stopAllByTarget(this._cloudNode1);
        if (this._cloudNode2) Tween.stopAllByTarget(this._cloudNode2);
        if (this._logoNode) Tween.stopAllByTarget(this._logoNode);
    }

    // ─── UI 构建 ──────────────────────────────────────────────

    private _buildUI(): void {
        const root = this.node;

        // 背景
        const bg = this._makeNode('Background', root);
        bg.addComponent(UITransform).setContentSize(new Size(960, 640));
        const bgGfx = bg.addComponent(Graphics);
        bgGfx.fillColor = new Color(22, 33, 62);
        bgGfx.rect(-480, -320, 960, 640);
        bgGfx.fill();

        // 云层1 (装饰)
        this._cloudNode1 = this._makeNode('Cloud1', root);
        this._cloudNode1.setPosition(new Vec3(-200, 200, 0));
        this._cloudNode1.addComponent(UITransform).setContentSize(new Size(200, 40));
        const c1 = this._cloudNode1.addComponent(Graphics);
        c1.fillColor = new Color(255, 255, 255, 15);
        c1.ellipse(0, 0, 100, 20);
        c1.fill();

        // 云层2
        this._cloudNode2 = this._makeNode('Cloud2', root);
        this._cloudNode2.setPosition(new Vec3(300, 260, 0));
        this._cloudNode2.addComponent(UITransform).setContentSize(new Size(160, 30));
        const c2 = this._cloudNode2.addComponent(Graphics);
        c2.fillColor = new Color(255, 255, 255, 10);
        c2.ellipse(0, 0, 80, 15);
        c2.fill();

        // Logo
        this._logoNode = this._makeNode('Logo', root);
        this._logoNode.setPosition(new Vec3(0, 180, 0));
        this._logoNode.addComponent(UITransform).setContentSize(new Size(140, 140));
        const logoGfx = this._logoNode.addComponent(Graphics);
        logoGfx.fillColor = new Color(255, 215, 0, 50);
        logoGfx.circle(0, 0, 65);
        logoGfx.fill();
        logoGfx.strokeColor = new Color(255, 215, 0);
        logoGfx.lineWidth = 3;
        logoGfx.circle(0, 0, 65);
        logoGfx.stroke();

        // Logo文字
        this._makeLabel(this._logoNode, 'LogoText', '東', 52,
            new Color(255, 215, 0), Vec3.ZERO);

        // Logo呼吸
        tween(this._logoNode)
            .repeatForever(
                tween()
                    .to(1.5, { scale: new Vec3(1.05, 1.05, 1) }, { easing: 'sineInOut' })
                    .to(1.5, { scale: new Vec3(1, 1, 1) }, { easing: 'sineInOut' })
            )
            .start();

        // 标题
        this._makeLabel(root, 'Title', '东家食铺', 42,
            new Color(255, 215, 0), new Vec3(0, 80, 0));

        // 副标题
        this._makeLabel(root, 'Subtitle', '一段属于你的经营故事', 16,
            new Color(150, 150, 170), new Vec3(0, 45, 0));

        // 三个登录按钮
        this._wechatBtn = this._createLoginBtn('WechatBtn', '💬 微信登录',
            new Color(7, 193, 96), new Vec3(0, -30, 0));
        this._phoneBtn = this._createLoginBtn('PhoneBtn', '📱 手机登录',
            new Color(33, 150, 243), new Vec3(0, -90, 0));
        this._guestBtn = this._createLoginBtn('GuestBtn', '👤 游客登录',
            new Color(120, 120, 140), new Vec3(0, -150, 0));

        this._btnNodes = [this._wechatBtn, this._phoneBtn, this._guestBtn];

        // 绑定按钮
        this._wechatBtn.on(Node.EventType.TOUCH_END, () => this._onLogin('wechat'), this);
        this._phoneBtn.on(Node.EventType.TOUCH_END, () => this._onLogin('phone'), this);
        this._guestBtn.on(Node.EventType.TOUCH_END, () => this._onLogin('guest'), this);

        // 协议 Toggle
        const protocolRow = this._makeNode('ProtocolRow', root);
        protocolRow.setPosition(new Vec3(0, -210, 0));
        protocolRow.addComponent(UITransform).setContentSize(new Size(400, 30));

        // 勾选框
        this._protocolBox = this._makeNode('CheckBox', protocolRow);
        this._protocolBox.setPosition(new Vec3(-160, 0, 0));
        this._protocolBox.addComponent(UITransform).setContentSize(new Size(22, 22));
        this._protocolGfx = this._protocolBox.addComponent(Graphics);
        this._drawCheckBox(false);
        this._protocolBox.on(Node.EventType.TOUCH_END, this._toggleProtocol, this);

        // 协议文字
        this._makeLabel(protocolRow, 'ProtocolText', '我已阅读并同意《用户协议》和《隐私政策》',
            12, new Color(120, 120, 140), new Vec3(30, 0, 0));

        // 状态提示
        this._statusLabel = this._makeLabel(root, 'Status', '', 14,
            new Color(255, 80, 80), new Vec3(0, -250, 0));

        // 版本号
        this._makeLabel(root, 'Version', 'v1.0.0', 12,
            new Color(80, 80, 100), new Vec3(400, -290, 0));

        // 加载遮罩 (初始隐藏)
        this._maskNode = this._makeNode('LoadingMask', root);
        this._maskNode.addComponent(UITransform).setContentSize(new Size(960, 640));
        const maskGfx = this._maskNode.addComponent(Graphics);
        maskGfx.fillColor = new Color(0, 0, 0, 150);
        maskGfx.rect(-480, -320, 960, 640);
        maskGfx.fill();
        this._maskLabel = this._makeLabel(this._maskNode, 'MaskText', '正在登录…',
            22, Color.WHITE, Vec3.ZERO);
        this._maskNode.active = false;

        // 初始化：未同意协议则禁止登录
        this._updateBtnInteractable();
    }

    // ─── 登录逻辑 ─────────────────────────────────────────────

    private _onLogin(type: string): void {
        if (!this._protocolChecked) {
            if (this._statusLabel) {
                this._statusLabel.string = '请先同意用户协议';
                this._statusLabel.color = new Color(255, 180, 0);
            }
            return;
        }

        Logger.info('LoginScene', `${type} 登录开始`);

        if (type === 'guest') {
            // 游客直接跳转
            director.loadScene('main');
            return;
        }

        // 微信/手机：显示遮罩，2秒后跳转
        if (this._maskNode) this._maskNode.active = true;
        if (this._maskLabel) this._maskLabel.string = `正在 ${type === 'wechat' ? '微信' : '手机'} 登录…`;

        this.scheduleOnce(() => {
            Logger.info('LoginScene', `${type} 登录完成，进入主场景`);
            director.loadScene('main');
        }, 2);
    }

    // ─── 协议 Toggle ──────────────────────────────────────────

    private _toggleProtocol(): void {
        this._protocolChecked = !this._protocolChecked;
        this._drawCheckBox(this._protocolChecked);
        this._updateBtnInteractable();
        if (this._statusLabel) this._statusLabel.string = '';
        Logger.info('LoginScene', `协议 ${this._protocolChecked ? '已同意' : '未同意'}`);
    }

    private _drawCheckBox(checked: boolean): void {
        if (!this._protocolGfx) return;
        this._protocolGfx.clear();
        this._protocolGfx.strokeColor = new Color(150, 150, 170);
        this._protocolGfx.lineWidth = 2;
        this._protocolGfx.roundRect(-10, -10, 20, 20, 3);
        this._protocolGfx.stroke();
        if (checked) {
            this._protocolGfx.fillColor = new Color(76, 175, 80);
            this._protocolGfx.roundRect(-10, -10, 20, 20, 3);
            this._protocolGfx.fill();
        }
    }

    private _updateBtnInteractable(): void {
        const opacity = this._protocolChecked ? 255 : 100;
        for (const btn of this._btnNodes) {
            const gfx = btn.getComponent(Graphics);
            if (gfx) {
                gfx.node.getComponent(UITransform)!.node.setScale(
                    new Vec3(this._protocolChecked ? 1 : 0.95,
                             this._protocolChecked ? 1 : 0.95, 1));
            }
        }
    }

    // ─── 云漂移 ───────────────────────────────────────────────

    private _startCloudDrift(): void {
        if (this._cloudNode1) {
            tween(this._cloudNode1)
                .repeatForever(
                    tween()
                        .to(12, { position: new Vec3(600, 200, 0) }, { easing: 'linear' })
                        .call(() => { this._cloudNode1!.setPosition(-600, 200, 0); })
                )
                .start();
        }
        if (this._cloudNode2) {
            tween(this._cloudNode2)
                .repeatForever(
                    tween()
                        .to(18, { position: new Vec3(700, 260, 0) }, { easing: 'linear' })
                        .call(() => { this._cloudNode2!.setPosition(-700, 260, 0); })
                )
                .start();
        }
    }

    // ─── 工具方法 ──────────────────────────────────────────────

    private _createLoginBtn(name: string, text: string, color: Color, pos: Vec3): Node {
        const btn = this._makeNode(name, this.node);
        btn.setPosition(pos);
        btn.addComponent(UITransform).setContentSize(new Size(260, 46));
        const gfx = btn.addComponent(Graphics);
        gfx.fillColor = color;
        gfx.roundRect(-130, -23, 260, 46, 8);
        gfx.fill();
        this._makeLabel(btn, 'Lbl', text, 18, Color.WHITE, Vec3.ZERO);
        return btn;
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
