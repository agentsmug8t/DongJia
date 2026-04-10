// 文件路径：assets/scripts/scenes/LoginScene.ts

import { _decorator, Component, Node, Sprite, Label, Button, Toggle, tween, Tween, Vec3, UIOpacity, director } from 'cc';
import { Logger } from 'db://assets/scripts/core/utils/Logger';
import { NetworkManager } from 'db://assets/scripts/core/manager/NetworkManager';
import { EventManager } from 'db://assets/scripts/core/manager/EventManager';
import { PlayerEvent } from 'db://assets/scripts/core/constants/EventTypes';

const { ccclass, property } = _decorator;

/**
 * 登录场景
 *
 * 节点层级：
 * Canvas
 * ├── Background (Sprite)          — 占位：深棕色渐变
 * ├── CloudLayer (Node)            — 预留云层动画
 * ├── TitleContainer (Node)        — 居中偏上
 * │   ├── Title (Label)            — "东家"，字号56，金色
 * │   └── Subtitle (Label)         — "我在古代当老板"，字号24，米色
 * ├── LoginPanel (Node)            — 居中偏下
 * │   ├── WechatBtn (Button)       — 绿色，"微信登录"
 * │   ├── PhoneBtn (Button)        — 白色边框，"手机号登录"
 * │   ├── GuestBtn (Button)        — 透明，"游客体验"
 * │   └── AgreementToggle (Toggle) — 勾选框 + 用户协议
 * ├── LoadingMask (Node)           — 登录中遮罩，默认隐藏
 * └── BottomText (Label)           — "© 2026 东家"
 */
@ccclass('LoginScene')
export class LoginScene extends Component {

    // ─── UI 节点 ──────────────────────────────────────────────

    @property(Sprite)
    background: Sprite = null!;

    @property(Node)
    cloudLayer: Node = null!;

    @property(Node)
    titleContainer: Node = null!;

    @property(Label)
    title: Label = null!;

    @property(Label)
    subtitle: Label = null!;

    @property(Node)
    loginPanel: Node = null!;

    @property(Button)
    wechatBtn: Button = null!;

    @property(Button)
    phoneBtn: Button = null!;

    @property(Button)
    guestBtn: Button = null!;

    @property(Toggle)
    agreementToggle: Toggle = null!;

    @property(Node)
    loadingMask: Node = null!;

    @property(Label)
    bottomText: Label = null!;

    // ─── 生命周期 ─────────────────────────────────────────────

    onLoad(): void {
        // 初始隐藏加载遮罩
        if (this.loadingMask) {
            this.loadingMask.active = false;
        }

        // 绑定按钮事件
        this.wechatBtn?.node.on('click', this._onWechatLogin, this);
        this.phoneBtn?.node.on('click', this._onPhoneLogin, this);
        this.guestBtn?.node.on('click', this._onGuestLogin, this);

        // 监听登录成功事件
        EventManager.getInstance().on(PlayerEvent.LoggedIn, this._onLoginSuccess, this);
    }

    onDestroy(): void {
        EventManager.getInstance().offAll(this);
    }

    // ─── 按钮事件 ─────────────────────────────────────────────

    private _onWechatLogin(): void {
        if (!this._checkAgreement()) return;
        Logger.info('LoginScene', '微信登录');
        this.showLoading();
        // TODO: 接入微信 SDK
    }

    private _onPhoneLogin(): void {
        if (!this._checkAgreement()) return;
        Logger.info('LoginScene', '手机号登录');
        // TODO: 弹出手机号输入面板
    }

    private _onGuestLogin(): void {
        if (!this._checkAgreement()) return;
        Logger.info('LoginScene', '游客登录');
        this.showLoading();
        // TODO: 发送游客登录请求
    }

    private _checkAgreement(): boolean {
        if (this.agreementToggle && !this.agreementToggle.isChecked) {
            Logger.warn('LoginScene', '请先同意用户协议');
            return false;
        }
        return true;
    }

    private _onLoginSuccess(): void {
        Logger.info('LoginScene', '登录成功，切换到主场景');
        this.transitionToMain();
    }

    // ─── 内部状态 ─────────────────────────────────────────────

    private _cloudTween: Tween<Node> | null = null;

    // ─── 动画方法 ─────────────────────────────────────────────

    /** CloudLayer 缓慢横向移动 */
    playCloudDrift(): void {
        if (!this.cloudLayer) return;
        const startX = this.cloudLayer.position.x;
        this._cloudTween = tween(this.cloudLayer)
            .to(8, { position: new Vec3(startX + 200, this.cloudLayer.position.y, 0) }, { easing: 'linear' })
            .to(8, { position: new Vec3(startX, this.cloudLayer.position.y, 0) }, { easing: 'linear' })
            .union()
            .repeatForever()
            .start();
    }

    /** Title 淡入+上浮 */
    playTitleEnter(): void {
        if (!this.titleContainer) return;
        const targetY = this.titleContainer.position.y;
        this.titleContainer.setPosition(this.titleContainer.position.x, targetY - 50, 0);
        const opacity = this.titleContainer.getComponent(UIOpacity) || this.titleContainer.addComponent(UIOpacity);
        opacity.opacity = 0;
        tween(this.titleContainer)
            .to(0.8, { position: new Vec3(this.titleContainer.position.x, targetY, 0) }, { easing: 'backOut' })
            .start();
        tween(opacity)
            .to(0.6, { opacity: 255 })
            .start();
    }

    /** LoadingMask 显示 */
    showLoading(): void {
        if (!this.loadingMask) return;
        this.loadingMask.active = true;
        const opacity = this.loadingMask.getComponent(UIOpacity) || this.loadingMask.addComponent(UIOpacity);
        opacity.opacity = 0;
        tween(opacity)
            .to(0.3, { opacity: 255 })
            .start();
    }

    /** 登录成功后的场景切换 */
    transitionToMain(): void {
        const opacity = this.node.getComponent(UIOpacity) || this.node.addComponent(UIOpacity);
        tween(opacity)
            .to(0.5, { opacity: 0 })
            .call(() => {
                director.loadScene('main');
            })
            .start();
    }

    onDestroy(): void {
        this._cloudTween?.stop();
        EventManager.getInstance().offAll(this);
    }
}
