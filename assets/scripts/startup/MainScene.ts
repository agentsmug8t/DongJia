// 文件路径：assets/scripts/startup/MainScene.ts

import {
    _decorator, Component, Node, Label, UITransform, Color, Size, Vec3,
    Graphics, Layers, HorizontalTextAlignment, VerticalTextAlignment,
    Overflow, tween
} from 'cc';
import { Logger } from 'db://assets/scripts/core/utils/Logger';
import { EventManager } from 'db://assets/scripts/core/manager/EventManager';
import { PlayerModel } from 'db://assets/scripts/modules/player/model/PlayerModel';
import { PlayerEvent } from 'db://assets/scripts/core/constants/EventTypes';
import { HomeView } from 'db://assets/scripts/modules/home/HomeView';
import { ShopView } from 'db://assets/scripts/modules/shop/view/ShopView';
import { GuildView } from 'db://assets/scripts/modules/guild/view/GuildView';
import { PlayerInfoView } from 'db://assets/scripts/modules/player/view/PlayerInfoView';

const { ccclass } = _decorator;

/** Tab 定义 */
interface TabDef {
    label: string;
    icon: string;
    viewClass: typeof Component;
}

const TABS: TabDef[] = [
    { label: '首页', icon: '🏠', viewClass: HomeView },
    { label: '食铺', icon: '🍜', viewClass: ShopView },
    { label: '联盟', icon: '🏰', viewClass: GuildView },
    { label: '我的', icon: '👤', viewClass: PlayerInfoView },
];

@ccclass('MainScene')
export class MainScene extends Component {

    private _contentArea: Node | null = null;
    private _currentTab: number = -1;
    private _currentView: Node | null = null;
    private _tabNodes: Node[] = [];
    private _tabLabels: Label[] = [];
    private _tabGfxList: Graphics[] = [];

    // TopBar labels
    private _nicknameLabel: Label | null = null;
    private _levelLabel: Label | null = null;
    private _copperLabel: Label | null = null;
    private _silverLabel: Label | null = null;

    private _em = EventManager.getInstance();
    private _pm = PlayerModel.getInstance();

    // ─── 生命周期 ─────────────────────────────────────────────

    onLoad(): void {
        this._initDemoData();
        this._buildUI();
        this._bindEvents();
        // 默认显示首页
        this._switchTab(0);
    }

    onDestroy(): void {
        this._em.offAll(this);
    }

    // ─── 演示数据 ─────────────────────────────────────────────

    private _initDemoData(): void {
        // 如果 PlayerModel 无数据，填入演示值
        if (!this._pm.nickname) {
            this._pm.initFromServer({
                id: 'demo_001',
                nickname: '张掌柜',
                level: 5,
                avatar: '',
                copper: 2580,
                silver: 128,
                prestige: 360,
                title: '老牌掌柜',
                exp: 350,
            });
        }
    }

    // ─── UI 构建 ──────────────────────────────────────────────

    private _buildUI(): void {
        const root = this.node;

        // 全屏背景
        const bg = this._makeNode('Background', root);
        bg.addComponent(UITransform).setContentSize(new Size(960, 640));
        const bgGfx = bg.addComponent(Graphics);
        bgGfx.fillColor = new Color(30, 30, 52);
        bgGfx.rect(-480, -320, 960, 640);
        bgGfx.fill();

        // === TopBar (960×60) ===
        const topBar = this._makeNode('TopBar', root);
        topBar.setPosition(new Vec3(0, 290, 0));
        topBar.addComponent(UITransform).setContentSize(new Size(960, 60));
        const tbGfx = topBar.addComponent(Graphics);
        tbGfx.fillColor = new Color(25, 25, 45, 220);
        tbGfx.rect(-480, -30, 960, 60);
        tbGfx.fill();

        // 头像按钮
        const avatarBtn = this._makeNode('AvatarBtn', topBar);
        avatarBtn.setPosition(new Vec3(-420, 0, 0));
        avatarBtn.addComponent(UITransform).setContentSize(new Size(40, 40));
        const avGfx = avatarBtn.addComponent(Graphics);
        avGfx.fillColor = new Color(70, 70, 120);
        avGfx.circle(0, 0, 18);
        avGfx.fill();
        this._makeLabel(avatarBtn, 'AvEmoji', '👤', 20, Color.WHITE, Vec3.ZERO);
        avatarBtn.on(Node.EventType.TOUCH_END, () => {
            Logger.info('MainScene', '点击头像 → 切换到玩家信息');
            this._switchTab(3); // 切到"我的"
        }, this);

        // 昵称 + 等级
        this._nicknameLabel = this._makeLabel(topBar, 'Nickname',
            this._pm.nickname || '掌柜', 18,
            new Color(255, 240, 200), new Vec3(-340, 8, 0));
        this._levelLabel = this._makeLabel(topBar, 'Level',
            `Lv.${this._pm.level}`, 13,
            new Color(255, 215, 0, 180), new Vec3(-340, -12, 0));

        // 铜钱
        this._makeLabel(topBar, 'CopperIcon', '💰', 16,
            Color.WHITE, new Vec3(200, 0, 0));
        this._copperLabel = this._makeLabel(topBar, 'CopperVal',
            String(this._pm.copper), 16,
            new Color(255, 215, 0), new Vec3(260, 0, 0));

        // 银两
        this._makeLabel(topBar, 'SilverIcon', '🥈', 16,
            Color.WHITE, new Vec3(340, 0, 0));
        this._silverLabel = this._makeLabel(topBar, 'SilverVal',
            String(this._pm.silver), 16,
            new Color(200, 200, 220), new Vec3(400, 0, 0));

        // 设置按钮
        const settingBtn = this._makeNode('SettingBtn', topBar);
        settingBtn.setPosition(new Vec3(440, 0, 0));
        settingBtn.addComponent(UITransform).setContentSize(new Size(36, 36));
        this._makeLabel(settingBtn, 'SettingIcon', '⚙', 22,
            new Color(180, 180, 200), Vec3.ZERO);
        settingBtn.on(Node.EventType.TOUCH_END, () => {
            Logger.info('MainScene', '打开设置');
            // TODO: 弹出 SettingView
        }, this);

        // === Content Area (960×520) ===
        this._contentArea = this._makeNode('ContentArea', root);
        this._contentArea.setPosition(new Vec3(0, -10, 0));
        this._contentArea.addComponent(UITransform).setContentSize(new Size(960, 520));

        // === Bottom Tab Bar (960×60) ===
        const tabBar = this._makeNode('TabBar', root);
        tabBar.setPosition(new Vec3(0, -290, 0));
        tabBar.addComponent(UITransform).setContentSize(new Size(960, 60));
        const tabBgGfx = tabBar.addComponent(Graphics);
        tabBgGfx.fillColor = new Color(20, 20, 40, 240);
        tabBgGfx.rect(-480, -30, 960, 60);
        tabBgGfx.fill();

        // 4个 Tab 按钮
        const tabWidth = 240;
        for (let i = 0; i < TABS.length; i++) {
            const tab = TABS[i];
            const x = -360 + i * tabWidth;
            const tabNode = this._makeNode(`Tab_${i}`, tabBar);
            tabNode.setPosition(new Vec3(x, 0, 0));
            tabNode.addComponent(UITransform).setContentSize(new Size(tabWidth, 60));

            // Tab 背景
            const tGfx = tabNode.addComponent(Graphics);
            this._tabGfxList.push(tGfx);

            // Tab 图标 + 文字
            this._makeLabel(tabNode, 'Icon', tab.icon, 22,
                Color.WHITE, new Vec3(0, 8, 0));
            const lbl = this._makeLabel(tabNode, 'Text', tab.label, 12,
                new Color(120, 120, 140), new Vec3(0, -14, 0));
            this._tabLabels.push(lbl);
            this._tabNodes.push(tabNode);

            const idx = i;
            tabNode.on(Node.EventType.TOUCH_END, () => {
                this._switchTab(idx);
            }, this);
        }
    }

    // ─── Tab 切换 ─────────────────────────────────────────────

    private _switchTab(index: number): void {
        if (index === this._currentTab) return;

        // 销毁旧视图
        if (this._currentView) {
            this._currentView.removeFromParent();
            this._currentView.destroy();
            this._currentView = null;
        }

        this._currentTab = index;
        this._updateTabStyle();

        // 创建新视图
        if (!this._contentArea) return;
        const tab = TABS[index];
        const viewNode = this._makeNode(`View_${tab.label}`, this._contentArea);
        viewNode.addComponent(UITransform).setContentSize(new Size(960, 520));
        viewNode.addComponent(tab.viewClass as any);
        this._currentView = viewNode;

        // 入场动画：从右侧滑入
        viewNode.setPosition(new Vec3(100, 0, 0));
        tween(viewNode)
            .to(0.2, { position: new Vec3(0, 0, 0) }, { easing: 'sineOut' })
            .start();

        Logger.info('MainScene', `切换到 Tab: ${tab.label}`);
    }

    /** 更新 Tab 样式 */
    private _updateTabStyle(): void {
        for (let i = 0; i < TABS.length; i++) {
            const active = i === this._currentTab;
            const gfx = this._tabGfxList[i];
            const lbl = this._tabLabels[i];

            gfx.clear();
            if (active) {
                gfx.fillColor = new Color(255, 215, 0, 30);
                gfx.roundRect(-120, -30, 240, 60, 4);
                gfx.fill();
                // 顶部指示条
                gfx.fillColor = new Color(255, 215, 0);
                gfx.roundRect(-30, 26, 60, 3, 1);
                gfx.fill();
            }

            lbl.color = active ? new Color(255, 215, 0) : new Color(120, 120, 140);
        }
    }

    // ─── 事件绑定 ─────────────────────────────────────────────

    private _bindEvents(): void {
        this._em.on(PlayerEvent.CopperChanged, this._refreshCopper, this);
        this._em.on(PlayerEvent.SilverChanged, this._refreshSilver, this);
        this._em.on(PlayerEvent.LevelUp, this._refreshLevel, this);
        this._em.on(PlayerEvent.DataUpdated, this._refreshAll, this);
        this._em.on('home:switch_tab', this._onSwitchTabFromHome, this);
    }

    private _refreshCopper(): void {
        if (this._copperLabel) this._copperLabel.string = String(this._pm.copper);
    }

    private _refreshSilver(): void {
        if (this._silverLabel) this._silverLabel.string = String(this._pm.silver);
    }

    private _refreshLevel(): void {
        if (this._levelLabel) this._levelLabel.string = `Lv.${this._pm.level}`;
    }

    private _refreshAll(): void {
        this._refreshCopper();
        this._refreshSilver();
        this._refreshLevel();
        if (this._nicknameLabel) this._nicknameLabel.string = this._pm.nickname || '掌柜';
    }

    private _onSwitchTabFromHome(tabIdx: number): void {
        this._switchTab(tabIdx);
    }

    // ─── 工具方法 ──────────────────────────────────────────────

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
        n.addComponent(UITransform).setContentSize(new Size(300, fontSize + 10));
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
