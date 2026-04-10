// 文件路径：assets/scripts/modules/setting/view/SettingView.ts

import { _decorator, Component, Node, Sprite, Label, Button, Toggle, Slider, tween, Vec3, UIOpacity } from 'cc';
import { Logger } from 'db://assets/scripts/core/utils/Logger';
import { EventManager } from 'db://assets/scripts/core/manager/EventManager';
import { AudioManager } from 'db://assets/scripts/core/manager/AudioManager';
import { Dialog } from 'db://assets/scripts/core/ui/Dialog';
import { director } from 'cc';

const { ccclass, property } = _decorator;

/**
 * 设置界面
 *
 * 节点层级：
 * SettingView
 * ├── Panel (Node)                 — 设置面板，居中，宽600
 * │   ├── TitleLabel (Label)       — "设置"
 * │   ├── CloseBtn (Button)        — 关闭按钮，右上角
 * │   ├── Section1 (Node)          — 音效设置
 * │   │   ├── Label (Label)        — "背景音乐"
 * │   │   └── Slider (Slider)      — 音量滑块
 * │   ├── Section2 (Node)          — 音效开关
 * │   │   ├── Label (Label)        — "音效"
 * │   │   └── Toggle (Toggle)      — 开关
 * │   ├── Section3 (Node)          — 通知开关
 * │   ├── Section4 (Node)          — 账号绑定
 * │   ├── Section5 (Node)          — 清除缓存
 * │   ├── Section6 (Node)          — 用户协议/隐私政策
 * │   ├── LogoutBtn (Button)       — 退出登录，红色文字
 * │   └── VersionLabel (Label)     — 版本号
 * └── Mask (Sprite)                — 半透明黑色遮罩，点击关闭
 */
@ccclass('SettingView')
export class SettingView extends Component {

    // ─── 面板 ────────────────────────────────────────────────

    @property(Node)
    panel: Node = null!;

    @property(Label)
    titleLabel: Label = null!;

    @property(Button)
    closeBtn: Button = null!;

    // ─── 音乐音效 ────────────────────────────────────────────

    @property(Node)
    section1: Node = null!;

    @property(Slider)
    bgmSlider: Slider = null!;

    @property(Node)
    section2: Node = null!;

    @property(Toggle)
    sfxToggle: Toggle = null!;

    // ─── 通知/账号/缓存/协议 ─────────────────────────────────

    @property(Node)
    section3: Node = null!;

    @property(Node)
    section4: Node = null!;

    @property(Node)
    section5: Node = null!;

    @property(Node)
    section6: Node = null!;

    // ─── 退出与版本 ──────────────────────────────────────────

    @property(Button)
    logoutBtn: Button = null!;

    @property(Label)
    versionLabel: Label = null!;

    // ─── 遮罩 ────────────────────────────────────────────────

    @property(Sprite)
    mask: Sprite = null!;

    // ─── 生命周期 ─────────────────────────────────────────────

    onLoad(): void {
        // 版本号
        if (this.versionLabel) {
            this.versionLabel.string = 'v1.0.0';
        }

        // 按钮事件
        this.closeBtn?.node.on('click', this._onClose, this);
        this.logoutBtn?.node.on('click', this._onLogout, this);

        // 遮罩点击关闭
        this.mask?.node.on(Node.EventType.TOUCH_END, this._onClose, this);

        // 音量滑块
        this.bgmSlider?.node.on('slide', this._onBgmSliderChange, this);

        // 音效开关
        this.sfxToggle?.node.on('toggle', this._onSfxToggle, this);

        // 初始化音量状态
        const audio = AudioManager.getInstance();
        if (this.bgmSlider) this.bgmSlider.progress = audio.bgmVolume;
        if (this.sfxToggle) this.sfxToggle.isChecked = !audio.isMuted;
    }

    onDestroy(): void {
        EventManager.getInstance().offAll(this);
    }

    // ─── 按钮回调 ─────────────────────────────────────────────

    private _onClose(): void {
        Logger.info('SettingView', '关闭设置');
        this.hide();
    }

    private _onLogout(): void {
        Logger.info('SettingView', '退出登录');
        Dialog.confirm({
            title: '确认退出',
            content: '确定要退出登录吗？',
            onConfirm: () => {
                this.hide();
                EventManager.getInstance().emit('player:logged:out');
                director.loadScene('login');
            },
        });
    }

    private _onBgmSliderChange(slider: Slider): void {
        const value = slider ? slider.progress : 0;
        Logger.debug('SettingView', `背景音乐音量: ${Math.floor(value * 100)}%`);
        this.onSliderChange(value);
    }

    private _onSfxToggle(toggle: Toggle): void {
        const isOn = toggle ? toggle.isChecked : false;
        Logger.debug('SettingView', `音效: ${isOn ? '开' : '关'}`);
        AudioManager.getInstance().setMute(!isOn);
    }

    // ─── 显示/隐藏 ───────────────────────────────────────────

    /** 显示设置面板（从底部弹出） */
    show(): void {
        this.node.active = true;
        if (this.panel) {
            this.panel.setPosition(new Vec3(0, -800, 0));
            tween(this.panel)
                .to(0.35, { position: new Vec3(0, 0, 0) }, { easing: 'backOut' })
                .start();
        }
        // 遮罩淡入
        if (this.mask) {
            const opacity = this.mask.node.getComponent(UIOpacity) || this.mask.node.addComponent(UIOpacity);
            opacity.opacity = 0;
            tween(opacity).to(0.25, { opacity: 180 }).start();
        }
    }

    /** 隐藏设置面板（向下收起） */
    hide(): void {
        if (this.panel) {
            tween(this.panel)
                .to(0.25, { position: new Vec3(0, -800, 0) }, { easing: 'sineIn' })
                .call(() => { this.node.active = false; })
                .start();
        } else {
            this.node.active = false;
        }
        // 遮罩淡出
        if (this.mask) {
            const opacity = this.mask.node.getComponent(UIOpacity) || this.mask.node.addComponent(UIOpacity);
            tween(opacity).to(0.25, { opacity: 0 }).start();
        }
    }

    // ─── 动画方法 ─────────────────────────────────────────────

    /** 实时更新音量 */
    onSliderChange(value: number): void {
        Logger.debug('SettingView', `音量更新: ${Math.floor(value * 100)}%`);
        AudioManager.getInstance().setBGMVolume(value);
    }
}
