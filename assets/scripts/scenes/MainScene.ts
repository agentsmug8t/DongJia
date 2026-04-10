// 文件路径：assets/scripts/scenes/MainScene.ts

import { _decorator, Component, Node, Sprite, Label, Button, Toggle, Color, tween, Vec3 } from 'cc';
import { Logger } from 'db://assets/scripts/core/utils/Logger';
import { EventManager } from 'db://assets/scripts/core/manager/EventManager';
import { PlayerEvent } from 'db://assets/scripts/core/constants/EventTypes';
import { PlayerModel } from 'db://assets/scripts/modules/player/model/PlayerModel';
import { UIManager } from 'db://assets/scripts/core/manager/UIManager';

const { ccclass, property } = _decorator;

/**
 * 主场景容器
 *
 * 节点层级：
 * Canvas
 * ├── Background (Sprite)          — 动态背景（白天#E8D5B5）
 * ├── ContentContainer (Node)      — 主内容区，动态加载 View
 * ├── TopBar (Node)                — 顶部状态栏，高120
 * │   ├── AvatarBtn (Button)       — 圆形头像，直径80
 * │   ├── InfoContainer (Node)
 * │   │   ├── NicknameLabel (Label)— "掌柜"
 * │   │   └── LevelLabel (Label)   — "Lv.1"
 * │   ├── CurrencyContainer (Node)
 * │   │   ├── CopperIcon (Sprite)  — 铜钱图标（黄色圆形）
 * │   │   ├── CopperLabel (Label)  — "1000"
 * │   │   ├── SilverIcon (Sprite)  — 银两图标（银色圆形）
 * │   │   └── SilverLabel (Label)  — "0"
 * │   └── SettingsBtn (Button)     — 设置按钮
 * ├── BottomBar (Node)             — 底部导航栏，高100
 * │   ├── HomeTab (Toggle)         — 首页
 * │   ├── ShopTab (Toggle)         — 商铺
 * │   ├── MessageTab (Toggle)      — 消息
 * │   ├── GuildTab (Toggle)        — 联盟
 * │   └── MineTab (Toggle)         — 我的
 * └── PopupLayer (Node)            — 弹窗层
 */
@ccclass('MainScene')
export class MainScene extends Component {

    // ─── 背景与容器 ──────────────────────────────────────────

    @property(Sprite)
    background: Sprite = null!;

    @property(Node)
    contentContainer: Node = null!;

    @property(Node)
    popupLayer: Node = null!;

    // ─── 顶部状态栏 ──────────────────────────────────────────

    @property(Node)
    topBar: Node = null!;

    @property(Button)
    avatarBtn: Button = null!;

    @property(Label)
    nicknameLabel: Label = null!;

    @property(Label)
    levelLabel: Label = null!;

    @property(Sprite)
    copperIcon: Sprite = null!;

    @property(Label)
    copperLabel: Label = null!;

    @property(Sprite)
    silverIcon: Sprite = null!;

    @property(Label)
    silverLabel: Label = null!;

    @property(Button)
    settingsBtn: Button = null!;

    // ─── 底部导航栏 ──────────────────────────────────────────

    @property(Node)
    bottomBar: Node = null!;

    @property(Toggle)
    homeTab: Toggle = null!;

    @property(Toggle)
    shopTab: Toggle = null!;

    @property(Toggle)
    messageTab: Toggle = null!;

    @property(Toggle)
    guildTab: Toggle = null!;

    @property(Toggle)
    mineTab: Toggle = null!;

    // ─── 内部状态 ─────────────────────────────────────────────

    private _currentTabIndex: number = 0;

    // ─── 生命周期 ─────────────────────────────────────────────

    onLoad(): void {
        // 按钮事件
        this.avatarBtn?.node.on('click', this._onAvatarClick, this);
        this.settingsBtn?.node.on('click', this._onSettingsClick, this);

        // 导航栏 Tab 事件
        this.homeTab?.node.on('toggle', () => this._onTabSwitch(0), this);
        this.shopTab?.node.on('toggle', () => this._onTabSwitch(1), this);
        this.messageTab?.node.on('toggle', () => this._onTabSwitch(2), this);
        this.guildTab?.node.on('toggle', () => this._onTabSwitch(3), this);
        this.mineTab?.node.on('toggle', () => this._onTabSwitch(4), this);

        // 网络事件监听
        const em = EventManager.getInstance();
        em.on(PlayerEvent.CopperChanged, this._onCopperChanged, this);
        em.on(PlayerEvent.SilverChanged, this._onSilverChanged, this);
        em.on(PlayerEvent.LevelUp, this._onLevelUp, this);
        em.on(PlayerEvent.DataUpdated, this._onPlayerDataUpdated, this);
    }

    onDestroy(): void {
        EventManager.getInstance().offAll(this);
    }

    // ─── Tab 切换 ─────────────────────────────────────────────

    private _onTabSwitch(index: number): void {
        if (this._currentTabIndex === index) return;
        this._currentTabIndex = index;
        const tabNames = ['首页', '商铺', '消息', '联盟', '我的'];
        Logger.info('MainScene', `切换到: ${tabNames[index]}`);
        this.switchTab(index);
    }

    // ─── 按钮回调 ─────────────────────────────────────────────

    private _onAvatarClick(): void {
        Logger.info('MainScene', '打开玩家信息');
        UIManager.getInstance().open('player/PlayerInfoView');
    }

    private _onSettingsClick(): void {
        Logger.info('MainScene', '打开设置');
        UIManager.getInstance().open('setting/SettingView');
    }

    // ─── 网络事件回调 ─────────────────────────────────────────

    private _onCopperChanged(copper: number): void {
        if (this.copperLabel) {
            this.copperLabel.string = String(copper);
        }
        this.updateCopperDisplay(copper);
    }

    private _onSilverChanged(silver: number): void {
        if (this.silverLabel) {
            this.silverLabel.string = String(silver);
        }
    }

    private _onLevelUp(level: number): void {
        if (this.levelLabel) {
            this.levelLabel.string = `Lv.${level}`;
        }
    }

    private _onPlayerDataUpdated(): void {
        const player = PlayerModel.getInstance();
        if (this.nicknameLabel) this.nicknameLabel.string = player.nickname || '掌柜';
        if (this.levelLabel) this.levelLabel.string = `Lv.${player.level}`;
        if (this.copperLabel) this.copperLabel.string = String(player.copper);
        if (this.silverLabel) this.silverLabel.string = String(player.silver);
    }

    // ─── 动画方法 ─────────────────────────────────────────────

    /** 底部Tab图标变色+弹跳动效 */
    switchTab(index: number): void {
        const tabs = [this.homeTab, this.shopTab, this.messageTab, this.guildTab, this.mineTab];
        for (let i = 0; i < tabs.length; i++) {
            if (!tabs[i]) continue;
            if (i === index) {
                tween(tabs[i]!.node)
                    .to(0.15, { scale: new Vec3(1.2, 1.2, 1) }, { easing: 'backOut' })
                    .to(0.1, { scale: new Vec3(1, 1, 1) })
                    .start();
            } else {
                tabs[i]!.node.setScale(1, 1, 1);
            }
        }
    }

    /** 数值跳动动画 */
    updateCopperDisplay(value: number): void {
        if (!this.copperLabel) return;
        const startVal = parseInt(this.copperLabel.string) || 0;
        const diff = value - startVal;
        if (diff === 0) return;
        let elapsed = 0;
        const duration = 0.5;
        this.schedule((dt: number) => {
            elapsed += dt;
            const t = Math.min(1, elapsed / duration);
            const current = Math.floor(startVal + diff * t);
            this.copperLabel!.string = String(current);
        }, 0, Math.ceil(duration / 0.016), 0);
    }

    /** 背景颜色渐变（昼夜系统） */
    changeBackground(timeOfDay: string): void {
        if (!this.background) return;
        const colorMap: Record<string, Color> = {
            morning: new Color(232, 213, 181),
            noon: new Color(245, 235, 210),
            evening: new Color(200, 150, 100),
            night: new Color(40, 40, 80),
        };
        const targetColor = colorMap[timeOfDay] ?? colorMap['morning'];
        this.background.color = targetColor;
    }
}
